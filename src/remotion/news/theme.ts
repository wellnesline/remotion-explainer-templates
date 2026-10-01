/**
 * ライトテーマ トークン(サンプル値)
 *
 * 想定: 縦型1080×1920、スマホ視認最優先
 */
export const theme = {
  // 背景・サーフェス
  bg:        '#FFFFFF',
  surface:   '#F2F2F7',
  surfaceAlt: '#FAFAFD',
  divider:   '#E5E5EA',
  hairline:  '#D1D1D6',

  // テキスト
  text:        '#000000',
  textSub:     '#8E8E93',
  textTertiary: '#C7C7CC',

  // 値の方向
  up:        '#30D158',  // green
  upLight:   '#D1F5DC',
  down:      '#FF3B30',  // red
  downLight: '#FFE2E0',
  neutral:   '#A1A1A6',

  // アクセント(控えめ)
  accent:    '#0A84FF',  // blue
  warning:   '#FF9F0A',

  // バッジ・ワイプ枠・テロップ帯の色(theme単位で切替)
  badgeBg:   '#455A64',  // バッジ色(サンプル: スレート)
  wipeFrame: '#455A64',  // ワイプフレーム
  telopBg:   '#455A64',  // テロップ上部の帯
} as const;

/**
 * Alt theme — 別系統の配色(サンプル)
 * バッジ・ワイプ枠・テロップ帯の色だけ差し替え。値方向(up/down)と背景は維持。
 */
export const themeAlt = {
  ...theme,
  badgeBg:   '#6D4C41',  // サンプル: ブラウン
  wipeFrame: '#6D4C41',
  telopBg:   '#6D4C41',
  accent:    '#6D4C41',
} as const;

export type Theme = typeof theme;

/**
 * フォントサイズ(D 提案ベース、スマホ視認 1080w カンバス向け)
 *  メイン数値: 160-200 / キーワード: 70-90 / 副: 40-50 / キャプ: 28-36
 */
export const fontSize = {
  hero:     180,  // メイン数値(値/変動率/カウントアップ等)
  heroSm:   140,  // メイン数値(2行に分割等)
  heading:  84,   // キーワード(項目名/トピック見出し)
  headingSm: 70,
  subheading: 48,
  body:     40,
  bodySm:   34,
  caption:  28,
} as const;

export const fontWeight = {
  black: 900,
  bold:  700,
  semi:  600,
  reg:   400,
} as const;

export const radius = {
  sm: 8,
  md: 14,
  lg: 24,
  pill: 999,
} as const;

export const shadow = {
  card: '0 4px 12px rgba(0,0,0,0.06)',
  pop:  '0 8px 24px rgba(0,0,0,0.08)',
} as const;
