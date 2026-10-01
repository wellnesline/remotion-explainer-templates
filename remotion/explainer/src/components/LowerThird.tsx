import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

type Props = {
  primary: string;
  secondary?: string;
  tag?: string;
  position?: "left" | "right";
  appearAt?: number;
};

const ACCENT = "#6B7C85";
const ACCENT_TEXT = "#A7B8C2";
const FOREGROUND_LIGHT = "#E4EDF2";
const DARK_BASE = "#0d0d0d";

export const LowerThird: React.FC<Props> = ({
  primary,
  secondary,
  tag,
  position = "left",
  appearAt = 8,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({
    frame: frame - appearAt,
    fps,
    config: { damping: 180, stiffness: 100 },
    durationInFrames: fps * 0.7,
  });

  const translateX = interpolate(enter, [0, 1], [position === "left" ? -300 : 300, 0]);
  const opacity = interpolate(enter, [0, 1], [0, 1]);

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          bottom: 220,
          left: position === "left" ? 80 : "auto",
          right: position === "right" ? 80 : "auto",
          minWidth: 540,
          maxWidth: 760,
          padding: "22px 32px",
          background: "rgba(8,8,8,0.82)",
          borderLeft: `5px solid ${ACCENT}`,
          color: FOREGROUND_LIGHT,
          transform: `translateX(${translateX}px)`,
          opacity,
          fontFamily: "'Noto Sans CJK JP','Noto Sans JP', sans-serif",
          backdropFilter: "blur(2px)",
        }}
      >
        {tag ? (
          <div
            style={{
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: 6,
              color: ACCENT_TEXT,
              marginBottom: 8,
              textTransform: "uppercase",
            }}
          >
            {tag}
          </div>
        ) : null}
        <div style={{ fontSize: 44, fontWeight: 700, lineHeight: 1.1, color: FOREGROUND_LIGHT }}>
          {primary}
        </div>
        {secondary ? (
          <div style={{ fontSize: 22, fontWeight: 400, marginTop: 6, color: "#bdbdbd" }}>
            {secondary}
          </div>
        ) : null}
      </div>
      {/* hidden helper to satisfy unused color */}
      <span style={{ display: "none", color: DARK_BASE }} />
    </AbsoluteFill>
  );
};
