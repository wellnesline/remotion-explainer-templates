/**
 * CompareBars — 3モード明示型 横棒グラフ。
 *
 * Mode `absolute`(default):
 *   正のみ・同単位を1軸で比較。バー長 = value/max(values)。
 *   用途: 実績 vs 計画、今期 vs 前期。
 *
 * Mode `rate`:
 *   騰落率(%)向け divergent 棒グラフ(中央ゼロ線、正は右、負は左)。
 *   用途: 項目別の増減、前日比。負値対応。
 *
 * 旧来の「バー長と value_label が無関係」な使い方は QA(A5)で禁止。
 */
import {useCurrentFrame, useVideoConfig, spring, interpolate} from 'remotion';

export type CompareBarsMode = 'absolute' | 'rate';

export interface CompareBarsProps {
  rows: {label: string; value: number; color: string; value_label?: string}[];
  width: number;
  height: number;
  mode?: CompareBarsMode;
  delay?: number;
  damping?: number;
  paddingX?: number;
  paddingY?: number;
  textColor?: string;
  unit_default?: string;
  upColor?: string;
  downColor?: string;
}

export const CompareBars: React.FC<CompareBarsProps> = ({
  rows,
  width,
  height,
  mode = 'absolute',
  delay = 0,
  damping = 200,
  paddingX = 30,
  paddingY = 30,
  textColor = '#0A0A0A',
  unit_default,
  upColor = '#30D158',
  downColor = '#FF3B30',
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const fontPx = Math.max(36, Math.round(height * 0.11));
  // labelW は最長ラベル長から動的計算(日本語1文字 ≒ fontPx 幅)。240〜360 の範囲。
  const maxLabelLen = Math.max(...rows.map((r) => (r.label || '').length), 4);
  const labelW = Math.min(360, Math.max(240, maxLabelLen * Math.round(fontPx * 0.95) + 30));
  const hasLongLabel = rows.some((r) => r.value_label || unit_default);
  // value_label の長さも見て、長い場合は valueW を拡張
  const maxValueLabelLen = Math.max(
    ...rows.map((r) => String(r.value_label || `${r.value}${unit_default || ''}`).length),
    4
  );
  const valueW = hasLongLabel
    ? Math.min(360, Math.max(280, maxValueLabelLen * Math.round(fontPx * 0.7) + 24))
    : 160;
  const trackX = paddingX + labelW;
  const trackW = width - paddingX * 2 - labelW - valueW;
  const rowH = (height - paddingY * 2) / rows.length;
  const barH = Math.min(rowH * 0.55, 56);

  if (mode === 'rate') {
    return renderRate({
      rows, width, height, fontPx, labelW, valueW, trackX, trackW, rowH, barH,
      paddingX, paddingY, textColor, frame, fps, delay, damping,
      upColor, downColor,
    });
  }
  return renderAbsolute({
    rows, width, height, fontPx, labelW, valueW, trackX, trackW, rowH, barH,
    paddingX, paddingY, textColor, frame, fps, delay, damping, unit_default,
  });
};

interface RenderCtx {
  rows: CompareBarsProps['rows'];
  width: number;
  height: number;
  fontPx: number;
  labelW: number;
  valueW: number;
  trackX: number;
  trackW: number;
  rowH: number;
  barH: number;
  paddingX: number;
  paddingY: number;
  textColor: string;
  frame: number;
  fps: number;
  delay: number;
  damping: number;
}

function renderAbsolute(ctx: RenderCtx & {unit_default?: string}) {
  const {rows, width, height, fontPx, trackX, trackW, rowH, barH, paddingX, paddingY,
    textColor, frame, fps, delay, damping, unit_default} = ctx;
  const max = Math.max(...rows.map((r) => Math.abs(r.value)), 1e-9);
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{display: 'block'}}>
      {rows.map((r, i) => {
        const p = spring({
          frame: Math.max(0, frame - delay - i * 6),
          fps,
          config: {damping, mass: 0.5},
        });
        const bw = (Math.max(0, r.value) / max) * trackW * p;
        const y = paddingY + i * rowH + (rowH - barH) / 2;
        const displayValue = r.value_label ?? (unit_default ? `${r.value}${unit_default}` : String(r.value));
        return (
          <g key={i}>
            <text x={paddingX} y={y + barH / 2 + fontPx * 0.35} fill={textColor} fontSize={fontPx} fontWeight={900}>
              {r.label}
            </text>
            <rect x={trackX} y={y} width={trackW} height={barH} rx={barH / 2} fill="#F2F2F7" />
            <rect x={trackX} y={y} width={bw} height={barH} rx={barH / 2} fill={r.color} opacity={p} />
            <text
              x={trackX + trackW + 12}
              y={y + barH / 2 + fontPx * 0.35}
              fill={r.color}
              fontSize={fontPx}
              fontWeight={900}
              opacity={p}
            >
              {displayValue}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function renderRate(ctx: RenderCtx & {upColor: string; downColor: string}) {
  const {rows, width, height, fontPx, trackX, trackW, rowH, barH, paddingX, paddingY,
    textColor, frame, fps, delay, damping, upColor, downColor} = ctx;
  const maxAbs = Math.max(...rows.map((r) => Math.abs(r.value)), 1e-9);
  const halfW = trackW / 2;
  const zeroX = trackX + halfW;
  const tickColor = '#C7C7CC';
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{display: 'block'}}>
      <line x1={zeroX} y1={paddingY} x2={zeroX} y2={height - paddingY} stroke={tickColor} strokeWidth={2} strokeDasharray="4 6" />
      {rows.map((r, i) => {
        const p = spring({
          frame: Math.max(0, frame - delay - i * 6),
          fps,
          config: {damping, mass: 0.5},
        });
        const bw = (Math.abs(r.value) / maxAbs) * halfW * p;
        const y = paddingY + i * rowH + (rowH - barH) / 2;
        const isPos = r.value >= 0;
        const fillColor = isPos ? upColor : downColor;
        const barLeftX = isPos ? zeroX : zeroX - bw;
        const displayValue = r.value_label ?? `${r.value > 0 ? '+' : ''}${r.value}%`;
        const labelX = isPos ? trackX + trackW + 12 : zeroX + 12;
        const labelAnchor: 'start' | 'end' = 'start';
        return (
          <g key={i}>
            <text x={paddingX} y={y + barH / 2 + fontPx * 0.35} fill={textColor} fontSize={fontPx} fontWeight={900}>
              {r.label}
            </text>
            <rect x={trackX} y={y} width={trackW} height={barH} rx={barH / 2} fill="#F2F2F7" />
            <rect x={barLeftX} y={y} width={bw} height={barH} rx={barH / 2} fill={fillColor} opacity={p} />
            <text
              x={labelX}
              y={y + barH / 2 + fontPx * 0.35}
              fill={fillColor}
              fontSize={fontPx}
              fontWeight={900}
              opacity={p}
              textAnchor={labelAnchor}
            >
              {displayValue}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
