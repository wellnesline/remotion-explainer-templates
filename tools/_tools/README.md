# tools/_tools/

解説動画向けの合成パイプラインツール。

## `synth_pipeline.py` — 合成 + 自己検証 + 修正(`fix` サブコマンド)

ElevenLabs eleven_v3 の誤読を **Whisper STT で round-trip 検証** して PASS/WARN/FAIL を判定し、`fix` サブコマンドで該当行のみ再合成するパイプライン(検証コマンドの自動再合成ループは既定で無効。ただし `synth-section` は例外。下記「修正の動作」)。

### 仕組み

```
caption (漢字)        speech (kana_dict 適用後)
"雲の動きを見る。"     →     "くものうごきをみる。"
                              ↓
                      ElevenLabs eleven_v3
                              ↓
                          mp3 audio
                              ↓
                      OpenAI Whisper STT
                              ↓
                  transcribed (Whisper が起こした text)
                              ↓
       caption / speech それぞれの sim を別閾値で判定
                              ↓
                ┌─────────┬─────────┬─────────┐
               PASS      WARN       FAIL
                                      → 人間レビュー / `fix` で再合成
```

### 評価ロジック

- caption(漢字) と transcribed の文字 sim も比較する
- speech(ひらがな化後) と transcribed の文字 sim も比較する
- 判定は caption 用と speech 用の別閾値で行い、どちらかが PASS 閾値を超えれば PASS（Whisper が漢字に戻して起こす場合と ひらがなのまま起こす場合の両対応)

### 使い方

#### 1) 単発検証(既存 mp3 をチェック)
```bash
python tools/_tools/synth_pipeline.py verify \
    --audio remotion/explainer/public/audio/sample_s1_l01.mp3 \
    --caption "雲の動きを見る。"
```

出力例:
```
caption: 雲の動きを見る。
speech (kana_dict applied): くものうごきをみる。
audio: remotion/explainer/public/audio/sample_s1_l01.mp3
transcribed: 雲の動きを見る
sim_speech: 0.0
sim_caption: 1.0
sim_max: 1.0
status: PASS
```

#### 2) 一括 synth + verify(slides.json から)
```bash
python tools/_tools/synth_pipeline.py synth \
    --slides tools/<channel>/videos/<slug>/slides_mvp.json \
    --voice voice_a \
    --out-dir remotion/explainer/public/audio \
    --report remotion/explainer/public/audio/verification_report.json \
    --limit 6
```

出力例:
```
Synthesizing + verifying 6 lines via voice_a ...
  model_id: eleven_v3
  language_code: ja

  ✅ title_card_sample_l01 (1 attempts)
      caption: 雲の動きを見る。
      speech : くものうごきをみる。
      heard  : 雲の動きを見る
      sim    : 1.0 (PASS)
  ...

=== Summary: 6 PASS / 0 WARN / 0 FAIL ===
```

#### 2b) セクション単位の合成（`synth-section`）
セクション単位で合成し、タイムスタンプ付きで行と時間の対応を作る。オプションは `synth` と同様（`--skip-verify` で Whisper 検証を省略）。
```bash
python tools/_tools/synth_pipeline.py synth-section \
    --slides tools/<channel>/videos/<slug>/slides_mvp.json \
    --out-dir remotion/explainer/public/audio \
    --report remotion/explainer/public/audio/verification_report.json
```

#### 2c) FAIL/WARN 行だけ再合成（`fix`）
既存の report から対象行を取り出し、`kana_dict` を再読み込みして該当行のみ再合成する（1回のみ）。
```bash
python tools/_tools/synth_pipeline.py fix \
    --report remotion/explainer/public/audio/verification_report.json \
    --out-dir remotion/explainer/public/audio \
    --statuses FAIL,WARN
```

#### 3) 既存 mp3 群を一括検証(再合成しない)
```bash
python tools/_tools/synth_pipeline.py verify-batch \
    --audio-dir remotion/explainer/public/audio \
    --expected expected.json \
    --report verify_report.json
```

`expected.json` フォーマット:
```json
[
  {"line_id": "sample_s1_l01", "caption": "雲の動きを見る。", "speech": "くものうごきをみる。"},
  ...
]
```

### 修正の動作

検証コマンドは、既定（`MAX_RETRIES = 0`）では自動の再合成を行わない。FAIL/WARN の行はレポートに記録され、人間レビュー対象になる。
`fix` サブコマンドで該当行のみ再合成できる（eleven_v3 はランダム性ありなので結果が変わる可能性）。

例外として `synth-section` だけは、合成した音声の暴走（文字/秒が 3.0 未満 = 異常に遅い）を検出すると、seed を変えて最大 4 回まで自動で再合成する（再合成のたびに従量課金。`--skip-verify` 指定時はこの再合成を行わない）。

人間側の対処:
- `kana_dict.yaml` に難読語を追加(同種の単語が再発しないため)
- voice 切替検討(voice_a→別 voice)

### 閾値(`synth_pipeline.py` 上部定数)

```python
THRESHOLD_CAPTION_PASS = 0.65  # caption との sim がこれ以上で PASS
THRESHOLD_SPEECH_PASS = 0.85   # speech との sim がこれ以上で PASS
THRESHOLD_CAPTION_WARN = 0.45  # caption との sim がこれ以上で WARN
THRESHOLD_SPEECH_WARN = 0.70   # speech との sim がこれ以上で WARN(どれも満たさなければ FAIL)
MAX_RETRIES = 0                # 自動再合成の回数（0 = しない。`fix` で手動再合成）
```

### コスト

- ElevenLabs: 合成コストは行数に比例
- OpenAI Whisper: 従量課金(検証コスト)

### 関連
- `tools/kana_dict.yaml` — 辞書本体
- `tools/voices.yaml` — voice presets
- 合成ルールの設計文書(非同梱)
