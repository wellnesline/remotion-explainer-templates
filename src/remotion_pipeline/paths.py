"""remotion_pipeline/paths.py — ch + slug → 各種 path 解決の薄ラッパー。

`src/channel_resolver.py` の Remotion 系拡張を使う。 全 script はここを通すことで
ch root 二重管理(channels/ vs tools/)を意識せず済む。
"""
from __future__ import annotations

import sys
from pathlib import Path
from typing import Final

REPO_ROOT: Final[Path] = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT / "src"))

from channel_resolver import (  # noqa: E402
    channel_kind,
    remotion_channel_root,
    remotion_topic_dir,
    remotion_theme_dir,
    remotion_pipeline_config,
    remotion_theme_config,
)


def topic_root(channel: str, slug: str) -> Path:
    """tools/<ch>/videos/<slug>/"""
    if channel_kind(channel) != "remotion":
        raise ValueError(f"channel '{channel}' is not remotion-kind")
    return remotion_topic_dir(slug, channel)


def work_dir(channel: str, slug: str) -> Path:
    """topic/work/ (中間ファイル群の親)"""
    return topic_root(channel, slug) / "work"


def images_dir(channel: str, slug: str) -> Path:
    """topic/work/images/"""
    return work_dir(channel, slug) / "images"


def audio_dir(channel: str, slug: str) -> Path:
    """topic/work/audio/sections/"""
    return work_dir(channel, slug) / "audio" / "sections"


def thumb_path(channel: str, slug: str) -> Path:
    """topic/work/thumb.png"""
    return work_dir(channel, slug) / "thumb.png"


def central_partials_dir(channel: str, slug: str) -> Path:
    """topic/work/_central/ (D2 並列出力)"""
    return work_dir(channel, slug) / "_central"


def intermediate_dir(channel: str, slug: str) -> Path:
    """topic/work/_intermediate/ (F 中間 mp4)"""
    return work_dir(channel, slug) / "_intermediate"


def slides_skeleton_path(channel: str, slug: str) -> Path:
    """topic/slides_skeleton.json (A 出力)"""
    return topic_root(channel, slug) / "slides_skeleton.json"


def slides_with_timing_path(channel: str, slug: str) -> Path:
    """topic/slides_with_timing.json (C 出力)"""
    return topic_root(channel, slug) / "slides_with_timing.json"


def slides_full_path(channel: str, slug: str) -> Path:
    """topic/slides_full.json (D2 merger 出力 = render 入力)"""
    return topic_root(channel, slug) / "slides_full.json"


def final_mp4_path(channel: str, slug: str) -> Path:
    """topic/final.mp4 (F step 3 完成)"""
    return topic_root(channel, slug) / "final.mp4"


def escalation_path(channel: str, slug: str) -> Path:
    """topic/work/_escalation.json (FAIL 時)"""
    return work_dir(channel, slug) / "_escalation.json"


def log_yaml_path(channel: str, slug: str) -> Path:
    """topic/log.yaml (stage 進行管理 master)"""
    return topic_root(channel, slug) / "log.yaml"


def theme_dir_for_slug(channel: str, slug: str, design_template: str | None = None) -> Path:
    """slides_skeleton.json の design_template から theme dir を解決。

    design_template が引数で渡されればそれを優先、 未指定なら pipeline.yaml の default。
    """
    if design_template is None:
        cfg = remotion_pipeline_config(channel)
        dt = cfg.get("design_template") or {}
        design_template = dt.get("default", "documentary_serious")
    return remotion_theme_dir(design_template, channel)


def scene_central_matrix_path(channel: str, design_template: str) -> Path:
    """themes/<theme>/scene_central_matrix.yaml"""
    return remotion_theme_dir(design_template, channel) / "scene_central_matrix.yaml"


def theme_yaml_path(channel: str, design_template: str) -> Path:
    """themes/<theme>/theme.yaml"""
    return remotion_theme_dir(design_template, channel) / "theme.yaml"
