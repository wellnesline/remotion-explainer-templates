"""
synth_pipeline.py — Remotion系チャンネル ElevenLabs 合成 + Whisper STT 検証 自己修正パイプライン

目的:
    eleven_v3 の誤読を自動検知 → kana_dict 自動適用 → 失敗はレポートに記録(`fix` サブコマンドで該当行のみ再合成)。

フロー:
    1. caption(原文)を kana_dict.yaml に従って speech(合成用)に変換
    2. ElevenLabs eleven_v3 で speech を mp3 合成
    3. OpenAI Whisper API で mp3 → text 起こし(検証)
    4. transcribed を caption と speech の両方と比較(char similarity)
       - max(sim_to_caption, sim_to_speech) で評価
       - caption 側 0.65 / speech 側 0.85 以上 = PASS、caption 側 0.45 / speech 側 0.70 以上 = WARN、それ未満 = FAIL
    5. 自動再合成は既定で無効(MAX_RETRIES = 0)。必要なら `fix` で該当行のみ再合成(eleven_v3 はランダム性あり)。例外: synth-section は音声の暴走検出時に seed を変えて最大 4 回再合成する(従量課金。--skip-verify で無効)
    6. 最終的に FAIL のままなら、レポートに記録して人間レビュー対象に

検証ロジック:
    - kanji の caption と hiragana の speech は文字レベル sim が低くなるため、両方と比較
    - normalize: NFKC + 句読点除去 + カタカナ→ひらがな統一
    - PASS = ElevenLabs が「caption の意図通り」発音できた = Whisper が caption に近い text を起こせた

使い方:
    # 単発検証(既存 mp3 をチェック)
    python tools/_tools/synth_pipeline.py verify \\
        --audio remotion/explainer/public/audio/sample_s1_l01.mp3 \\
        --caption "雲の動きを見る。"

    # 一括 synth + verify(slides.json から)
    python tools/_tools/synth_pipeline.py synth \\
        --slides tools/<channel>/videos/<slug>/slides_mvp.json \\
        --voice voice_a \\
        --out-dir remotion/explainer/public/audio \\
        --report verification_report.json
"""

from __future__ import annotations

import argparse
import difflib
import hashlib
import json
import os
import pathlib
import re
import sys
import time
import unicodedata
import urllib.error
import urllib.request
from typing import Optional

import yaml

# ============================================================
# Path / Config
# ============================================================

ROOT = pathlib.Path(__file__).resolve().parents[2]
KANA_DICT_PATH = ROOT / "tools" / "kana_dict.yaml"
VOICES_PATH = ROOT / "tools" / "voices.yaml"

# Verification thresholds (char similarity 0.0-1.0)
# caption(kanji)とのマッチは弱閾値で十分(Whisperが正しく漢字に戻すなら強い PASS シグナル)
# speech(hiragana)とのマッチは強閾値必要(漢字と char overlap 偶然マッチがあるため)
THRESHOLD_CAPTION_PASS = 0.65
THRESHOLD_SPEECH_PASS = 0.85
THRESHOLD_CAPTION_WARN = 0.45
THRESHOLD_SPEECH_WARN = 0.70

# Synthesis retry — default 0 でコスト節約
# FAIL は report に記録され、人間が kana_dict を更新してから `fix` サブコマンドで再合成する運用
MAX_RETRIES = 0

# ============================================================
# Env loader (.env)
# ============================================================

sys.path.insert(0, str((ROOT / "src").resolve()))
try:
    from _dotenv import load_dotenv
    load_dotenv()
except Exception:
    pass

ELEVENLABS_API_KEY = os.environ.get("ELEVENLABS_API_KEY")
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")

# ============================================================
# kana_dict / voices loaders
# ============================================================

def load_kana_dict() -> tuple[dict, list]:
    with open(KANA_DICT_PATH) as f:
        d = yaml.safe_load(f)
    mappings = d["mappings"]
    sorted_keys = sorted(mappings.keys(), key=len, reverse=True)
    return mappings, sorted_keys

def apply_kana_dict(text: str, mappings: dict, sorted_keys: list) -> str:
    out = text
    for k in sorted_keys:
        out = out.replace(k, mappings[k])
    return out

