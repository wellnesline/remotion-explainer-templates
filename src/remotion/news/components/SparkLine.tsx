/**
 * SparkLine — 数字の後ろに draw on で伸びる細いライン+優しいグロー
 *
 * Apple Stocks のミニチャート相当。SVGの stroke-dasharray を spring で進めて
 * 「左→右に線が引かれる」表現を実装。
 *
 * 使い方:
 *   <SparkLine
 *     points={[1,2,3,4,5,6]}   // 任意の値配列(正規化される)
 *     width={900}
 *     height={220}
 *     color={theme.up}
 *     gradient                  // 下方の塗り gradient ON/OFF
 *     glow                      // 線の発光 ON/OFF
 *     delay={6}                 // draw開始遅延(frame)
 *     duration={28}             // draw完了までのフレーム数(spring damping換算)
 *     direction='up'            // 'up' | 'down'(色決定補助、未指定なら color のみ)
 *   />
 */
import {useCurrentFrame, useVideoConfig, spring, interpolate} from 'remotion';

export interface SparkLineProps {
  points: number[];
  width: number;
  height: number;
  color: string;
  gradient?: boolean;
  glow?: boolean;
  delay?: number;
  damping?: number;
  mass?: number;
  strokeWidth?: number;
  paddingX?: number;
  paddingY?: number;
}

export const SparkLine: React.FC<SparkLineProps> = ({
  points,
  width,
  height,
  color,
  gradient = true,
  glow = true,
  delay = 0,
  damping = 180,
  mass = 0.5,
  strokeWidth = 6,
  paddingX = 8,
  paddingY = 16,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (points.length < 2) return null;

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = Math.max(0.0001, max - min);
  const xs = points.map((_, i) => paddingX + (width - paddingX * 2) * (i / (points.length - 1)));
  const ys = points.map((v) => height - paddingY - ((v - min) / range) * (height - paddingY * 2));

  // パスを構築(cubicベジェで滑らか)
  const path = (() => {
    let d = `M ${xs[0]} ${ys[0]}`;
    for (let i = 1; i < xs.length; i++) {
      const xPrev = xs[i - 1];
      const yPrev = ys[i - 1];
      const xCur = xs[i];
      const yCur = ys[i];
      const cx1 = xPrev + (xCur - xPrev) / 2;
      const cx2 = cx1;
      d += ` C ${cx1} ${yPrev}, ${cx2} ${yCur}, ${xCur} ${yCur}`;
    }
    return d;
  })();

  // 塗りパス(線下方を gradient で塗る)
  const fillPath = `${path} L ${xs[xs.length - 1]} ${height} L ${xs[0]} ${height} Z`;

  // 描画進捗 (0→1)
  const progress = spring({
    frame: Math.max(0, frame - delay),
    fps,
    config: {damping, mass},
  });

  // SVG length計算(近似): path 長さは N線分の合計
  const pathLen = (() => {
    let s = 0;
    for (let i = 1; i < xs.length; i++) {
      const dx = xs[i] - xs[i - 1];
      const dy = ys[i] - ys[i - 1];
      s += Math.sqrt(dx * dx + dy * dy);
    }
    // ベジェ曲線分余裕
    return s * 1.05;
  })();

  const dashOffset = pathLen * (1 - progress);
  const fillOpacity = interpolate(progress, [0, 0.5, 1], [0, 0.05, 0.18]);

  const gradId = `sparkGrad-${Math.round(width)}-${Math.round(height)}-${color.replace('#', '')}`;
  const glowId = `sparkGlow-${color.replace('#', '')}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{display: 'block'}}>
      <defs>
        {gradient && (
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        )}
        {glow && (
          <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
      </defs>
      {gradient && (
        <path d={fillPath} fill={`url(#${gradId})`} opacity={fillOpacity} />
      )}
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={pathLen}
        strokeDashoffset={dashOffset}
        filter={glow ? `url(#${glowId})` : undefined}
      />
    </svg>
  );
};
