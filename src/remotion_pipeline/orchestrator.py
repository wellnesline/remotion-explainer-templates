"""remotion_pipeline/orchestrator.py — 最小機能 Python parallel orchestrator.

最小機能:
- ProcessPoolExecutor で slug 単位の future 管理
- escalation 検知時、 該当 slug の future cancel、 他は継続
- disk monitor / queue / rate limit は本 module の責任外(別 component)

使い方:
    python -m remotion_pipeline.orchestrator \\
      --jobs channel-xx:<slug> \\
      --max-workers 4

各 slug を 1 future として spawn、 進捗 stdout で stream。
"""
from __future__ import annotations

import argparse
import sys
import time
from concurrent.futures import ProcessPoolExecutor, as_completed
from pathlib import Path
from typing import Final

REPO_ROOT: Final[Path] = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT / "src"))

from remotion_pipeline.escalation import has_escalation, read_escalation  # noqa: E402


def _run_slug(channel: str, slug: str) -> dict:
    """1 slug を build する(stub 実装、 実 render.py できたら差し替え)。

    現状は stub: log.yaml 存在確認 + escalation check のみ。
    """
    from remotion_pipeline.paths import log_yaml_path, final_mp4_path

    result = {
        "channel": channel,
        "slug": slug,
        "status": "unknown",
        "message": "",
    }
    if has_escalation(channel, slug):
        esc = read_escalation(channel, slug)
        result["status"] = "blocked_by_escalation"
        result["message"] = f"existing escalation: {esc.get('gate')} attempts={esc.get('attempts')}"
        return result

    if not log_yaml_path(channel, slug).parent.exists():
        result["status"] = "missing_topic_dir"
        result["message"] = f"topic dir not found"
        return result

    # 実 build はここに来る予定(F renderer 実装後に差し替え)
    # 現状は smoke: final.mp4 が既存ならスキップ判定
    if final_mp4_path(channel, slug).exists():
        result["status"] = "already_built"
        result["message"] = "final.mp4 exists, skipping"
        return result

    result["status"] = "would_build"
    result["message"] = "stub: actual render not implemented yet"
    return result


def main() -> int:
    parser = argparse.ArgumentParser(description="Remotion pipeline orchestrator")
    parser.add_argument(
        "--jobs",
        nargs="+",
        required=True,
        help="ch:slug 形式(例: channel-xx:<slug>)",
    )
    parser.add_argument("--max-workers", type=int, default=4, help="並列上限")
    parser.add_argument(
        "--ignore-escalations", action="store_true", help="既存 escalation を無視して実行"
    )
    args = parser.parse_args()

    jobs: list[tuple[str, str]] = []
    for j in args.jobs:
        if ":" not in j:
            print(f"ERROR: invalid job spec '{j}', expected ch:slug", file=sys.stderr)
            return 2
        ch, slug = j.split(":", 1)
        jobs.append((ch, slug))

    print(f"[orchestrator] {len(jobs)} jobs, max_workers={args.max_workers}")
    start = time.monotonic()

    failures = 0
    with ProcessPoolExecutor(max_workers=args.max_workers) as ex:
        futures = {ex.submit(_run_slug, ch, slug): (ch, slug) for ch, slug in jobs}
        for fut in as_completed(futures):
            ch, slug = futures[fut]
            try:
                result = fut.result()
                status = result.get("status", "unknown")
                msg = result.get("message", "")
                tag = "OK" if status in {"would_build", "already_built"} else "FAIL"
                if tag == "FAIL":
                    failures += 1
                print(f"[{tag:4s}] {ch}:{slug}  status={status}  {msg}")
            except Exception as e:  # noqa: BLE001
                failures += 1
                print(f"[FAIL] {ch}:{slug}  exception={e!r}")

    elapsed = time.monotonic() - start
    print(f"[orchestrator] done in {elapsed:.1f}s, failures={failures}/{len(jobs)}")
    return 0 if failures == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
