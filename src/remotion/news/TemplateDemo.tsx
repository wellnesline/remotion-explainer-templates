/**
 * TemplateDemo — ワイプ背景テンプレ A/B/C/D/F/G を5秒ずつ並べたデモ
 *
 * ライトテーマ + テロップ枠+フレームに乗せて
 * 同じレイアウトで切替えで雰囲気が比較できるようにする。
 */
import {AbsoluteFill, useCurrentFrame, useVideoConfig, spring, Sequence, interpolate} from 'remotion';
import {loadLocalNotoSansJP} from './localFont';
import {theme, fontSize, fontWeight, radius} from './theme';
import {NumberTicker} from './components/NumberTicker';
import {SparkLine} from './components/SparkLine';
import {BarPulse} from './components/BarPulse';
import {Donut} from './components/Donut';
import {CompareBars} from './components/CompareBars';

const fontFamily = loadLocalNotoSansJP();

const W = 1080;
const TELOP_TOP = 160;
const TELOP_BOTTOM = 380;
const WIPE_X = 12;
const WIPE_Y = 395;
const WIPE_W = 1056;
const WIPE_H = 819;
const BORDER = 12;
const BADGE_W = 186;
const FRAME_COLOR = '#455A64';  // サンプル色
const WHITE = '#FFFFFF';
const BLACK = '#0A0A0A';

const SCENE_DUR = 150;  // 5s @ 30fps
const sp = (frame: number, fps: number, delay = 0, damping = 200, mass = 0.5) =>
  spring({frame: Math.max(0, frame - delay), fps, config: {damping, mass}});

