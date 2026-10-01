import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { LineOverlay as LineOverlayData, LineTiming } from "../types";

const ACCENT = "#6B7C85";
const ACCENT_TEXT = "#A7B8C2";
const FOREGROUND_LIGHT = "#F0F0F0";

type Props = {
  overlays?: LineOverlayData[];
  lineTimings?: LineTiming[];
};

export const LineOverlayLayer: React.FC<Props> = ({ overlays, lineTimings }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (!overlays || overlays.length === 0 || !lineTimings) return null;

  // Find active overlay at current frame
  const active = overlays.find((o) => {
    const t = lineTimings[o.line_idx];
    if (!t) return false;
    const sf = Math.round(t.start_sec * fps);
    const ef = Math.round(t.end_sec * fps);
    return frame >= sf && frame < ef;
  });
  if (!active) return null;

  const t = lineTimings[active.line_idx];
  const startFrame = Math.round(t.start_sec * fps);
  const endFrame = Math.round(t.end_sec * fps);
  const localFrame = frame - startFrame;
  const totalDur = endFrame - startFrame;

  const fadeIn = interpolate(localFrame, [0, 8], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(
    localFrame,
    [Math.max(0, totalDur - 10), totalDur],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const baseOpacity = Math.min(fadeIn, fadeOut);

  const enter = spring({
    frame: localFrame,
    fps,
    config: { damping: 200, stiffness: 80 },
    durationInFrames: Math.round(fps * 0.7),
  });

  const renderByType = () => {
    switch (active.type) {
      case "term_highlight":
        return <TermHighlight text={active.text || ""} enter={enter} position={active.position} />;
      case "number_callout":
        return (
          <NumberCallout
            number={active.number || ""}
            unit={active.unit}
            label={active.label}
            emphasize={active.emphasize}
            enter={enter}
          />
        );
      case "year_badge":
        return (
          <YearBadge
            year={active.year || ""}
            author={active.author}
            enter={enter}
          />
        );
      case "quote_frame":
        return (
          <QuoteFrame
            quote={active.quote || ""}
            attribution={active.attribution}
            enter={enter}
          />
        );
      case "icon_text":
        return <IconText icon={active.icon || ""} text={active.text || ""} enter={enter} position={active.position} />;
      case "list_reveal":
        return <ListReveal items={active.items || []} enter={enter} localFrame={localFrame} fps={fps} />;
      default:
        return null;
    }
  };

  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity: baseOpacity }}>
      {renderByType()}
    </AbsoluteFill>
  );
};

// ============= Sub-components =============

const TermHighlight: React.FC<{ text: string; enter: number; position?: string }> = ({ text, enter, position = "center_right" }) => {
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const scale = interpolate(enter, [0, 1], [0.85, 1]);
  const tx = interpolate(enter, [0, 1], [40, 0]);

  const positions: Record<string, React.CSSProperties> = {
    top_center: { top: 200, left: 0, right: 0, textAlign: "center" },
    center_right: { top: "50%", right: 100, transform: "translateY(-50%)" },
    center_left: { top: "50%", left: 100, transform: "translateY(-50%)" },
    center: { top: "50%", left: 0, right: 0, textAlign: "center", transform: "translateY(-50%)" },
  };
  const pos = positions[position] || positions.center_right;

  return (
    <div
      style={{
        position: "absolute",
        ...pos,
        opacity,
        transform: `${pos.transform || ""} translateX(${tx}px) scale(${scale})`,
      }}
    >
      <div style={{ display: "inline-block" }}>
        <div
          style={{
            fontFamily: "'Noto Sans CJK JP', sans-serif",
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: 12,
            color: ACCENT_TEXT,
            marginBottom: 8,
          }}
        >
          KEY TERM
        </div>
        <div
          style={{
            fontFamily: "'Noto Serif CJK JP', serif",
            fontSize: 72,
            fontWeight: 700,
            color: FOREGROUND_LIGHT,
            letterSpacing: 4,
            lineHeight: 1.1,
            textShadow: "0 2px 12px rgba(0,0,0,0.85)",
            backgroundColor: "rgba(8,8,8,0.65)",
            padding: "18px 32px",
            borderLeft: `5px solid ${ACCENT}`,
            backdropFilter: "blur(2px)",
          }}
        >
          {text}
        </div>
      </div>
    </div>
  );
};

const NumberCallout: React.FC<{
  number: string;
  unit?: string;
  label?: string;
  emphasize?: boolean;
  enter: number;
}> = ({ number, unit, label, emphasize, enter }) => {
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const tx = interpolate(enter, [0, 1], [60, 0]);
  const accentColor = emphasize ? ACCENT_TEXT : FOREGROUND_LIGHT;
  const labelColor = emphasize ? ACCENT_TEXT : "#a0a0a0";

  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        right: 90,
        transform: `translateY(-50%) translateX(${tx}px)`,
        opacity,
        background: "rgba(8,8,8,0.78)",
        border: `1px solid ${emphasize ? ACCENT : "#5a5a5a"}`,
        borderLeft: `4px solid ${ACCENT}`,
        padding: "26px 36px",
        backdropFilter: "blur(2px)",
        textAlign: "center",
        minWidth: 240,
      }}
    >
      {label ? (
        <div
          style={{
            fontFamily: "'Noto Sans CJK JP', sans-serif",
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: 8,
            color: labelColor,
            marginBottom: 12,
          }}
        >
          {label}
        </div>
      ) : null}
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 6 }}>
        <span
          style={{
            fontFamily: "'Noto Serif CJK JP', serif",
            fontSize: 110,
            fontWeight: 800,
            color: accentColor,
            lineHeight: 0.95,
          }}
        >
          {number}
        </span>
        {unit ? (
          <span
            style={{
              fontFamily: "'Noto Sans CJK JP', sans-serif",
              fontSize: 28,
              fontWeight: 700,
              color: emphasize ? "#b0cfe8" : "#bdbdbd",
              letterSpacing: 2,
            }}
          >
            {unit}
          </span>
        ) : null}
      </div>
    </div>
  );
};

