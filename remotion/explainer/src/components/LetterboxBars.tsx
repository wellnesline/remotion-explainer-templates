import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

type Props = {
  height?: number;
  fadeIn?: boolean;
};

export const LetterboxBars: React.FC<Props> = ({ height = 72, fadeIn = true }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = fadeIn
    ? spring({
        frame,
        fps,
        config: { damping: 200, stiffness: 70 },
        durationInFrames: fps * 1.4,
      })
    : 1;

  const realHeight = interpolate(progress, [0, 1], [0, height]);

  return (
    <>
      <AbsoluteFill style={{ pointerEvents: "none" }}>
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: realHeight,
            background: "#000",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: realHeight,
            background: "#000",
          }}
        />
      </AbsoluteFill>
    </>
  );
};