// ---- 共通フレーム(バッジ+テロップ+ワイプ枠) ----
const Frame: React.FC<{label: string; children: React.ReactNode}> = ({label, children}) => (
  <AbsoluteFill style={{background: BLACK}}>
    {/* バッジ */}
    <div
      style={{
        position: 'absolute', top: TELOP_TOP, left: 0, width: BADGE_W,
        height: TELOP_BOTTOM - TELOP_TOP, background: FRAME_COLOR,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div style={{color: WHITE, fontFamily, fontWeight: 900, fontSize: 60, letterSpacing: 6}}>LABEL</div>
    </div>
    {/* テロップ右パネル */}
    <div
      style={{
        position: 'absolute', top: TELOP_TOP, left: BADGE_W,
        width: W - BADGE_W, height: TELOP_BOTTOM - TELOP_TOP,
        background: WHITE,
      }}
    >
      <div style={{position: 'absolute', top: 0, left: 0, width: '100%', height: 60, background: '#37474F', display: 'flex', alignItems: 'center', paddingLeft: 30}}>
        <div style={{color: WHITE, fontFamily, fontWeight: 700, fontSize: 28}}>テンプレートデモ</div>
      </div>
      <div style={{position: 'absolute', top: 60, left: 30, color: BLACK, fontFamily, fontWeight: 900, fontSize: 64, lineHeight: 1.1, paddingTop: 30}}>
        {label}
      </div>
    </div>
    {/* フレーム+ワイプ */}
    <div
      style={{
        position: 'absolute', left: WIPE_X, top: WIPE_Y, width: WIPE_W, height: WIPE_H,
        border: `${BORDER}px solid ${FRAME_COLOR}`, boxSizing: 'border-box',
      }}
    />
    <div
      style={{
        position: 'absolute', left: WIPE_X + BORDER, top: WIPE_Y + BORDER,
        width: WIPE_W - BORDER * 2, height: WIPE_H - BORDER * 2,
        background: theme.bg, overflow: 'hidden',
      }}
    >
      {children}
    </div>
  </AbsoluteFill>
);

// ---- 各テンプレ ----
const A_SparkLine: React.FC = () => {
  const points = [10, 12, 11, 15, 17, 16, 20, 22, 23, 25];  // 合成データ
  return (
    <AbsoluteFill style={{padding: '40px 50px', display: 'flex', flexDirection: 'column'}}>
      <div style={{color: theme.textSub, fontSize: fontSize.caption, fontFamily, fontWeight: 700}}>A. SparkLine(線+グラデ)</div>
      <div style={{flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 100}}>
        <div style={{position: 'absolute', inset: 0}}>
          <SparkLine points={points} width={1000} height={520} color={theme.up} gradient glow delay={6} damping={170} />
        </div>
        <NumberTicker target={25} delay={6} fontSize={fontSize.hero} color={theme.text} fontFamily={fontFamily} suffix="pt" suffixSize={80} />
      </div>
    </AbsoluteFill>
  );
};

const B_BarPulse: React.FC = () => {
  const bars = [
    {label: 'P1', value: 20},
    {label: 'P2', value: 30},
    {label: 'P3', value: 25},
    {label: 'P4', value: 40},
    {label: 'P5', value: 45},
  ];
  return (
    <AbsoluteFill style={{padding: '40px 50px', display: 'flex', flexDirection: 'column'}}>
      <div style={{color: theme.textSub, fontSize: fontSize.caption, fontFamily, fontWeight: 700}}>B. BarPulse(縦棒spring)</div>
      <div style={{color: theme.text, fontSize: fontSize.subheading, fontFamily, fontWeight: 900, marginBottom: 8}}>
        サンプル指標 推移(合成データ)
      </div>
      <div style={{flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 80}}>
        <BarPulse bars={bars} width={950} height={520} color={theme.warning} delay={6} />
      </div>
    </AbsoluteFill>
  );
};

const C_CompareBars: React.FC = () => {
  const rows = [
    {label: '指標X 予想', value: 50, color: theme.neutral},
    {label: '指標X 実績', value: 60, color: theme.up},
    {label: '指標Y 予想', value: 2.0, color: theme.neutral},
    {label: '指標Y 実績', value: 2.5, color: theme.up},
  ];
  return (
    <AbsoluteFill style={{padding: '40px 50px', display: 'flex', flexDirection: 'column'}}>
      <div style={{color: theme.textSub, fontSize: fontSize.caption, fontFamily, fontWeight: 700}}>C. CompareBars(予想vs実績)</div>
      <div style={{color: theme.text, fontSize: fontSize.subheading, fontFamily, fontWeight: 900, marginBottom: 16}}>
        サンプルA 予想比較
      </div>
      <div style={{flex: 1, position: 'relative', marginBottom: 80}}>
        <CompareBars rows={rows} width={950} height={500} delay={6} />
      </div>
    </AbsoluteFill>
  );
};

const D_Donut: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const numProg = sp(frame, fps, 6, 180, 0.5);
  return (
    <AbsoluteFill style={{padding: '40px 50px', display: 'flex', flexDirection: 'column'}}>
      <div style={{color: theme.textSub, fontSize: fontSize.caption, fontFamily, fontWeight: 700}}>D. Donut(円弧+中央数字)</div>
      <div style={{color: theme.text, fontSize: fontSize.subheading, fontFamily, fontWeight: 900, marginBottom: 8}}>
        サンプルA 達成率
      </div>
      <div style={{flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 80}}>
        <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <Donut percent={50} width={520} height={520} color={theme.up} delay={6} />
        </div>
        <div style={{position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: numProg}}>
          <div style={{color: theme.text, fontSize: fontSize.heroSm, fontFamily, fontWeight: 900, fontVariantNumeric: 'tabular-nums'}}>
            +5<span style={{fontSize: 70}}>%</span>
          </div>
          <div style={{color: theme.textSub, fontSize: fontSize.body, fontFamily, fontWeight: 700, marginTop: 6}}>前年比</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const F_NumericMinimal: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const pulse = 1 + 0.04 * Math.sin((frame / 30) * Math.PI * 2);
  return (
    <AbsoluteFill style={{padding: '40px 50px', display: 'flex', flexDirection: 'column', background: theme.bg}}>
      <div style={{color: theme.textSub, fontSize: fontSize.caption, fontFamily, fontWeight: 700}}>F. NumericMinimal(数字のみ強調)</div>
      <div style={{flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 80}}>
        {/* 微細スキャンライン */}
        <div style={{position: 'absolute', inset: 0, opacity: 0.06, backgroundImage: `repeating-linear-gradient(0deg, ${theme.text} 0 1px, transparent 1px 6px)`}} />
        <div style={{position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', transform: `scale(${pulse})`}}>
          <NumberTicker target={25} delay={6} fontSize={240} color={theme.text} fontFamily={fontFamily} suffix="pt" suffixSize={120} />
          <div style={{color: theme.textSub, fontSize: fontSize.body, fontFamily, fontWeight: 700, marginTop: 14}}>サンプル指標(合成データ)</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const G_CardStack: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const cards = [
    {tag: 'T1', title: 'サンプルA 更新', sub: 'サンプル説明文', value: '+5%', color: theme.down},
    {tag: 'T2', title: 'サンプルB 変動', sub: 'サンプル説明文', value: '+10', color: theme.up},
    {tag: 'T3', title: 'サンプルC 項目', sub: 'サンプル説明文', value: '増加', color: theme.accent},
  ];
  return (
    <AbsoluteFill style={{padding: '40px 50px', display: 'flex', flexDirection: 'column', background: theme.bg}}>
      <div style={{color: theme.textSub, fontSize: fontSize.caption, fontFamily, fontWeight: 700}}>G. CardStack(順次カード)</div>
      <div style={{color: theme.text, fontSize: fontSize.subheading, fontFamily, fontWeight: 900, marginBottom: 16}}>
        サンプル一覧
      </div>
      <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 80}}>
        {cards.map((c, i) => {
          const p = sp(frame, fps, 6 + i * 10, 200, 0.5);
          return (
            <div key={i} style={{
              background: theme.surface, borderLeft: `6px solid ${c.color}`, borderRadius: radius.md,
              padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 16,
              opacity: p, transform: `translateX(${interpolate(p, [0, 1], [-30, 0])}px)`,
            }}>
              <span style={{background: c.color, color: WHITE, fontSize: fontSize.bodySm, fontFamily, fontWeight: 900, padding: '6px 12px', borderRadius: radius.sm, minWidth: 50, textAlign: 'center'}}>{c.tag}</span>
              <div style={{display: 'flex', flexDirection: 'column', flex: 1}}>
                <span style={{color: theme.text, fontFamily, fontSize: fontSize.body, fontWeight: 900}}>{c.title}</span>
                <span style={{color: theme.textSub, fontFamily, fontSize: fontSize.caption, fontWeight: 700}}>{c.sub}</span>
              </div>
              <span style={{color: c.color, fontFamily, fontSize: fontSize.body, fontWeight: 900}}>{c.value}</span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

export const TemplateDemo: React.FC = () => {
  return (
    <>
      <Sequence from={0 * SCENE_DUR} durationInFrames={SCENE_DUR}>
        <Frame label="A. SparkLine 線グラフ"><A_SparkLine /></Frame>
      </Sequence>
      <Sequence from={1 * SCENE_DUR} durationInFrames={SCENE_DUR}>
        <Frame label="B. BarPulse 縦棒spring"><B_BarPulse /></Frame>
      </Sequence>
      <Sequence from={2 * SCENE_DUR} durationInFrames={SCENE_DUR}>
        <Frame label="C. CompareBars 予想vs実績"><C_CompareBars /></Frame>
      </Sequence>
      <Sequence from={3 * SCENE_DUR} durationInFrames={SCENE_DUR}>
        <Frame label="D. Donut 円弧"><D_Donut /></Frame>
      </Sequence>
      <Sequence from={4 * SCENE_DUR} durationInFrames={SCENE_DUR}>
        <Frame label="F. NumericMinimal 数字のみ"><F_NumericMinimal /></Frame>
      </Sequence>
      <Sequence from={5 * SCENE_DUR} durationInFrames={SCENE_DUR}>
        <Frame label="G. CardStack 順次カード"><G_CardStack /></Frame>
      </Sequence>
    </>
  );
};
