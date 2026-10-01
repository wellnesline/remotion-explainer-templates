/**
 * NumberTicker — spring駆動のカウントアップ数字
 * Magic UI / React Bits の Number Ticker パターンを Remotion 用に移植。
 *
 * - 0 → target に spring 物理アニメで到達
 * - tabular-nums で桁位置固定(視覚揺れ防止)
 * - 整数/小数桁数指定可
 */
import {useCurrentFrame, useVideoConfig, spring} from 'remotion';

export interface NumberTickerProps {
  target: number;
  delay?: number;            // 開始遅延(frame)
  duration?: number;         // 完了までのフレーム数(目安)
  damping?: number;
  mass?: number;
  decimals?: number;         // 小数点桁数
  prefix?: string;           // "$" などの接頭辞
  suffix?: string;           // "%" "件" などの接尾辞
  prefixSize?: number;       // 接頭辞のフォントサイズ(px)未指定なら 50%
  suffixSize?: number;       // 接尾辞のフォントサイズ
  fontSize: number;
  color: string;
  fontWeight?: number;
  fontFamily?: string;
  thousands?: boolean;       // 3桁区切り
}

export const NumberTicker: React.FC<NumberTickerProps> = ({
  target,
  delay = 0,
  damping = 200,
  mass = 0.5,
  decimals = 0,
  prefix = '',
  suffix = '',
  prefixSize,
  suffixSize,
  fontSize,
  color,
  fontWeight = 900,
  fontFamily,
  thousands = true,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const progress = spring({
    frame: Math.max(0, frame - delay),
    fps,
    config: {damping, mass},
  });
  const value = target * progress;
  const formatted = (() => {
    const fixed = value.toFixed(decimals);
    if (!thousands) return fixed;
    const parts = fixed.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  })();

  const sub = prefixSize ?? Math.round(fontSize * 0.5);
  const subSuf = suffixSize ?? Math.round(fontSize * 0.5);

  return (
    <span
      style={{
        color,
        fontWeight,
        fontFamily,
        fontVariantNumeric: 'tabular-nums',
        lineHeight: 1,
        whiteSpace: 'nowrap',
      }}
    >
      {prefix && (
        <span style={{fontSize: sub, marginRight: 4}}>{prefix}</span>
      )}
      <span style={{fontSize}}>{formatted}</span>
      {suffix && (
        <span style={{fontSize: subSuf, marginLeft: 6}}>{suffix}</span>
      )}
    </span>
  );
};