const YearBadge: React.FC<{ year: string; author?: string; enter: number }> = ({ year, author, enter }) => {
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const ty = interpolate(enter, [0, 1], [-20, 0]);
  return (
    <div
      style={{
        position: "absolute",
        top: 110,
        left: 80,
        opacity,
        transform: `translateY(${ty}px)`,
        background: "rgba(15,15,15,0.85)",
        border: `1px solid ${ACCENT}`,
        padding: "16px 24px",
        backdropFilter: "blur(2px)",
        minWidth: 280,
      }}
    >
      <div
        style={{
          fontFamily: "'Noto Sans CJK JP', sans-serif",
          fontSize: 14,
          fontWeight: 700,
          letterSpacing: 8,
          color: ACCENT_TEXT,
          marginBottom: 6,
        }}
      >
        STUDY
      </div>
      <div
        style={{
          fontFamily: "'Noto Serif CJK JP', serif",
          fontSize: 28,
          fontWeight: 700,
          color: FOREGROUND_LIGHT,
          lineHeight: 1.1,
        }}
      >
        {author || ""}
      </div>
      <div
        style={{
          fontSize: 22,
          color: "#bdbdbd",
          marginTop: 4,
        }}
      >
        ({year})
      </div>
    </div>
  );
};

const QuoteFrame: React.FC<{ quote: string; attribution?: string; enter: number }> = ({ quote, attribution, enter }) => {
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const scale = interpolate(enter, [0, 1], [0.94, 1]);
  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: 0,
        right: 0,
        transform: `translateY(-50%) scale(${scale})`,
        opacity,
        textAlign: "center",
        padding: "0 200px",
      }}
    >
      <div
        style={{
          fontSize: 80,
          color: ACCENT,
          fontFamily: "Georgia, serif",
          fontWeight: 700,
          lineHeight: 0.4,
          marginBottom: 20,
          textAlign: "left",
          paddingLeft: 30,
        }}
      >
        “
      </div>
      <div
        style={{
          fontFamily: "'Noto Serif CJK JP', serif",
          fontSize: 48,
          fontWeight: 600,
          color: FOREGROUND_LIGHT,
          lineHeight: 1.5,
          letterSpacing: 3,
          textShadow: "0 2px 14px rgba(0,0,0,0.85)",
          background: "rgba(8,8,8,0.6)",
          padding: "32px 40px",
          backdropFilter: "blur(3px)",
        }}
      >
        {quote}
      </div>
      {attribution ? (
        <div
          style={{
            marginTop: 24,
            fontFamily: "'Noto Sans CJK JP', sans-serif",
            fontSize: 22,
            color: "#bdbdbd",
            letterSpacing: 8,
          }}
        >
          — {attribution}
        </div>
      ) : null}
    </div>
  );
};

const IconText: React.FC<{ icon: string; text: string; enter: number; position?: string }> = ({ icon, text, enter, position = "center_left" }) => {
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const tx = interpolate(enter, [0, 1], [-40, 0]);
  const positions: Record<string, React.CSSProperties> = {
    center_left: { top: "50%", left: 120, transform: "translateY(-50%)" },
    center_right: { top: "50%", right: 120, transform: "translateY(-50%)" },
  };
  const pos = positions[position] || positions.center_left;
  return (
    <div
      style={{
        position: "absolute",
        ...pos,
        opacity,
        transform: `${pos.transform || ""} translateX(${tx}px)`,
        background: "rgba(8,8,8,0.78)",
        border: `1px solid #5a5a5a`,
        padding: "22px 28px",
        backdropFilter: "blur(2px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        minWidth: 180,
      }}
    >
      <div style={{ fontSize: 64 }}>{icon}</div>
      <div
        style={{
          fontFamily: "'Noto Serif CJK JP', serif",
          fontSize: 32,
          fontWeight: 700,
          color: FOREGROUND_LIGHT,
          letterSpacing: 4,
        }}
      >
        {text}
      </div>
    </div>
  );
};

const ListReveal: React.FC<{ items: string[]; enter: number; localFrame: number; fps: number }> = ({ items, enter, localFrame, fps }) => {
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        right: 100,
        transform: "translateY(-50%)",
        opacity,
        background: "rgba(8,8,8,0.75)",
        border: `1px solid #5a5a5a`,
        borderLeft: `4px solid ${ACCENT}`,
        padding: "26px 32px",
        backdropFilter: "blur(2px)",
        minWidth: 320,
      }}
    >
      {items.map((item, i) => {
        const itemFrame = localFrame - i * Math.round(fps * 0.25);
        const itemOpacity = interpolate(itemFrame, [0, fps * 0.4], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const itemTx = interpolate(itemFrame, [0, fps * 0.4], [20, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        return (
          <div
            key={i}
            style={{
              opacity: itemOpacity,
              transform: `translateX(${itemTx}px)`,
              fontFamily: "'Noto Serif CJK JP', serif",
              fontSize: 32,
              fontWeight: 700,
              color: FOREGROUND_LIGHT,
              letterSpacing: 3,
              padding: "8px 0",
              borderBottom: i < items.length - 1 ? `1px solid #3a3a3a` : "none",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <span style={{ color: ACCENT_TEXT, fontSize: 22, fontFamily: "'Noto Sans CJK JP', sans-serif" }}>
              {String(i + 1).padStart(2, "0")}
            </span>
            {item}
          </div>
        );
      })}
    </div>
  );
};
