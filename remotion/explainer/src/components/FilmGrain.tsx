import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";

const grainSvg = (seed: number) => {
  const baseFrequency = 0.7;
  const numOctaves = 2;
  return `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='1920' height='1080'>
      <filter id='n'>
        <feTurbulence type='fractalNoise' baseFrequency='${baseFrequency}' numOctaves='${numOctaves}' seed='${seed}'/>
        <feColorMatrix type='matrix' values='0 0 0 0 0.55  0 0 0 0 0.58  0 0 0 0 0.62  0 0 0 1 0'/>
      </filter>
      <rect width='100%' height='100%' filter='url(%23n)' opacity='1'/>
    </svg>`
  )}`;
};

type Props = {
  opacity?: number;
};

export const FilmGrain: React.FC<Props> = ({ opacity = 0.07 }) => {
  const frame = useCurrentFrame();
  const seed = Math.floor(frame / 3) % 5;
  return (
    <AbsoluteFill
      style={{
        backgroundImage: `url("${grainSvg(seed)}")`,
        backgroundSize: "cover",
        opacity,
        mixBlendMode: "overlay",
        pointerEvents: "none",
      }}
    />
  );
};
