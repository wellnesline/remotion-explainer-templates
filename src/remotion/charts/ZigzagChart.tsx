/**
 * 解説アニメコンポーネント(サンプル):ジグザグ折れ線グラフ。
 * 800×450 (16:9) で出力。
 * 「線が左→右に伸びていく」ホワイトボード描画風アニメ。
 */
import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring} from 'remotion';

// サンプルパレット(実際の配色は用途に合わせて差し替える)
const INK = '#37474F';
const LINE_COLOR = '#26A69A';
const NOTE_BG = '#ECEFF1';
const PANEL_BG = '#E0F2F1';
const WHITE = '#FFFFFF';

// ジグザグ折れ線(0-100の範囲、合成データ)
// y 値が小さいほど画面の上(=高い値)
const POINTS = [
  {x: 0,   y: 80},   // 起点(低)
  {x: 10,  y: 72},
  {x: 20,  y: 65},
  {x: 30,  y: 75},   // 折れ点
  {x: 40,  y: 50},
  {x: 50,  y: 38},
  {x: 60,  y: 55},   // 折れ点
  {x: 70,  y: 32},
  {x: 80,  y: 20},
  {x: 90,  y: 25},
  {x: 100, y: 10},   // 終点(高)
];

const VIEW_W = 800;
const VIEW_H = 450;
// グラフ描画領域(ヘッダー・脚注用に上下マージン)
const GRAPH_X = 70;
const GRAPH_Y = 115;
const GRAPH_W = 660;
const GRAPH_H = 245;

// SVG の path 文字列を生成(0..100 の論理座標 → グラフ領域にマップ)
const buildPath = () => {
  const pts = POINTS.map(p => {
    const sx = GRAPH_X + (p.x / 100) * GRAPH_W;
    const sy = GRAPH_Y + (p.y / 100) * GRAPH_H;
    return `${sx.toFixed(1)},${sy.toFixed(1)}`;
  });
  return 'M' + pts.join(' L');
};

