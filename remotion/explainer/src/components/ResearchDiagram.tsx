import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

type Props = {
  population?: string;
  variableLeft?: string;
  variableRight?: string;
  relation?: string;
  appearAt?: number;
};

const ACCENT = "#6B7C85";
const ACCENT_TEXT = "#A7B8C2";
const FOREGROUND_LIGHT = "#F0F0F0";
const DIM_TEXT = "#a0a0a0";

const Box: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  enter: number;
  accent?: boolean;
}> = ({ x, y, w, h, label, enter, accent }) => {
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const scale = interpolate(enter, [0, 1], [0.92, 1]);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        opacity,
        transform: `scale(${scale})`,
        transformOrigin: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "rgba(15,15,15,0.78)",
          border: `2px solid ${accent ? ACCENT : "#5a5a5a"}`,
          color: FOREGROUND_LIGHT,
          fontFamily: "'Noto Sans CJK JP','Noto Sans JP', sans-serif",
          fontWeight: 700,
          fontSize: 30,
          letterSpacing: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "0 18px",
          backdropFilter: "blur(2px)",
        }}
      >
        {label}
      </div>
    </div>
  );
};

export const ResearchDiagram: React.FC<Props> = ({
  population = "対象集団A",
  variableLeft = "変数X",
  variableRight = "変数Y",
  relation = "?",
  appearAt = 18,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const stepEnter = (offset: number) =>
    spring({
      frame: frame - appearAt - offset,
      fps,
      config: { damping: 200, stiffness: 90 },
      durationInFrames: fps * 0.7,
    });

  const e1 = stepEnter(0);   // population box
  const e2 = stepEnter(20);  // arrow down
  const e3 = stepEnter(35);  // left variable box
  const e4 = stepEnter(50);  // right variable box
  const e5 = stepEnter(70);  // relation symbol

  // canvas centered around 1920x1080. We render in 1100x520 box centered.
  const cx = 960;
  const cy = 420;
  const popW = 540;
  const popH = 110;
  const varW = 360;
  const varH = 110;

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {/* Population box top */}
      <div
        style={{
          position: "absolute",
          left: cx - popW / 2,
          top: cy - 220,
          width: popW,
          opacity: interpolate(e1, [0, 1], [0, 1]),
        }}
      >
        <div
          style={{
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: 8,
            color: ACCENT_TEXT,
            marginBottom: 8,
            fontFamily: "'Noto Sans CJK JP','Noto Sans JP', sans-serif",
            textAlign: "center",
          }}
        >
          POPULATION
        </div>
      </div>
      <Box
        x={cx - popW / 2}
        y={cy - 190}
        w={popW}
        h={popH}
        label={population}
        enter={e1}
        accent={false}
      />

      {/* Vertical arrow */}
      <div
        style={{
          position: "absolute",
          left: cx - 1.5,
          top: cy - 70,
          width: 3,
          height: 80,
          background: `linear-gradient(180deg, ${ACCENT}33 0%, ${ACCENT}cc 100%)`,
          opacity: interpolate(e2, [0, 1], [0, 1]),
          transform: `scaleY(${interpolate(e2, [0, 1], [0, 1])})`,
          transformOrigin: "top",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: cx - 8,
          top: cy + 6,
          width: 0,
          height: 0,
          borderLeft: "8px solid transparent",
          borderRight: "8px solid transparent",
          borderTop: `12px solid ${ACCENT}`,
          opacity: interpolate(e2, [0, 1], [0, 1]),
        }}
      />

      {/* Variable boxes */}
      <Box
        x={cx - varW - 60}
        y={cy + 30}
        w={varW}
        h={varH}
        label={variableLeft}
        enter={e3}
        accent={true}
      />
      <Box
        x={cx + 60}
        y={cy + 30}
        w={varW}
        h={varH}
        label={variableRight}
        enter={e4}
        accent={true}
      />

      {/* Relation symbol */}
      <div
        style={{
          position: "absolute",
          left: cx - 60,
          top: cy + 30 + varH / 2 - 60,
          width: 120,
          height: 120,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: interpolate(e5, [0, 1], [0, 1]),
          transform: `scale(${interpolate(e5, [0, 1], [0.5, 1])})`,
        }}
      >
        <div
          style={{
            fontSize: 84,
            fontWeight: 900,
            color: ACCENT_TEXT,
            fontFamily: "'Noto Serif CJK JP','Noto Serif JP', serif",
            textShadow: `0 0 18px ${ACCENT}66`,
          }}
        >
          {relation}
        </div>
      </div>

      {/* Bottom caption */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: cy + 200,
          textAlign: "center",
          color: DIM_TEXT,
          fontFamily: "'Noto Sans CJK JP','Noto Sans JP', sans-serif",
          fontSize: 22,
          letterSpacing: 6,
          opacity: interpolate(e5, [0, 1], [0, 0.85]),
        }}
      >
        STUDY DESIGN
      </div>
    </AbsoluteFill>
  );
};
