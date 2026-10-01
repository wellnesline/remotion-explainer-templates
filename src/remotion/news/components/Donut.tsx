/**
 * Donut — 円弧progress(stroke-dasharray draw on)+グラデring
 * 用途: シェア・%変動・上昇率
 */
import {useCurrentFrame, useVideoConfig, spring} from 'remotion';

export interface DonutProps {
  percent: number;       // 0-100
  width: number;
  height: number;
  color: string;
  trackColor?: string;
  glow?: boolean;
  delay?: number;
  damping?: number;
  thickness?: number;
}

export const Donut: React.FC<DonutProps> = ({
  percent,
  width,
  height,
  color,
  trackColor = '#E5E5EA',
  glow = true,
  delay = 0,
  damping = 200,
  thickness = 28,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const cx = width / 2;
  const cy = height / 2;
  const r = Math.min(width, height) / 2 - thickness;
  const circ = 2 * Math.PI * r;
  const p = spring({frame: Math.max(0, frame - delay), fps, config: {damping, mass: 0.5}});
  const arc = circ * (percent / 100) * p;
  const offset = circ - arc;
  const glowId = `donut-glow-${color.replace('#', '')}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{display: 'block'}}>
      <defs>
        {glow && (
          <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
      </defs>
      <circle cx={cx} cy={cy} r={r} stroke={trackColor} strokeWidth={thickness} fill="none" />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        stroke={color}
        strokeWidth={thickness}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${cx} ${cy})`}
        filter={glow ? `url(#${glowId})` : undefined}
      />
    </svg>
  );
};
