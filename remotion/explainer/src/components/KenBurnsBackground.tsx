import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ImageSegment, LineTiming } from "../types";

type Props = {
  src?: string;
  imageTrack?: ImageSegment[];
  lineTimings?: LineTiming[];
  zoomFrom?: number;
  zoomTo?: number;
  panX?: number;
  panY?: number;
  fallbackTone?: "dark" | "deep_teal" | "midnight_blue";
};

const fallbackBackgrounds: Record<string, string> = {
  dark: "radial-gradient(ellipse at center, #3a3a3a 0%, #161616 80%)",
  deep_teal: "radial-gradient(ellipse at center, #20384a 0%, #08121a 80%)",
  midnight_blue: "radial-gradient(ellipse at center, #1d3358 0%, #0a1525 80%)",
};

const FADE_FRAMES = 12;

export const KenBurnsBackground: React.FC<Props> = ({
  src,
  imageTrack,
  lineTimings,
  zoomFrom = 1.05,
  zoomTo = 1.18,
  panX = 0,
  panY = 0,
  fallbackTone = "dark",
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // image_track + lineTimings ある場合: 複数画像をクロスフェードで切替
  if (imageTrack && imageTrack.length > 0 && lineTimings && lineTimings.length > 0) {
    const segments = imageTrack.map((seg, i) => {
      const safeLineIdx = Math.min(seg.from_line_idx, lineTimings.length - 1);
      const startSec = lineTimings[safeLineIdx].start_sec;
      const startFrame = Math.round(startSec * fps);
      const nextSeg = imageTrack[i + 1];
      const endSec = nextSeg
        ? lineTimings[Math.min(nextSeg.from_line_idx, lineTimings.length - 1)].start_sec
        : durationInFrames / fps;
      const endFrame = Math.round(endSec * fps);
      return { ...seg, startFrame, endFrame };
    });

    return (
      <AbsoluteFill style={{ overflow: "hidden", background: "#000" }}>
        {segments.map((seg, i) => {
          const isFirst = i === 0;
          const isLast = i === segments.length - 1;

          const fadeIn = isFirst
            ? 1
            : interpolate(
                frame,
                [seg.startFrame - FADE_FRAMES, seg.startFrame + FADE_FRAMES],
                [0, 1],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
              );
          const fadeOut = isLast
            ? 1
            : interpolate(
                frame,
                [seg.endFrame - FADE_FRAMES, seg.endFrame + FADE_FRAMES],
                [1, 0],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
              );
          const opacity = Math.min(fadeIn, fadeOut);
          if (opacity <= 0.001) return null;

          // Per-segment Ken Burns scale
          const t = interpolate(frame, [seg.startFrame, seg.endFrame], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const scale = interpolate(t, [0, 1], [zoomFrom, zoomTo]);

          return (
            <AbsoluteFill key={i} style={{ opacity }}>
              <AbsoluteFill
                style={{
                  transform: `scale(${scale})`,
                  transformOrigin: "center",
                }}
              >
                <Img
                  src={staticFile(seg.image)}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </AbsoluteFill>
            </AbsoluteFill>
          );
        })}
      </AbsoluteFill>
    );
  }

  // Legacy: single image with Ken Burns
  const t = interpolate(frame, [0, durationInFrames], [0, 1], { extrapolateRight: "clamp" });
  const scale = interpolate(t, [0, 1], [zoomFrom, zoomTo]);
  const tx = interpolate(t, [0, 1], [0, panX]);
  const ty = interpolate(t, [0, 1], [0, panY]);

  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#000" }}>
      {src ? (
        <AbsoluteFill
          style={{
            transform: `scale(${scale}) translate(${tx}px, ${ty}px)`,
            transformOrigin: "center",
          }}
        >
          <Img
            src={src}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </AbsoluteFill>
      ) : (
        <AbsoluteFill
          style={{
            background: fallbackBackgrounds[fallbackTone],
            transform: `scale(${scale})`,
            transformOrigin: "center",
          }}
        />
      )}
    </AbsoluteFill>
  );
};
