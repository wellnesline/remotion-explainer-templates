import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Slide } from "./types";
import { CentralLayer } from "./components/CentralLayer";
import { useTheme } from "./theme/ThemeContext";

type Props = { slide: Slide; durationFrames: number };

// Shorts プロトタイプ
// Shorts 用の minimal vertical layout (1080×1920):
// - bg_image: 全画面 (object-fit cover)
// - section_audio: 再生
// - CentralLayer: 上部 50% 領域に表示 (kinetic_keyword 等)
// - caption: 下部 30% に大きめ font で表示
// - 各 scene_type の演出は省略 (Shorts は短いので scene 演出より caption 優先)

export const ShortsScene: React.FC<Props> = ({ slide, durationFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const theme = useTheme();

  // Fade in/out for the whole scene
  const fadeIn = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(
    frame,
    [Math.max(0, durationFrames - 8), durationFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const opacity = Math.min(fadeIn, fadeOut);

  // Get current line based on section_timing
  const timing = slide.section_timing ?? [];
  const tSec = frame / fps;
  const currentLine = timing.find((l) => tSec >= l.start_sec && tSec < l.end_sec);

  // CentralLayer は LineTiming[] を期待。 section_timing は同じ型なのでそのまま渡す
  const lineTimings = timing;

  const bgUrl = slide.bg_image ? staticFile(slide.bg_image) : undefined;
  const audioUrl = slide.section_audio ? staticFile(slide.section_audio) : undefined;

  return (
    <AbsoluteFill style={{ background: theme.color.background, opacity }}>
      {/* 全画面 bg image (object-fit cover で 1080×1920 に合わせる) */}
      {bgUrl && (
        <AbsoluteFill>
          <Img
            src={bgUrl}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: 0.55,
            }}
          />
          {/* Dim overlay for legibility */}
          <AbsoluteFill style={{ background: "rgba(0,0,0,0.35)" }} />
        </AbsoluteFill>
      )}

      {/* Audio */}
      {audioUrl && <Audio src={audioUrl} />}

      {/* Central layer (上部 50% 領域、 1920×1080 想定で作られているので scaled-down) */}
      <div
        style={{
          position: "absolute",
          top: 100,
          left: 0,
          width: 1080,
          height: 960,
          transform: "scale(0.55)",
          transformOrigin: "top left",
          pointerEvents: "none",
        }}
      >
        <div style={{ width: 1920, height: 1080, position: "relative" }}>
          <CentralLayer
            centralTrack={slide.central_track}
            lineTimings={lineTimings}
          />
        </div>
      </div>

      {/* Caption strip 下部 30% */}
      {currentLine && (
        <div
          style={{
            position: "absolute",
            bottom: 200,
            left: 60,
            right: 60,
            padding: "40px 50px",
            background: "rgba(6, 8, 10, 0.70)",
            borderBottom: `6px solid ${theme.color.primary}`,
            fontFamily: theme.font_family_primary + ", serif",
            fontSize: 56,
            fontWeight: 700,
            color: theme.color.foreground,
            lineHeight: 1.45,
            letterSpacing: 1,
            textShadow: "0 2px 6px rgba(0,0,0,0.9)",
          }}
        >
          {currentLine.caption}
        </div>
      )}

    </AbsoluteFill>
  );
};
