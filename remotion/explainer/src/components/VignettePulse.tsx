import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

type Props = {
  intensity?: number;
  pulse?: boolean;
};

export const VignettePulse: React.FC<Props> = ({ intensity = 0.42, pulse = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pulseAmount = pulse
    ? Math.sin((frame / fps) * Math.PI * 0.6) * 0.06
    : 0;
  const finalIntensity = Math.max(0, Math.min(0.9, intensity + pulseAmount));
  const innerStop = interpolate(finalIntensity, [0, 1], [0.5, 0.2]);

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at center, rgba(0,0,0,0) ${innerStop * 100}%, rgba(0,0,0,${finalIntensity}) 100%)`,
        pointerEvents: "none",
      }}
    />
  );
};
