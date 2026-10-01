"""remotion_pipeline/escalation.py — _escalation.json 出力ヘルパ。

escalation 経路。
"""
from __future__ import annotations

import datetime as dt
import json
from pathlib import Path
from typing import Literal

from remotion_pipeline.paths import escalation_path


EscalationGate = Literal[
    "central_text_qa",
    "central_visual_qa",
    "synth_kana_dict",
    "thumb_qa",
    "scene_static_render",
]

NextAction = Literal[
    "human_review",
    "change_validator",
    "retry_with_hint",
]


def write_escalation(
    channel: str,
    slug: str,
    *,
    gate: EscalationGate,
    attempts: int,
    last_report_path: str,
    failed_rules: list[str],
    hint: str,
    next_action: NextAction,
    owner: str = "human",
    resume_from_stage: str | None = None,
) -> Path:
    """work/_escalation.json を書き出す。 既存ファイルは上書き。

    Returns:
      書き出した path
    """
    now_jst = dt.datetime.now(dt.timezone(dt.timedelta(hours=9))).isoformat(timespec="seconds")
    payload = {
        "schema_version": 1,
        "created_at": now_jst,
        "channel": channel,
        "slug": slug,
        "gate": gate,
        "attempts": attempts,
        "last_report_path": last_report_path,
        "failed_rules": failed_rules,
        "hint": hint,
        "next_action": next_action,
        "owner": owner,
        "resume_from_stage": resume_from_stage,
    }
    p = escalation_path(channel, slug)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(payload, ensure_ascii=False, indent=2))
    return p


def has_escalation(channel: str, slug: str) -> bool:
    return escalation_path(channel, slug).exists()


def clear_escalation(channel: str, slug: str) -> bool:
    """resume 完了時に escalation を消す。 存在しなければ False。"""
    p = escalation_path(channel, slug)
    if not p.exists():
        return False
    p.unlink()
    return True


def read_escalation(channel: str, slug: str) -> dict | None:
    p = escalation_path(channel, slug)
    if not p.exists():
        return None
    return json.loads(p.read_text())
