/**
 * BarPulse — 縦棒が順次 spring 立ち上がり。各バー上端に発光+値ラベル。
 * 用途: 項目別の件数・金額など、離散値の推移
 */
import {useCurrentFrame, useVideoConfig, spring, interpolate} from 'remotion';

export interface BarPulseProps {
  bars: {label: string; value: number}[];
  width: number;
  height: number;
  color: string;
  glow?: boolean;
  delay?: number;
  damping?: number;
  paddingX?: number;
  paddingY?: number;
  axisColor?: string;
}

export const BarPulse: React.FC<BarPulseProps> = ({
  bars,
  width,
  height,
  color,
  glow = true,
  delay = 0,
  damping = 200,
  paddingX = 30,
  paddingY = 40,
  axisColor = '#C7C7CC',
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const max = Math.max(...bars.map((b) => b.value));
  const w = width - paddingX * 2;
  const h = height - paddingY * 2;
  const gap = w / bars.length / 4;
  const bw = (w - gap * (bars.length + 1)) / bars.length;
  const glowId = `bp-glow-${color.replace('#', '')}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{display: 'block'}}>
      <defs>
        {glow && (
          <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
      </defs>
      {/* baseline */}
      <line
        x1={paddingX}
        y1={paddingY + h}
        x2={paddingX + w}
        y2={paddingY + h}
        stroke={axisColor}
        strokeWidth={2}
      />
      {bars.map((b, i) => {
        const p = spring({
          frame: Math.max(0, frame - delay - i * 4),
          fps,
          config: {damping, mass: 0.5},
        });
        const bh = (b.value / max) * h * p;
        const x = paddingX + gap + i * (bw + gap);
        const y = paddingY + h - bh;
        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={bw}
              height={bh}
              rx={6}
              fill={color}
              opacity={p}
              filter={glow ? `url(#${glowId})` : undefined}
            />
            <text
              x={x + bw / 2}
              y={y - 8}
              fill={color}
              fontSize={Math.max(14, height * 0.06)}
              fontWeight={900}
              textAnchor="middle"
              opacity={p}
            >
              {b.value}
            </text>
            <text
              x={x + bw / 2}
              y={paddingY + h + 24}
              fill={axisColor}
              fontSize={Math.max(12, height * 0.05)}
              fontWeight={700}
              textAnchor="middle"
            >
              {b.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
};
