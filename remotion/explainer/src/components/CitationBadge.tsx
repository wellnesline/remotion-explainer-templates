import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

type Props = {
  authors: string;
  year: string;
  publication?: string;
  label?: string;
  appearAt?: number;
};

const ACCENT = "#6B7C85";
const ACCENT_TEXT = "#A7B8C2";
const FOREGROUND_LIGHT = "#E4EDF2";

export const CitationBadge: React.FC<Props> = ({
  authors,
  year,
  publication,
  label = "RESEARCH",
  appearAt = 10,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({
    frame: frame - appearAt,
    fps,
    config: { damping: 200, stiffness: 90 },
    durationInFrames: fps * 0.8,
  });

  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const translateY = interpolate(enter, [0, 1], [-30, 0]);

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          top: 110,
          right: 80,
          minWidth: 380,
          padding: "18px 26px",
          background: "rgba(15,15,15,0.85)",
          border: `1px solid ${ACCENT}`,
          color: FOREGROUND_LIGHT,
          opacity,
          transform: `translateY(${translateY}px)`,
          fontFamily: "'Noto Serif CJK JP','Noto Serif JP', serif",
          backdropFilter: "blur(2px)",
        }}
      >
        <div
          style={{
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: 8,
            color: ACCENT_TEXT,
            marginBottom: 8,
            fontFamily: "'Noto Sans CJK JP','Noto Sans JP', sans-serif",
          }}
        >
          {label}
        </div>
        <div style={{ fontSize: 30, fontWeight: 700, lineHeight: 1.2 }}>{authors}</div>
        <div style={{ fontSize: 22, marginTop: 6, color: "#bdbdbd" }}>({year})</div>
        {publication ? (
          <div style={{ fontSize: 16, marginTop: 6, color: "#9a9a9a", fontStyle: "italic" }}>
            {publication}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
