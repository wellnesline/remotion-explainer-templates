"""synthetic stub: channel path resolver for the remotion_pipeline modules.

Sample implementation only. It maps ``(channel, slug)`` to ``tools/<channel>/videos/<slug>/``
under the repository root and returns empty configs. Replace with a project-specific resolver.
"""
from __future__ import annotations

from pathlib import Path

_ROOT = Path(__file__).resolve().parents[1]


def channel_kind(channel: str) -> str:
    return "remotion"


def remotion_channel_root(channel: str) -> Path:
    return _ROOT / "tools" / channel


def remotion_topic_dir(slug: str, channel: str) -> Path:
    return remotion_channel_root(channel) / "videos" / slug


def remotion_theme_dir(design_template: str, channel: str) -> Path:
    return remotion_channel_root(channel) / "themes" / design_template


def remotion_pipeline_config(channel: str) -> dict:
    return {"design_template": {"default": "documentary_serious"}}


def remotion_theme_config(channel: str, design_template: str | None = None) -> dict:
    return {}
