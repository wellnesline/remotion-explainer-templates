import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Line, LineTiming } from "../types";

type Props = {
  lines: Line[];
  totalFrames: number;
  lineTimings?: LineTiming[]; // 明示的タイミング(ElevenLabs alignment由来)。あれば優先
};

const FOREGROUND_LIGHT = "#F0F0F0";

const computeLineFrames = (lines: Line[], totalFrames: number): number[] => {
  const counts = lines.map((l) => Math.max(2, l.caption.length));
  const sum = counts.reduce((a, b) => a + b, 0);
  if (sum === 0) return lines.map(() => Math.floor(totalFrames / lines.length));
  // Proportional allocation by char count (each line at least 18 frames = 0.6s)
  const minFrames = 18;
  let raw = counts.map((c) => Math.max(minFrames, Math.round((totalFrames * c) / sum)));
  // rebalance so total exactly equals totalFrames
  const rawSum = raw.reduce((a, b) => a + b, 0);
  const diff = totalFrames - rawSum;
  if (diff !== 0) {
    raw[raw.length - 1] = Math.max(minFrames, raw[raw.length - 1] + diff);
  }
  return raw;
};

export const SubtitleBand: React.FC<Props> = ({ lines, totalFrames, lineTimings }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  let activeIdx = 0;
  let activeStart = 0;
  let activeDuration = 0;
  let caption = "";

  if (lineTimings && lineTimings.length > 0) {
    // Use explicit timings (sec → frames)
    let chosen = -1;
    for (let i = 0; i < lineTimings.length; i++) {
      const startFrame = Math.round(lineTimings[i].start_sec * fps);
      const endFrame = Math.round(lineTimings[i].end_sec * fps);
      if (frame >= startFrame && frame < endFrame) {
        chosen = i;
        activeStart = startFrame;
        activeDuration = endFrame - startFrame;
        break;
      }
    }
    // If beyond last, show last; if before first, show nothing
    const lastEnd = Math.round(lineTimings[lineTimings.length - 1].end_sec * fps);
    const firstStart = Math.round(lineTimings[0].start_sec * fps);
    if (chosen < 0) {
      if (frame >= lastEnd) {
        chosen = lineTimings.length - 1;
        activeStart = Math.round(lineTimings[chosen].start_sec * fps);
        activeDuration = lastEnd - activeStart;
      } else if (frame < firstStart) {
        return null; // 字幕表示なし(セクション開始前)
      } else {
        chosen = 0;
        activeStart = firstStart;
        activeDuration = Math.round(lineTimings[0].end_sec * fps) - activeStart;
      }
    }
    activeIdx = chosen;
    caption = lineTimings[activeIdx].caption;
  } else {
    // Fallback: char-count proportional (旧ロジック)
    const lineFrames = computeLineFrames(lines, totalFrames);
    let acc = 0;
    for (let i = 0; i < lineFrames.length; i++) {
      if (frame < acc + lineFrames[i]) {
        activeIdx = i;
        activeStart = acc;
        activeDuration = lineFrames[i];
        break;
      }
      acc += lineFrames[i];
    }
    if (frame >= acc + lineFrames[lineFrames.length - 1]) {
      activeIdx = lineFrames.length - 1;
      activeStart = acc;
      activeDuration = lineFrames[activeIdx];
    }
    caption = lines[activeIdx]?.caption ?? "";
  }

  const localFrame = frame - activeStart;
  const fadeIn = interpolate(localFrame, [0, 7], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(
    localFrame,
    [Math.max(0, activeDuration - 7), activeDuration],
    [1, 0.92],
    { extrapolateRight: "clamp", extrapolateLeft: "clamp" }
  );
  const opacity = Math.min(fadeIn, fadeOut);

  // wrap to max 28 chars per line, max 2 lines
  const maxPerLine = 24;
  const wrapped: string[] = [];
  let remaining = caption;
  while (remaining.length > 0 && wrapped.length < 2) {
    if (remaining.length <= maxPerLine) {
      wrapped.push(remaining);
      remaining = "";
    } else {
      // try to break at a punctuation near the limit
      const breakPoints = ["、", "。", " ", "・", "「", "」"];
      let breakAt = -1;
      for (let p = maxPerLine; p > maxPerLine * 0.5; p--) {
        if (breakPoints.includes(remaining[p])) {
          breakAt = p + 1;
          break;
        }
      }
      const cut = breakAt > 0 ? breakAt : maxPerLine;
      wrapped.push(remaining.slice(0, cut));
      remaining = remaining.slice(cut);
    }
  }
  if (remaining.length > 0 && wrapped.length === 2) {
    // append overflow into last line trimmed
    wrapped[1] = wrapped[1] + remaining;
  }

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 104,
          textAlign: "center",
          opacity,
          padding: "0 120px",
        }}
      >
        {/* rounded translucent plate behind the text (instead of a full-width gradient strip) */}
        <div
          style={{
            display: "inline-block",
            padding: "10px 32px",
            borderRadius: 14,
            background: "rgba(8, 12, 16, 0.62)",
            color: FOREGROUND_LIGHT,
            fontFamily: "'Noto Sans CJK JP','Noto Sans JP', sans-serif",
            fontWeight: 600,
            fontSize: 40,
            letterSpacing: 1,
            lineHeight: 1.4,
            textShadow: "0 1px 2px rgba(0,0,0,0.7)",
          }}
        >
          {wrapped.map((s, i) => (
            <div key={i}>{s}</div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