def load_voices(voice_name: str = "voice_a") -> tuple[str, dict]:
    """voices.yaml から voice_id + defaults を取得。
    voice 個別の `voice_settings` `seed` `model_id` 等があれば defaults にマージ上書き
    (documentary_uplifting で style 0.45 override 用)。
    """
    with open(VOICES_PATH) as f:
        d = yaml.safe_load(f)
    defaults = dict(d["defaults"])
    voice = d["voices"][voice_name]
    # 個別 override マージ
    for k in ("model_id", "language_code", "seed", "output_format"):
        if k in voice:
            defaults[k] = voice[k]
    if "voice_settings" in voice:
        merged_vs = dict(defaults.get("voice_settings", {}))
        merged_vs.update(voice["voice_settings"])
        defaults["voice_settings"] = merged_vs
    return voice["voice_id"], defaults


# design_template → voice 自動解決 table。
# 新 theme を追加した時はここに足す。 explicit `--voice` 指定時は本 table を bypass。
# (single source of truth、 これがあれば new session でも slides 1 つ覗くだけで voice 決まる)
TEMPLATE_VOICE_MAP = {
    "documentary_serious": "voice_a",
    "documentary_uplifting": "voice_b",
}


def resolve_voice_from_slides(slides_path: pathlib.Path, explicit_voice: str | None = None) -> str:
    """slides.json の `design_template` から voice を auto-pick。
    - explicit_voice が "auto" 以外なら明示指定をそのまま採用
    - "auto" or None なら TEMPLATE_VOICE_MAP で解決
    - unknown template は voice_a fallback + stderr に WARN
    """
    if explicit_voice and explicit_voice != "auto":
        return explicit_voice
    try:
        with open(slides_path) as f:
            d = json.load(f)
        template = d.get("design_template")
    except Exception as e:
        print(f"[voice-resolve] slides 読み込み失敗 ({e})、 voice_a fallback", file=sys.stderr)
        return "voice_a"
    if not template:
        print(f"[voice-resolve] design_template 未設定、 voice_a fallback", file=sys.stderr)
        return "voice_a"
    voice = TEMPLATE_VOICE_MAP.get(template)
    if not voice:
        print(f"[voice-resolve] unknown template '{template}'、 voice_a fallback。 TEMPLATE_VOICE_MAP に追加すべし", file=sys.stderr)
        return "voice_a"
    print(f"[voice-resolve] design_template={template} → voice={voice}", file=sys.stderr)
    return voice

# ============================================================
# ElevenLabs synth
# ============================================================