const ZigzagChart: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();

  // タイミング設計(秒):
  //   0.0 - 0.4  : タイトル fade-in
  //   0.4 - 0.8  : X/Y軸 描画
  //   0.8 - 4.0  : 折れ線 stroke 描画(3.2秒で全体)
  //   4.0 - 4.5  : ラベル「ラベルB(サンプル)」「ラベルA(サンプル)」フェードイン
  //   4.5 - 5.0  : 中央テキスト「中央メッセージ(サンプル)」フェードイン
  //   それ以降は静止
  const t = frame / fps;

  // タイトル fade-in
  const titleOpacity = interpolate(t, [0.0, 0.4], [0, 1], {extrapolateRight: 'clamp'});
  // 軸 fade-in
  const axisOpacity = interpolate(t, [0.4, 0.8], [0, 1], {extrapolateRight: 'clamp'});
  // 折れ線描画進捗(0-1)
  const lineProgress = interpolate(t, [0.8, 4.0], [0, 1], {extrapolateRight: 'clamp', extrapolateLeft: 'clamp'});
  // 注釈ラベル fade-in
  const labelTrend = interpolate(t, [4.0, 4.5], [0, 1], {extrapolateRight: 'clamp'});
  const labelDip = interpolate(t, [4.2, 4.7], [0, 1], {extrapolateRight: 'clamp'});
  // 中央テキスト
  const centerOpacity = interpolate(t, [4.5, 5.0], [0, 1], {extrapolateRight: 'clamp'});

  // 折れ線の path
  const pathD = buildPath();
  // strokeDasharray + strokeDashoffset で描画進捗を表現
  // 折れ線の概算長(直線距離合計)
  const lineLen = (() => {
    let acc = 0;
    for (let i = 1; i < POINTS.length; i++) {
      const dx = ((POINTS[i].x - POINTS[i-1].x) / 100) * GRAPH_W;
      const dy = ((POINTS[i].y - POINTS[i-1].y) / 100) * GRAPH_H;
      acc += Math.sqrt(dx*dx + dy*dy);
    }
    return acc;
  })();
  const dashOffset = lineLen * (1 - lineProgress);

  // 「ラベルA(サンプル)」ラベル位置(2回目の谷=index 6, x=60)
  const dipX = GRAPH_X + (60 / 100) * GRAPH_W;
  const dipY = GRAPH_Y + (55 / 100) * GRAPH_H;

  return (
    <AbsoluteFill style={{
      backgroundColor: WHITE,
      fontFamily: '"Hiragino Maru Gothic ProN", "Comic Sans MS", sans-serif',
      color: INK,
    }}>
      {/* タイトル */}
      <div style={{
        position: 'absolute', top: 28, left: 0, width: '100%',
        textAlign: 'center',
        fontSize: 50, fontWeight: 900, color: INK,
        opacity: titleOpacity,
      }}>
        タイトル(サンプル)
        <div style={{
          width: 480, height: 8, margin: '4px auto 0',
          backgroundImage: `linear-gradient(90deg, ${LINE_COLOR} 0 50%, transparent 50%)`,
          backgroundSize: '20px 8px',
          borderRadius: 4,
        }} />
      </div>

      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        width={VIEW_W} height={VIEW_H}
        style={{position: 'absolute', top: 0, left: 0}}
      >
        {/* X軸 */}
        <line
          x1={GRAPH_X} y1={GRAPH_Y + GRAPH_H} x2={GRAPH_X + GRAPH_W} y2={GRAPH_Y + GRAPH_H}
          stroke={INK} strokeWidth={3} opacity={axisOpacity}
        />
        {/* Y軸 */}
        <line
          x1={GRAPH_X} y1={GRAPH_Y} x2={GRAPH_X} y2={GRAPH_Y + GRAPH_H}
          stroke={INK} strokeWidth={3} opacity={axisOpacity}
        />
        {/* X軸ラベル */}
        <text x={GRAPH_X + GRAPH_W + 10} y={GRAPH_Y + GRAPH_H + 8}
              fontSize={22} fill={INK} opacity={axisOpacity}>
          時間 →
        </text>
        {/* Y軸ラベル */}
        <text x={GRAPH_X - 50} y={GRAPH_Y - 10}
              fontSize={22} fill={INK} opacity={axisOpacity}>
          ↑ 値
        </text>

        {/* 折れ線本体(描画進捗で長さ制御) */}
        <path
          d={pathD}
          fill="none"
          stroke={LINE_COLOR}
          strokeWidth={6}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={lineLen}
          strokeDashoffset={dashOffset}
        />

        {/* 「ラベルA(サンプル)」注釈(谷を指す) */}
        <g opacity={labelDip}>
          <text x={dipX - 30} y={dipY + 60} fontSize={22} fill={INK} fontWeight={700}>
            ラベルA(サンプル)
          </text>
          <line x1={dipX + 30} y1={dipY + 45} x2={dipX + 5} y2={dipY + 10}
                stroke={INK} strokeWidth={2} />
        </g>

        {/* ラベル B 注釈(右上を指す) */}
        <g opacity={labelTrend}>
          <text x={GRAPH_X + GRAPH_W - 250} y={GRAPH_Y + 30} fontSize={26} fill={INK} fontWeight={800}>
            ラベルB(サンプル) ↗
          </text>
        </g>
      </svg>

      {/* 中央メッセージ「中央メッセージ(サンプル)」 */}
      <div style={{
        position: 'absolute', bottom: 38, left: 0, width: '100%',
        textAlign: 'center',
        fontSize: 38, fontWeight: 900,
        color: INK,
        opacity: centerOpacity,
      }}>
        <span style={{
          background: NOTE_BG,
          padding: '6px 24px',
          borderRadius: 8,
          border: `3px solid ${INK}`,
        }}>
          中央メッセージ(サンプル)
        </span>
      </div>
    </AbsoluteFill>
  );
};

export {ZigzagChart};