def synth_line(
    voice_id: str,
    text: str,
    defaults: dict,
    previous_text: Optional[str] = None,
    next_text: Optional[str] = None,
) -> bytes:
    """ElevenLabs synthesis with optional previous/next context for prosody continuity."""
    if not ELEVENLABS_API_KEY:
        raise RuntimeError("ELEVENLABS_API_KEY not set")
    payload = {
        "text": text,
        "model_id": defaults["model_id"],
        "language_code": defaults["language_code"],
        "voice_settings": defaults["voice_settings"],
    }
    if "seed" in defaults:
        payload["seed"] = defaults["seed"]
    if previous_text:
        payload["previous_text"] = previous_text
    if next_text:
        payload["next_text"] = next_text
    body = json.dumps(payload).encode()
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}?output_format={defaults['output_format']}"
    req = urllib.request.Request(
        url, data=body,
        headers={"xi-api-key": ELEVENLABS_API_KEY, "Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req, timeout=180) as r:
        return r.read()

# ============================================================
# OpenAI Whisper STT
# ============================================================

def _build_multipart(fields: dict, file_field: str, file_path: pathlib.Path, mime: str = "audio/mpeg") -> tuple[bytes, str]:
    boundary = "----FormBoundary" + hashlib.md5(str(time.time()).encode()).hexdigest()
    parts = []
    for k, v in fields.items():
        parts.append(f"--{boundary}\r\n".encode())
        parts.append(f'Content-Disposition: form-data; name="{k}"\r\n\r\n'.encode())
        parts.append(str(v).encode())
        parts.append(b"\r\n")
    parts.append(f"--{boundary}\r\n".encode())
    parts.append(f'Content-Disposition: form-data; name="{file_field}"; filename="{file_path.name}"\r\n'.encode())
    parts.append(f'Content-Type: {mime}\r\n\r\n'.encode())
    parts.append(file_path.read_bytes())
    parts.append(b"\r\n")
    parts.append(f"--{boundary}--\r\n".encode())
    return b"".join(parts), boundary

def synth_with_timestamps(voice_id: str, text: str, defaults: dict) -> tuple[bytes, dict]:
    """ElevenLabs /with-timestamps endpoint.
    Returns (audio_bytes, alignment_dict).
    alignment: {characters, character_start_times_seconds, character_end_times_seconds}
    """
    if not ELEVENLABS_API_KEY:
        raise RuntimeError("ELEVENLABS_API_KEY not set")
    payload = {
        "text": text,
        "model_id": defaults["model_id"],
        "language_code": defaults["language_code"],
        "voice_settings": defaults["voice_settings"],
    }
    if "seed" in defaults:
        payload["seed"] = defaults["seed"]
    body = json.dumps(payload).encode()
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/with-timestamps?output_format={defaults['output_format']}"
    req = urllib.request.Request(
        url, data=body,
        headers={"xi-api-key": ELEVENLABS_API_KEY, "Content-Type": "application/json"}
    )
    import base64 as _b64
    with urllib.request.urlopen(req, timeout=300) as r:
        resp = json.loads(r.read())
    audio_b64 = resp.get("audio_base64") or resp.get("audio_base_64")
    audio_bytes = _b64.b64decode(audio_b64)
    # Prefer normalized_alignment if available (matches what was actually spoken)
    alignment = resp.get("normalized_alignment") or resp.get("alignment")
    return audio_bytes, alignment

def transcribe_whisper(mp3_path: pathlib.Path, language: str = "ja") -> str:
    if not OPENAI_API_KEY:
        raise RuntimeError("OPENAI_API_KEY not set")
    body, boundary = _build_multipart(
        {"model": "whisper-1", "language": language},
        "file", mp3_path, "audio/mpeg"
    )
    req = urllib.request.Request(
        "https://api.openai.com/v1/audio/transcriptions",
        data=body,
        headers={
            "Authorization": f"Bearer {OPENAI_API_KEY}",
            "Content-Type": f"multipart/form-data; boundary={boundary}",
        },
    )
    with urllib.request.urlopen(req, timeout=120) as r:
        resp = json.loads(r.read())
    return resp.get("text", "")

# ============================================================
# Normalization + similarity
# ============================================================

def _kata_to_hira(s: str) -> str:
    out = []
    for c in s:
        if "ァ" <= c <= "ヶ":
            out.append(chr(ord(c) - 0x60))
        else:
            out.append(c)
    return "".join(out)

def normalize(text: str) -> str:
    """正規化: NFKC + 句読点除去 + カタカナ→ひらがな + lowercase"""
    s = unicodedata.normalize("NFKC", text)
    s = re.sub(r"[\s　。、！？\?\!\.,「」『』〜・…—\-\(\)（）\[\]【】]", "", s)
    s = _kata_to_hira(s)
    return s.lower()

def char_similarity(a: str, b: str) -> float:
    if not a and not b:
        return 1.0
    return difflib.SequenceMatcher(None, a, b).ratio()

# ============================================================
# Verification
# ============================================================

def verify_audio(mp3_path: pathlib.Path, speech: str, caption: str) -> dict:
    """STT round-trip verification.
    speech: ElevenLabs に渡したテキスト(kana_dict 適用後)
    caption: 元の漢字版テキスト
    Whisper の transcribed を speech / caption の両方と比較し max を採用
    """
    transcribed = transcribe_whisper(mp3_path)
    n_speech = normalize(speech)
    n_caption = normalize(caption)
    n_trans = normalize(transcribed)
    sim_speech = char_similarity(n_speech, n_trans)
    sim_caption = char_similarity(n_caption, n_trans)
    # 別閾値で評価: caption一致はそのまま、speech一致は厳しめ(char偶然マッチ防止)
    if sim_caption >= THRESHOLD_CAPTION_PASS or sim_speech >= THRESHOLD_SPEECH_PASS:
        status = "PASS"
    elif sim_caption >= THRESHOLD_CAPTION_WARN or sim_speech >= THRESHOLD_SPEECH_WARN:
        status = "WARN"
    else:
        status = "FAIL"
    return {
        "transcribed": transcribed,
        "sim_speech": round(sim_speech, 3),
        "sim_caption": round(sim_caption, 3),
        "sim_max": round(max(sim_speech, sim_caption), 3),
        "status": status,
        "pass": status == "PASS",
    }

# ============================================================
# Synth + verify with auto-retry
# ============================================================

def synth_line_with_verify(
    line_id: str,
    caption: str,
    voice_id: str,
    defaults: dict,
    mappings: dict,
    sorted_keys: list,
    out_path: pathlib.Path,
    max_retries: int = MAX_RETRIES,
    previous_text: Optional[str] = None,
    next_text: Optional[str] = None,
) -> dict:
    """1 line synth → verify → retry on FAIL.
    previous_text/next_text を渡すことで eleven_v3 が文脈考慮した自然な prosody を生成する。
    """
    speech = apply_kana_dict(caption, mappings, sorted_keys)
    history = []
    for attempt in range(max_retries + 1):
        audio = synth_line(voice_id, speech, defaults, previous_text, next_text)
        out_path.write_bytes(audio)
        v = verify_audio(out_path, speech, caption)
        history.append({"attempt": attempt + 1, **v})
        if v["pass"]:
            break
    final_status = history[-1]["status"]
    return {
        "line_id": line_id,
        "caption": caption,
        "speech": speech,
        "status": final_status,
        "attempts": len(history),
        "history": history,
    }

# ============================================================
# CLI
# ============================================================

def cmd_verify(args):
    """既存 mp3 を検証(再合成しない、レポートのみ)"""
    audio = pathlib.Path(args.audio)
    caption = args.caption
    mappings, sorted_keys = load_kana_dict()
    speech = apply_kana_dict(caption, mappings, sorted_keys)
    print(f"caption: {caption}")
    print(f"speech (kana_dict applied): {speech}")
    print(f"audio: {audio}")
    v = verify_audio(audio, speech, caption)
    print(f"\ntranscribed: {v['transcribed']}")
    print(f"sim_speech: {v['sim_speech']}")
    print(f"sim_caption: {v['sim_caption']}")
    print(f"sim_max: {v['sim_max']}")
    print(f"status: {v['status']}")

def cmd_synth(args):
    """slides.json から一括 synth + verify + report"""
    slides_path = pathlib.Path(args.slides)
    out_dir = pathlib.Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    args.voice = resolve_voice_from_slides(slides_path, args.voice)
    voice_id, defaults = load_voices(args.voice)
    mappings, sorted_keys = load_kana_dict()

    with open(slides_path) as f:
        slides_data = json.load(f)

    # Extract line items
    items = []
    for slide in slides_data.get("slides", []):
        if not isinstance(slide, dict):
            continue
        scene_type = slide.get("scene_type", "unknown")
        for li, line in enumerate(slide.get("lines", []), 1):
            caption = line.get("caption", "")
            line_id = f"{scene_type}_{slide.get('title','')[:8]}_l{li:02d}"
            line_id = re.sub(r"[^\w\-]", "_", line_id)
            items.append((line_id, caption))

    if args.limit:
        items = items[:args.limit]

    print(f"Synthesizing + verifying {len(items)} lines via {args.voice} ({voice_id}) ...")
    print(f"  model_id: {defaults['model_id']}")
    print(f"  language_code: {defaults['language_code']}")
    if "seed" in defaults:
        print(f"  seed: {defaults['seed']}")
    print()

    # eleven_v3 は previous_text/next_text 未対応 → 渡さない(確認)
    # 短句の prosody 連続性は、台本側で短い line を隣接行と結合する方式で対処
    results = []
    for line_id, caption in items:
        out_path = out_dir / f"{line_id}.mp3"
        r = synth_line_with_verify(
            line_id, caption, voice_id, defaults, mappings, sorted_keys, out_path,
        )
        results.append(r)
        last = r["history"][-1]
        marker = {"PASS": "✅", "WARN": "⚠️ ", "FAIL": "❌"}[last["status"]]
        print(f"  {marker} {line_id} ({r['attempts']} attempts)")
        print(f"      caption: {caption}")
        print(f"      speech : {r['speech']}")
        print(f"      heard  : {last['transcribed']}")
        print(f"      sim    : {last['sim_max']} ({last['status']})")
        print()

    # Summary
    n_pass = sum(1 for r in results if r["status"] == "PASS")
    n_warn = sum(1 for r in results if r["status"] == "WARN")
    n_fail = sum(1 for r in results if r["status"] == "FAIL")
    print(f"\n=== Summary: {n_pass} PASS / {n_warn} WARN / {n_fail} FAIL ===")

    if args.report:
        report_path = pathlib.Path(args.report)
        report_path.parent.mkdir(parents=True, exist_ok=True)
        report_path.write_text(json.dumps({
            "voice": args.voice,
            "voice_id": voice_id,
            "model": defaults["model_id"],
            "language_code": defaults["language_code"],
            "summary": {"pass": n_pass, "warn": n_warn, "fail": n_fail, "total": len(results)},
            "results": results,
        }, ensure_ascii=False, indent=2))
        print(f"Report: {report_path}")

    if n_fail > 0:
        print("\n⚠️  FAIL を検出:")
        for r in results:
            if r["status"] == "FAIL":
                print(f"  - {r['line_id']}: {r['caption']}")
                print(f"    heard: {r['history'][-1]['transcribed']}")
                print(f"    対処: kana_dict.yaml に追加検討。例: {r['caption']}: <ひらがな>")

def cmd_synth_section(args):
    """セクション単位で合成 + with-timestamps で line→time マッピング生成。
    A-2 方式: section audio をそのまま 1ファイル保存し、Remotion 側で <Audio> 1つ + 字幕 Sequence 複数で再生。
    """
    slides_path = pathlib.Path(args.slides)
    out_dir = pathlib.Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    args.voice = resolve_voice_from_slides(slides_path, args.voice)
    voice_id, defaults = load_voices(args.voice)
    mappings, sorted_keys = load_kana_dict()

    with open(slides_path) as f:
        slides_data = json.load(f)

    print(f"Section-level synth via {args.voice} ({voice_id}) [model={defaults['model_id']}]")
    if "seed" in defaults:
        print(f"  seed: {defaults['seed']}")
    print()

    sections = []
    for slide in slides_data.get("slides", []):
        if not isinstance(slide, dict):
            continue
        sections.append(slide)
    if args.limit:
        sections = sections[:args.limit]

    overall_results = []
    for sec_idx, slide in enumerate(sections, 1):
        title = slide.get("title", f"section_{sec_idx}")
        scene_type = slide.get("scene_type", "unknown")
        safe_title = re.sub(r"[^\w\-]", "_", title)[:30]
        section_id = f"section_{sec_idx:02d}_{scene_type}_{safe_title}"

        # Build concatenated speech, track line offsets (char indices in combined_speech)
        # update (試聴 feedback):
        # - line.speech 提供は **非推奨** (script writer が読点を多く詰めると音声がもったり)
        # - 原則 caption-only。 必要なら kana_dict.yaml で長音/英字略称を補正
        # - 後方互換のため speech 受け付けは継続するが WARN を出す
        line_speeches = []
        line_captions = []
        line_offsets = []  # (start_char, end_char)
        combined = ""
        for li, line in enumerate(slide["lines"]):
            if "speech" in line and line["speech"]:
                # 非推奨: 後方互換のため受け入れ、 WARN
                print(f"  ⚠️  WARN: slide {sec_idx} line {li} has 'speech' field (deprecated). "
                      f"Use caption-only + kana_dict.yaml for read-aloud correction.")
                speech = line["speech"]
            else:
                # 標準: caption から kana_dict 適用
                speech = apply_kana_dict(line["caption"], mappings, sorted_keys)
            start_idx = len(combined)
            combined += speech
            end_idx = len(combined)
            line_speeches.append(speech)
            line_captions.append(line["caption"])
            line_offsets.append((start_idx, end_idx))

        # Synth with timestamps + eleven_v3 暴走 auto-retry (過去事故由来)
        # eleven_v3 は同一 seed でも特定 text pattern で 4-10x の暴走 mp3 を返すことがある。
        # 発話速度が期待値 (4-7 char/sec) を大きく下回る(音声が異常に長い)場合は、別 seed で最大 4 回(RETRY_SEEDS)まで retry。
        EXPECTED_CPS_MIN = 3.0  # 3 char/sec 以下 = 暴走疑い (1 char に 0.33s+ 掛けている)
        RETRY_SEEDS = [7, 13, 99, 2024]
        audio_bytes = None
        alignment = None
        used_seed = defaults.get("seed")
        n_input_chars = len(combined)
        try:
            audio_bytes, alignment = synth_with_timestamps(voice_id, combined, defaults)
        except urllib.error.HTTPError as e:
            err = e.read().decode("utf-8", errors="replace")[:300]
            print(f"  ❌ {section_id}: HTTP {e.code} {err}")
            continue
        # 暴走判定
        ends_for_check = alignment.get("character_end_times_seconds", [])
        dur_check = ends_for_check[-1] if ends_for_check else 0.0
        cps_check = n_input_chars / dur_check if dur_check > 0 else 999
        if cps_check < EXPECTED_CPS_MIN and not args.skip_verify:
            print(f"  ⚠️  {section_id}: eleven_v3 暴走疑い (cps {cps_check:.2f} < {EXPECTED_CPS_MIN}, dur {dur_check:.1f}s). seed 変更 retry")
            for rs in RETRY_SEEDS:
                d_retry = dict(defaults)
                d_retry["seed"] = rs
                try:
                    ab, al = synth_with_timestamps(voice_id, combined, d_retry)
                except urllib.error.HTTPError as e:
                    print(f"     seed {rs}: HTTP {e.code}")
                    continue
                ends_r = al.get("character_end_times_seconds", [])
                dur_r = ends_r[-1] if ends_r else 0.0
                cps_r = n_input_chars / dur_r if dur_r > 0 else 999
                print(f"     seed {rs}: cps {cps_r:.2f}, dur {dur_r:.1f}s")
                if cps_r >= EXPECTED_CPS_MIN:
                    audio_bytes, alignment, used_seed = ab, al, rs
                    print(f"     ✅ seed {rs} 採用")
                    break

        audio_path = out_dir / f"{section_id}.mp3"
        audio_path.write_bytes(audio_bytes)

        # Compute line timings from alignment
        chars = alignment.get("characters", [])
        starts = alignment.get("character_start_times_seconds", [])
        ends = alignment.get("character_end_times_seconds", [])
        n_align = len(chars)
        n_input = len(combined)

        line_timings = []
        for i, (s, e) in enumerate(line_offsets):
            # Map input char idx → alignment char idx (handle length mismatch via proportional fallback)
            if n_align == n_input:
                a_s, a_e = s, e
            else:
                a_s = int(s * n_align / max(1, n_input))
                a_e = int(e * n_align / max(1, n_input))
            a_s = min(max(0, a_s), n_align - 1)
            a_e = min(max(a_s + 1, a_e), n_align)
            t_start = starts[a_s] if starts else 0.0
            t_end = ends[a_e - 1] if ends else 0.0
            line_timings.append({
                "line_idx": i,
                "caption": line_captions[i],
                "speech": line_speeches[i],
                "start_sec": round(t_start, 3),
                "end_sec": round(t_end, 3),
                "duration_sec": round(t_end - t_start, 3),
            })

        # Save timing JSON
        timing_path = out_dir / f"{section_id}_timing.json"
        timing_path.write_text(json.dumps({
            "section_idx": sec_idx,
            "section_title": title,
            "scene_type": scene_type,
            "audio_file": audio_path.name,
            "duration_sec": round(ends[-1] if ends else 0.0, 3),
            "n_lines": len(line_speeches),
            "n_chars_input": n_input,
            "n_chars_alignment": n_align,
            "used_seed": used_seed,
            "lines": line_timings,
        }, ensure_ascii=False, indent=2))

        # Verify whole section via Whisper
        transcribed = ""
        verify_status = "SKIP"
        sim = 0.0
        if not args.skip_verify:
            try:
                transcribed = transcribe_whisper(audio_path)
                n_caption = normalize("".join(line_captions))
                n_speech = normalize(combined)
                n_trans = normalize(transcribed)
                sim_caption = char_similarity(n_caption, n_trans)
                sim_speech = char_similarity(n_speech, n_trans)
                sim = max(sim_caption, sim_speech)
                if sim_caption >= 0.65 or sim_speech >= 0.85:
                    verify_status = "PASS"
                elif sim_caption >= 0.45 or sim_speech >= 0.70:
                    verify_status = "WARN"
                else:
                    verify_status = "FAIL"
            except Exception as e:
                verify_status = f"ERR({e})"

        marker = {"PASS": "✅", "WARN": "⚠️ ", "FAIL": "❌", "SKIP": "—"}.get(verify_status, "?")
        print(f"  {marker} {section_id}")
        print(f"      lines: {len(line_speeches)} / dur: {timing_path.stem.replace('_timing','')} {round(ends[-1] if ends else 0,1)}s")
        print(f"      audio: {audio_path.name} ({audio_path.stat().st_size//1024} KB)")
        print(f"      timing: {timing_path.name}")
        if verify_status != "SKIP":
            print(f"      verify: {verify_status} (sim {round(sim, 3)})")
        print()

        overall_results.append({
            "section_id": section_id,
            "audio": audio_path.name,
            "timing": timing_path.name,
            "verify_status": verify_status,
            "verify_sim": round(sim, 3),
            "n_lines": len(line_speeches),
            "duration_sec": round(ends[-1] if ends else 0.0, 3),
        })

    # Write summary
    if args.report:
        report_path = pathlib.Path(args.report)
        report_path.parent.mkdir(parents=True, exist_ok=True)
        report_path.write_text(json.dumps({
            "voice": args.voice,
            "voice_id": voice_id,
            "model": defaults["model_id"],
            "sections": overall_results,
        }, ensure_ascii=False, indent=2))
        print(f"Report: {report_path}")

    print(f"\n=== Section synth complete: {len(overall_results)} sections ===")

def cmd_fix(args):
    """既存 report.json から FAIL/WARN line を抽出 → kana_dict 再ロード → 該当 line のみ再合成"""
    report_path = pathlib.Path(args.report)
    out_dir = pathlib.Path(args.out_dir)
    report = json.loads(report_path.read_text())

    voice_id, defaults = load_voices(args.voice)
    mappings, sorted_keys = load_kana_dict()  # ← reload(更新後のdict反映)

    statuses = args.statuses.split(",")
    targets = [r for r in report["results"] if r["status"] in statuses]

    print(f"Re-synthesizing {len(targets)} lines (status in {statuses}) with updated kana_dict ...")
    print(f"  voice: {args.voice} ({voice_id})\n")

    new_results = []
    for r in targets:
        line_id = r["line_id"]
        caption = r["caption"]
        speech = apply_kana_dict(caption, mappings, sorted_keys)
        out_path = out_dir / f"{line_id}.mp3"
        audio = synth_line(voice_id, speech, defaults)
        out_path.write_bytes(audio)
        v = verify_audio(out_path, speech, caption)
        new_results.append({
            "line_id": line_id,
            "caption": caption,
            "speech": speech,
            "status": v["status"],
            "history": [{"attempt": 1, **v}],
            "attempts": 1,
        })
        marker = {"PASS": "✅", "WARN": "⚠️ ", "FAIL": "❌"}[v["status"]]
        print(f"  {marker} {line_id}")
        print(f"      caption: {caption}")
        print(f"      speech : {speech}")
        print(f"      heard  : {v['transcribed']}")
        print(f"      sim    : {v['sim_max']} ({v['status']})")
        print()

    # Merge new results back into report
    new_results_by_id = {r["line_id"]: r for r in new_results}
    merged = []
    for r in report["results"]:
        if r["line_id"] in new_results_by_id:
            merged.append(new_results_by_id[r["line_id"]])
        else:
            merged.append(r)
    n_pass = sum(1 for r in merged if r["status"] == "PASS")
    n_warn = sum(1 for r in merged if r["status"] == "WARN")
    n_fail = sum(1 for r in merged if r["status"] == "FAIL")
    new_report = {
        **report,
        "summary": {"pass": n_pass, "warn": n_warn, "fail": n_fail, "total": len(merged)},
        "results": merged,
    }
    out_report = pathlib.Path(args.out_report or args.report)
    out_report.write_text(json.dumps(new_report, ensure_ascii=False, indent=2))
    print(f"\n=== Updated Summary: {n_pass} PASS / {n_warn} WARN / {n_fail} FAIL ===")
    print(f"Report: {out_report}")

def cmd_verify_batch(args):
    """既存 mp3 群を一括検証(再合成しない)"""
    expected = json.loads(pathlib.Path(args.expected).read_text())
    results = []
    for item in expected:
        line_id = item["line_id"]
        caption = item["caption"]
        speech = item.get("speech", caption)
        audio_path = pathlib.Path(args.audio_dir) / f"{line_id}.mp3"
        if not audio_path.exists():
            print(f"  SKIP {line_id}: file not found")
            continue
        v = verify_audio(audio_path, speech, caption)
        results.append({
            "line_id": line_id,
            "caption": caption,
            "speech": speech,
            "audio": str(audio_path),
            **v,
        })
        marker = {"PASS": "✅", "WARN": "⚠️ ", "FAIL": "❌"}[v["status"]]
        print(f"  {marker} {line_id}")
        print(f"      caption: {caption}")
        print(f"      heard  : {v['transcribed']}")
        print(f"      sim    : {v['sim_max']} ({v['status']})")

    n_pass = sum(1 for r in results if r["status"] == "PASS")
    n_warn = sum(1 for r in results if r["status"] == "WARN")
    n_fail = sum(1 for r in results if r["status"] == "FAIL")
    print(f"\n=== Summary: {n_pass} PASS / {n_warn} WARN / {n_fail} FAIL ===")
    if args.report:
        pathlib.Path(args.report).write_text(json.dumps(results, ensure_ascii=False, indent=2))
        print(f"Report: {args.report}")

def main():
    ap = argparse.ArgumentParser(description="Remotion系 ElevenLabs 合成+Whisper検証 パイプライン")
    sub = ap.add_subparsers(dest="cmd", required=True)

    p_verify = sub.add_parser("verify", help="単発 mp3 を検証(再合成しない)")
    p_verify.add_argument("--audio", required=True, help="検証する mp3 パス")
    p_verify.add_argument("--caption", required=True, help="期待される caption テキスト(漢字版)")
    p_verify.set_defaults(func=cmd_verify)

    p_synth = sub.add_parser("synth", help="slides.json から一括 synth + verify")
    p_synth.add_argument("--slides", required=True, help="slides.json パス")
    p_synth.add_argument("--voice", default="auto", help="voices.yaml の voice 名。 'auto' で slides の design_template から自動解決 (documentary_serious→voice_a, documentary_uplifting→voice_b)")
    p_synth.add_argument("--out-dir", required=True, help="mp3 出力先")
    p_synth.add_argument("--limit", type=int, default=None, help="最初の N 行だけ処理")
    p_synth.add_argument("--report", default=None, help="検証レポート JSON 出力先")
    p_synth.set_defaults(func=cmd_synth)

    p_ss = sub.add_parser("synth-section", help="A-2方式: セクション単位合成 + with-timestamps で line→time マッピング生成")
    p_ss.add_argument("--slides", required=True)
    p_ss.add_argument("--voice", default="auto", help="voices.yaml の voice 名。 'auto' で slides の design_template から自動解決")
    p_ss.add_argument("--out-dir", required=True)
    p_ss.add_argument("--limit", type=int, default=None)
    p_ss.add_argument("--report", default=None)
    p_ss.add_argument("--skip-verify", action="store_true", help="Whisper 検証スキップ($節約)")
    p_ss.set_defaults(func=cmd_synth_section)

    p_fix = sub.add_parser("fix", help="既存 report の FAIL/WARN を辞書再適用 + 再合成(1回のみ)")
    p_fix.add_argument("--report", required=True, help="既存 report.json")
    p_fix.add_argument("--voice", default="voice_a")
    p_fix.add_argument("--out-dir", required=True)
    p_fix.add_argument("--statuses", default="FAIL,WARN", help="再合成対象 status カンマ区切り(default: FAIL,WARN)")
    p_fix.add_argument("--out-report", default=None, help="新 report の出力先(未指定時は --report を上書き)")
    p_fix.set_defaults(func=cmd_fix)

    p_vb = sub.add_parser("verify-batch", help="既存 mp3 群を一括検証")
    p_vb.add_argument("--audio-dir", required=True)
    p_vb.add_argument("--expected", required=True, help="[{line_id, caption, speech?}] JSON")
    p_vb.add_argument("--report", default=None)
    p_vb.set_defaults(func=cmd_verify_batch)

    args = ap.parse_args()
    args.func(args)

if __name__ == "__main__":
    main()
