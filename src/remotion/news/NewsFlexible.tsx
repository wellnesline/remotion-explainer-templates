/**
 * NewsFlexible — 設定駆動型ニュースダイジェスト Composition
 *
 * inputProps 経由で config + script を受け取り sub-scenes を動的生成。
 * 各topic = 1 sceneで簡略化。template:'sparkline'|'barpulse'|'donut'|'comparebars'|'minimal'
 *
 * 構造: [INTRO 6s] [topic1 ~Ts] [topic2 ~Ts] ... [OUTRO ~10s]
 */
import * as React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  Sequence,
  Img,
  staticFile,
} from 'remotion';
import {TransitionSeries, linearTiming} from '@remotion/transitions';
import {slide} from '@remotion/transitions/slide';
import {fade} from '@remotion/transitions/fade';
import {wipe} from '@remotion/transitions/wipe';
import {loadLocalNotoSansJP} from './localFont';
import {theme, fontSize, fontWeight, radius} from './theme';
import {NumberTicker} from './components/NumberTicker';
import {SparkLine} from './components/SparkLine';
import {BarPulse} from './components/BarPulse';
import {Donut} from './components/Donut';
import {CompareBars} from './components/CompareBars';

const fontFamily = loadLocalNotoSansJP();

// レイアウト定数
const W = 1080;
const TELOP_TOP = 160;
const TELOP_BOTTOM = 380;
const WIPE_X = 12;
const WIPE_Y = 395;
const WIPE_W = 1056;
const WIPE_H = 819;
const BORDER = 12;
const BADGE_W = 186;
// テーマ色・ラベル文言は中立なサンプル値。実運用の値は config.labels / この定数を差し替えて使う。
const PRIMARY = '#455A64';
const ALT = '#6D4C41';
const SUBTOP_PRIMARY = '#37474F';
const SUBTOP_ALT = '#4E342E';
const DEFAULT_LABELS = {
  badge: 'LABEL',
  intro_cat: 'Digest',
  intro_segs: [{text: 'Daily', color: 'black'}, {text: 'digest', color: 'accent'}],
  outro_cat: 'Recap',
  outro_segs: [{text: 'Topics', color: 'black'}, {text: 'recap', color: 'accent'}],
};
const WHITE = '#FFFFFF';
const BLACK = '#0A0A0A';

const ThemeColorContext = React.createContext<string>(PRIMARY);

// 色キー → 実色
const colorMap: Record<string, string> = {
  up: theme.up,
  down: theme.down,
  accent: theme.accent,
  warning: theme.warning,
  black: theme.text,
  red: theme.down,
  neutral: theme.neutral,
};
const sizeMap: Record<string, number> = {
  hero: fontSize.hero,
  heroSm: fontSize.heroSm,
  heading: fontSize.heading,
  headingSm: fontSize.headingSm,
  subheading: fontSize.subheading,
};

const sp = (frame: number, fps: number, delay = 0, damping = 200, mass = 0.5) =>
  spring({frame: Math.max(0, frame - delay), fps, config: {damping, mass}});

// fitFontSize ヘルパ: 文字数に応じてフォントサイズを自動縮小
const fitFontSize = (text: string, maxPx: number, availWidth = 880, charRatio = 1.0): number => {
  if (!text) return maxPx;
  const len = [...text].length;
  const fitted = Math.floor(availWidth / Math.max(1, len * charRatio));
  return Math.max(40, Math.min(maxPx, fitted));
};

interface Config {
  date: string;
  intro: {
    title: string;
    date_label: string;
    items: {tag: string; title: string; key: string; color: string}[];
  };
  topics: Topic[];
  outro: {
    title: string;
    items: {tag: string; title: string; sub: string; key: string; color: string}[];
    cta: string;
  };
  duration_sec: number;
}

interface Topic {
  id: string;
  telop_cat: string;
  telop_segs: {text: string; color: string}[];
  scenes: SceneSpec[];
}

interface SceneSpec {
  template: string;
  date?: string;
  date_label?: string;
  title?: string;
  sub?: string;
  donut_percent?: number;
  value_main?: string;
  value_unit?: string;
  value_main_text?: string;
  value_sub?: string;
  bars?: {label: string; value: number}[];
  rows?: {label: string; value: number; color: string; value_label?: string}[];
  points?: number[];
  main_lines?: {text: string; color: string; size: string}[];
  tagline?: string;
  color?: string;
  chip?: string;
  chip_color?: string;
}

// ============== 共通: ラベルバッジ ==============
const NewsBadge: React.FC<{label: string}> = ({label}) => {
  const frame = useCurrentFrame();
  const themeColor = React.useContext(ThemeColorContext);
  const fadeVal = interpolate(frame, [0, 3], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{
      position: 'absolute', top: TELOP_TOP, left: 0, width: BADGE_W,
      height: TELOP_BOTTOM - TELOP_TOP, background: themeColor,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      opacity: fadeVal, boxShadow: '4px 0 12px rgba(0,0,0,0.4)',
    }}>
      <div style={{color: WHITE, fontFamily, fontWeight: 900, fontSize: 60, letterSpacing: 6, textShadow: '0 2px 4px rgba(0,0,0,0.3)'}}>
        {label}
      </div>
    </div>
  );
};

// ============== 共通: テロップ右パネル ==============
const Telop: React.FC<{cat: string; segs: {text: string; color: string}[]}> = ({cat, segs}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const themeColor = React.useContext(ThemeColorContext);
  const subtopBg = themeColor === ALT ? SUBTOP_ALT : SUBTOP_PRIMARY;
  const PANEL_W = W - BADGE_W;
  const SUBTOP_H = 60;
  return (
    <div style={{
      position: 'absolute', left: 0, top: 0, width: PANEL_W,
      height: TELOP_BOTTOM - TELOP_TOP, background: WHITE, overflow: 'hidden',
      boxShadow: 'inset 0 -3px 0 0 #000',
    }}>
      <div style={{
        position: 'absolute', left: 0, top: 0, width: '100%', height: SUBTOP_H,
        background: subtopBg, display: 'flex', alignItems: 'center', paddingLeft: 30,
      }}>
        <div style={{color: WHITE, fontFamily, fontWeight: 700, fontSize: 28, letterSpacing: 1}}>
          {cat}
        </div>
      </div>
      <div style={{
        position: 'absolute', left: 0, top: SUBTOP_H, width: '100%',
        height: TELOP_BOTTOM - TELOP_TOP - SUBTOP_H,
        display: 'flex', alignItems: 'center', paddingLeft: 30, paddingRight: 30,
      }}>
        <div style={{display: 'flex', flexWrap: 'wrap', alignItems: 'center', rowGap: 6, lineHeight: 1.1}}>
          {segs.map((s, i) => {
            const prog = sp(frame, fps, i * 4, 220, 0.45);
            const x = interpolate(prog, [0, 1], [-80, 0]);
            return (
              <span key={i} style={{
                color: colorMap[s.color] ?? theme.text,
                fontFamily, fontWeight: 900, fontSize: 56,
                opacity: prog, transform: `translateX(${x}px)`,
                display: 'inline-block',
              }}>
                {s.text}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ============== 共通: フレーム+ワイプ容器 ==============
const Wipe: React.FC<{children: React.ReactNode}> = ({children}) => {
  const themeColor = React.useContext(ThemeColorContext);
  return (
    <>
      <div style={{
        position: 'absolute', left: WIPE_X, top: WIPE_Y, width: WIPE_W, height: WIPE_H,
        border: `${BORDER}px solid ${themeColor}`, boxSizing: 'border-box', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', left: WIPE_X + BORDER, top: WIPE_Y + BORDER,
        width: WIPE_W - BORDER * 2, height: WIPE_H - BORDER * 2,
        background: theme.bg, overflow: 'hidden',
      }}>
        {children}
      </div>
    </>
  );
};

// ============== INTRO ==============
const SceneIntro: React.FC<{intro: Config['intro']}> = ({intro}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const sc0 = sp(frame, fps, 0, 280, 0.4);
  const sc1 = sp(frame, fps, 25, 200, 0.45);
  const N = intro.items.length;
  return (
    <AbsoluteFill style={{background: theme.bg, fontFamily, padding: '0 30px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 14}}>
      <div style={{color: theme.textSub, fontSize: fontSize.caption, fontWeight: fontWeight.bold, opacity: sc0, letterSpacing: 6}}>
        {intro.date_label}
      </div>
      <div style={{color: theme.text, fontSize: fontSize.heading, fontWeight: fontWeight.black, opacity: sc1, transform: `scale(${interpolate(sc1, [0, 1], [0.85, 1])})`, marginBottom: 10, letterSpacing: 2}}>
        {intro.title}
      </div>
      {intro.items.map((it, i) => {
        const sc = sp(frame, fps, 35 + i * 18, 200, 0.45);
        return (
          <div key={it.tag} style={{
            display: 'flex', alignItems: 'center', gap: 18,
            opacity: sc, transform: `translateX(${interpolate(sc, [0, 1], [-60, 0])}px)`,
            background: theme.surface, padding: '12px 24px', borderRadius: radius.md,
            borderLeft: `6px solid ${colorMap[it.color] ?? theme.accent}`,
            width: 920,
          }}>
            <span style={{
              color: WHITE, background: colorMap[it.color] ?? theme.accent,
              fontFamily, fontWeight: 900, fontSize: fontSize.bodySm,
              padding: '6px 16px', borderRadius: radius.sm, letterSpacing: 1,
              flexShrink: 0, whiteSpace: 'nowrap',
            }}>
              {it.tag}
            </span>
            <span style={{color: theme.text, fontSize: fontSize.body, fontWeight: 900, flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{it.title}</span>
            <span style={{color: colorMap[it.color] ?? theme.accent, fontSize: fontSize.body, fontWeight: 900, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', flexShrink: 0}}>
              {it.key}
            </span>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ============== シーンレンダラ(template切替・time-rotate) ==============
const SceneOne: React.FC<{sc: SceneSpec}> = ({sc}) => {
  const t = sc.template;
  return (
    <AbsoluteFill style={{background: theme.bg, fontFamily, padding: '40px 50px 50px 50px', display: 'flex', flexDirection: 'column'}}>
      <Header title={sc.title ?? ''} sub={sc.sub ?? ''} chip={sc.chip} chipColor={sc.chip_color} />
      <div style={{flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
        {t === 'sparkline' && <TplSparkLine sc={sc} />}
        {t === 'barpulse' && <TplBarPulse sc={sc} />}
        {t === 'donut' && <TplDonut sc={sc} />}
        {t === 'comparebars' && <TplCompareBars sc={sc} />}
        {t === 'minimal' && <TplMinimal sc={sc} />}
      </div>
    </AbsoluteFill>
  );
};

const SceneByTemplate: React.FC<{
  topic: Topic;
  topicStart: number;
  topicEnd: number;
  topicLines?: ScriptLine[];
  fps?: number;
}> = ({topic, topicStart, topicEnd, topicLines, fps: fpsProp}) => {
  const frame = useCurrentFrame();
  const {fps: fpsCtx} = useVideoConfig();
  const fps = fpsProp ?? fpsCtx;
  const N = topic.scenes.length;

  // line 駆動切替: topicLines があり、scene_idx が1つでも明示されていれば line ベース
  // 現在 frame に該当する line を探し、その scene_idx を採用
  let idx = 0;
  let sceneFrom = topicStart;
  const hasExplicit = !!topicLines && topicLines.some((l) => typeof l.scene_idx === 'number');
  if (topicLines && topicLines.length > 0) {
    const sortedLines = [...topicLines].sort((a, b) => a.start_sec - b.start_sec);
    // 各 line の scene_idx を解決(明示優先、未指定は N 等分 fallback)
    const resolvedIdx: number[] = sortedLines.map((ln, i) => {
      if (hasExplicit && typeof ln.scene_idx === 'number') {
        return Math.min(N - 1, Math.max(0, ln.scene_idx));
      }
      return Math.min(N - 1, Math.floor(i * N / sortedLines.length));
    });
    // line 開始 frame
    const startFrames: number[] = sortedLines.map((ln) => Math.round(ln.start_sec * fps));
    // 現在 line を特定
    let curLineIdx = 0;
    for (let i = 0; i < sortedLines.length; i++) {
      const startF = startFrames[i];
      const endF = i + 1 < sortedLines.length ? startFrames[i + 1] : topicEnd;
      if (frame >= startF && frame < endF) {
        curLineIdx = i;
        break;
      }
    }
    idx = resolvedIdx[curLineIdx];
    // 同じ scene_idx が連続する区間の "最初" の line に sceneFrom を固定 → アニメ再生されない
    let segStart = curLineIdx;
    while (segStart > 0 && resolvedIdx[segStart - 1] === idx) {
      segStart--;
    }
    sceneFrom = startFrames[segStart];
  } else {
    // 旧来の均等時間割り(後方互換)
    const span = Math.max(1, Math.floor((topicEnd - topicStart) / N));
    const rel = frame - topicStart;
    idx = Math.min(N - 1, Math.max(0, Math.floor(rel / span)));
    sceneFrom = topicStart + idx * span;
  }
  const sc = topic.scenes[idx];
  return (
    <AbsoluteFill style={{background: theme.bg, fontFamily}}>
      <Sequence from={sceneFrom} layout="none">
        <SceneOne key={idx} sc={sc} />
      </Sequence>
      {/* 進捗ドット (右上) */}
      <div style={{position: 'absolute', top: 18, right: 24, display: 'flex', gap: 8, zIndex: 10}}>
        {topic.scenes.map((_, i) => (
          <div key={i} style={{
            width: i === idx ? 22 : 10, height: 10,
            background: i === idx ? colorMap.up : '#D6D6DC',
            borderRadius: 5,
          }} />
        ))}
      </div>
    </AbsoluteFill>
  );
};

const ChipBottom: React.FC<{text: string; color: string}> = ({text, color}) => (
  <div style={{
    width: '100%', height: '100%', paddingRight: 50, paddingBottom: 16,
    display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
    pointerEvents: 'none',
  }}>
    <Chip text={text} color={color} />
  </div>
);

const Header: React.FC<{title: string; sub: string; chip?: string; chipColor?: string}> = ({title, sub, chip, chipColor}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const prog = sp(frame, fps, 0, 220, 0.45);
  const y = interpolate(prog, [0, 1], [-20, 0]);
  return (
    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: prog, transform: `translateY(${y}px)`, marginBottom: 24, gap: 32}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1, paddingRight: 16}}>
        <div style={{width: 56, height: 56, borderRadius: 12, background: theme.text, color: theme.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 26, flexShrink: 0}}>i</div>
        <div style={{minWidth: 0, overflow: 'hidden'}}>
          <div style={{color: theme.text, fontSize: fontSize.subheading, fontWeight: 900, lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{title}</div>
          <div style={{color: theme.textSub, fontSize: fontSize.caption, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{sub}</div>
        </div>
      </div>
      {chip && (
        <div style={{flexShrink: 0}}>
          <Chip text={chip} color={chipColor ?? 'up'} />
        </div>
      )}
    </div>
  );
};

const Chip: React.FC<{text: string; color: string}> = ({text, color}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const prog = sp(frame, fps, 26, 220, 0.5);
  const c = colorMap[color] ?? theme.up;
  const shadow =
    color === 'down' ? 'rgba(255,59,48,0.3)' :
    color === 'warning' ? 'rgba(255,159,10,0.3)' :
    color === 'accent' ? 'rgba(10,132,255,0.3)' : 'rgba(48,209,88,0.3)';
  return (
    <div style={{
      background: c, color: theme.bg,
      boxShadow: `0 4px 12px ${shadow}`,
      fontSize: fontSize.body, fontWeight: 900,
      padding: '12px 24px', borderRadius: radius.pill,
      opacity: prog, transform: `scale(${interpolate(prog, [0, 1], [0.7, 1])})`,
    }}>
      {text}
    </div>
  );
};

// ---- Templates ----
const TplSparkLine: React.FC<{sc: SceneSpec}> = ({sc}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const prog = sp(frame, fps, 6, 180, 0.45);
  const rawStr = String(sc.value_main ?? '');
  const numVal = parseFloat(rawStr.replace(/,/g, '').replace(/^\+/, ''));
  if (isNaN(numVal)) {
    return (
      <div style={{flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingTop: 30}}>
        <div style={{opacity: prog, color: theme.text, fontSize: fontSize.heroSm, fontWeight: 900}}>
          {rawStr}
        </div>
        <div style={{width: '100%', height: 280}}>
          <SparkLine points={sc.points ?? [1,2,3]} width={920} height={280} color={colorMap[sc.color ?? 'up'] ?? theme.up} gradient glow delay={10} damping={170} />
        </div>
      </div>
    );
  }
  return (
    <div style={{flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingTop: 30}}>
      <div style={{opacity: prog, transform: `scale(${interpolate(prog, [0, 1], [0.85, 1])})`}}>
        <NumberTicker
          target={numVal}
          delay={6} damping={170}
          decimals={rawStr.includes('.') ? 1 : 0}
          prefix={rawStr.startsWith('+') ? '+' : ''}
          suffix={sc.value_unit ?? ''}
          fontSize={fontSize.hero}
          color={theme.text} fontWeight={900} fontFamily={fontFamily}
          thousands
        />
      </div>
      <div style={{width: '100%', height: 280}}>
        <SparkLine points={sc.points ?? [1,2,3]} width={920} height={280} color={colorMap[sc.color ?? 'up'] ?? theme.up} gradient glow delay={10} damping={170} />
      </div>
    </div>
  );
};

const TplBarPulse: React.FC<{sc: SceneSpec}> = ({sc}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const prog = sp(frame, fps, 6, 180, 0.45);
  return (
    <div style={{flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', gap: 12}}>
      {sc.value_main_text && (
        <div style={{color: theme.text, fontSize: 76, fontWeight: 900, opacity: prog, transform: `scale(${interpolate(prog, [0, 1], [0.85, 1])})`, lineHeight: 1}}>
          {sc.value_main_text}
        </div>
      )}
      <BarPulse
        bars={sc.bars ?? []}
        width={920}
        height={400}
        color={colorMap[sc.color ?? 'warning'] ?? theme.warning}
        glow delay={10}
        axisColor={theme.hairline}
      />
    </div>
  );
};

const TplDonut: React.FC<{sc: SceneSpec}> = ({sc}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const prog = sp(frame, fps, 6, 180, 0.5);
  return (
    <div style={{flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%'}}>
      <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <Donut percent={sc.donut_percent ?? 50} width={520} height={520} color={colorMap[sc.color ?? 'up'] ?? theme.up} delay={6} thickness={28} />
      </div>
      <div style={{position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: prog}}>
        <div style={{
          color: theme.text, fontSize: fontSize.heroSm, fontWeight: 900, fontVariantNumeric: 'tabular-nums', lineHeight: 1,
          transform: `scale(${interpolate(prog, [0, 1], [0.85, 1])})`,
        }}>
          {sc.value_main}<span style={{fontSize: 90, marginLeft: 6}}>{sc.value_unit}</span>
        </div>
        {sc.value_sub && (
          <div style={{color: theme.textSub, fontSize: fontSize.body, fontWeight: 600, marginTop: 6}}>
            {sc.value_sub}
          </div>
        )}
      </div>
    </div>
  );
};

const TplCompareBars: React.FC<{sc: SceneSpec}> = ({sc}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const prog = sp(frame, fps, 6, 180, 0.45);
  const rows = (sc.rows ?? []).map((r) => ({...r, color: colorMap[r.color] ?? theme.neutral}));
  const hasChip = Boolean(sc.chip);
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', width: '100%', gap: 16,
      paddingBottom: hasChip ? 24 : 0,
    }}>
      {sc.value_main_text && (
        <div style={{
          color: theme.up, fontSize: 96, fontWeight: 900, letterSpacing: 4,
          opacity: prog, transform: `scale(${interpolate(prog, [0, 1], [0.85, 1])})`,
        }}>
          {sc.value_main_text}
        </div>
      )}
      <CompareBars
        rows={rows}
        width={920}
        height={400}
        delay={10}
        mode={((sc as any).compare_mode === 'rate' ? 'rate' : 'absolute')}
        unit_default={(sc as any).unit_default}
        upColor={theme.up}
        downColor={theme.down}
      />
    </div>
  );
};

const TplMinimal: React.FC<{sc: SceneSpec}> = ({sc}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <div style={{flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', gap: 28}}>
      <div style={{position: 'absolute', inset: 0, opacity: 0.05, backgroundImage: `repeating-linear-gradient(0deg, ${theme.text} 0 1px, transparent 1px 6px)`}} />
      {(sc.main_lines ?? []).map((ml, i) => {
        const isHero = ml.size === 'hero';
        const prog = sp(frame, fps, 8 + i * 10, 200, 0.45);
        const baseFontSize = sizeMap[ml.size] ?? fontSize.heading;
        const dynFontSize = fitFontSize(ml.text, baseFontSize, 880, isHero ? 1.05 : 1.0);
        return (
          <div key={i} style={{
            position: 'relative',
            color: colorMap[ml.color] ?? theme.text,
            fontSize: dynFontSize,
            fontWeight: 900, opacity: prog,
            transform: isHero ? `scale(${interpolate(prog, [0, 1], [0.85, 1])})` : `translateY(${interpolate(prog, [0, 1], [16, 0])}px)`,
            lineHeight: 1.15, letterSpacing: isHero ? 4 : 0,
            whiteSpace: 'nowrap',
            paddingTop: isHero ? 8 : 0,
            paddingBottom: isHero ? 8 : 0,
          }}>
            {ml.text}
          </div>
        );
      })}
      {sc.tagline && (
        <div style={{position: 'relative', color: theme.textSub, fontSize: fontSize.body, fontWeight: 600, marginTop: 14, letterSpacing: 2, opacity: sp(frame, fps, 32, 200, 0.5)}}>
          {sc.tagline}
        </div>
      )}
    </div>
  );
};

// ============== OUTRO まとめ recap ==============
const SceneOutro: React.FC<{outro: Config['outro']; intro: Config['intro']}> = ({outro, intro}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const sc0 = sp(frame, fps, 0, 280, 0.4);
  const sc1 = sp(frame, fps, 25, 200, 0.45);
  const N = intro.items.length;
  const itemDelay = 18;
  const tagDelay = 50 + N * itemDelay;
  const tag = sp(frame, fps, tagDelay, 220, 0.5);
  return (
    <AbsoluteFill style={{background: theme.bg, fontFamily, padding: '0 30px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 14}}>
      <div style={{color: theme.text, fontSize: fontSize.heading, fontWeight: fontWeight.black, opacity: sc1, transform: `scale(${interpolate(sc1, [0, 1], [0.85, 1])})`, marginBottom: 6, letterSpacing: 2}}>
        {outro.title}
      </div>
      {intro.items.map((it, i) => {
        const sc = sp(frame, fps, 50 + i * itemDelay, 200, 0.45);
        return (
          <div key={it.tag} style={{
            display: 'flex', alignItems: 'center', gap: 18,
            opacity: sc, transform: `translateX(${interpolate(sc, [0, 1], [-60, 0])}px)`,
            background: theme.surface, padding: '12px 24px', borderRadius: radius.md,
            borderLeft: `6px solid ${colorMap[it.color] ?? theme.accent}`,
            width: 920,
          }}>
            <span style={{
              color: WHITE, background: colorMap[it.color] ?? theme.accent,
              fontFamily, fontWeight: 900, fontSize: fontSize.bodySm,
              padding: '6px 16px', borderRadius: radius.sm, letterSpacing: 1,
              flexShrink: 0, whiteSpace: 'nowrap',
            }}>
              {it.tag}
            </span>
            <span style={{color: theme.text, fontSize: fontSize.body, fontWeight: 900, flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{it.title}</span>
            <span style={{color: colorMap[it.color] ?? theme.accent, fontSize: fontSize.body, fontWeight: 900, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', flexShrink: 0}}>
              {it.key}
            </span>
          </div>
        );
      })}
      <div style={{
        background: theme.text, padding: '14px 40px', borderRadius: radius.pill,
        color: theme.bg, fontSize: fontSize.body, fontWeight: 900,
        opacity: tag, transform: `scale(${interpolate(tag, [0, 1], [0.85, 1])})`,
        marginTop: 12, letterSpacing: 2,
      }}>
        {outro.cta}
      </div>
    </AbsoluteFill>
  );
};

// ============== メインComposition ==============
interface ScriptLine {
  id: string;
  topic: string;
  speaker: string;
  start_sec: number;
  duration_sec: number;
  scene_idx?: number;
}
interface Script {
  duration_sec: number;
  lines: ScriptLine[];
}

export interface NewsFlexibleProps {
  config: Config;
  script: Script;
  hook_image_path?: string;
  hook_image_until_frame?: number;
}

// ============== フック画像オーバーレイ ==============
// src は public/ 配下の相対パス(build.py が staticFile 用にコピー済み)
const HookImage: React.FC<{src: string}> = ({src}) => {
  const resolvedSrc = staticFile(src);
  return (
    <AbsoluteFill style={{zIndex: 20}}>
      <Img
        src={resolvedSrc}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />
    </AbsoluteFill>
  );
};

export const NewsFlexible: React.FC<NewsFlexibleProps> = ({config, script, hook_image_path, hook_image_until_frame}) => {
  const frame = useCurrentFrame();
  const fps = 30;
  const totalFrames = Math.round(script.duration_sec * fps);

  const themeColor = (config as any).theme === 'alt' ? ALT : PRIMARY;
  const bgImagePath = (config as any).bg_image_static as string | undefined;
  const bgImageSrc = bgImagePath ? staticFile(bgImagePath) : undefined;

  // label_jp 可変対応
  const newsLabel = (config.intro as any).label_jp ?? '';
  const labels = {...DEFAULT_LABELS, ...((config as any).labels ?? {})};

  // 各 topic の start を script から計算。該当 line が無い topic は除外する。
  const topicIds = ['INTRO', ...config.topics.map((t) => t.id), 'OUTRO'];
  const sectionStart: Record<string, number> = {};
  for (const tId of topicIds) {
    const firstLine = script.lines.find((ln) => ln.topic === tId);
    if (firstLine) {
      sectionStart[tId] = Math.round(firstLine.start_sec * fps);
    }
  }
  // 実際に存在するセクションだけでフィルタ(line が無い topic / OUTRO は除外)
  const presentIds = topicIds.filter((tId) => tId in sectionStart);

  // 現在のセクション判定
  let cur: 'intro' | number | 'outro' = 'intro';
  let curStart = 0;
  let curEnd = totalFrames;
  for (let i = 0; i < presentIds.length; i++) {
    const tId = presentIds[i];
    const start = sectionStart[tId];
    // 次のセクション開始 frame。最後のセクションは totalFrames まで保持。
    const next = i + 1 < presentIds.length ? sectionStart[presentIds[i + 1]] : totalFrames;
    if (frame >= start && frame < next) {
      curStart = start;
      curEnd = next;
      if (tId === 'INTRO') cur = 'intro';
      else if (tId === 'OUTRO') cur = 'outro';
      else cur = config.topics.findIndex((t) => t.id === tId);
      break;
    }
  }

  // テロップ表示用 cat/segs
  // intro は「<日付>   <labels.intro_cat>」+ T1.hook_image の subject/metric(あれば)
  const t1HookCfg = (config.topics[0] as any)?.hook_image as
    {subject?: string; metric?: string} | undefined;
  const introSegs = t1HookCfg?.subject || t1HookCfg?.metric
    ? [
        {text: t1HookCfg.subject ?? '', color: 'black'},
        {text: t1HookCfg.metric ?? '', color: 'red'},
      ]
    : (newsLabel ? [{text: newsLabel, color: 'black'}, ...labels.intro_segs.slice(1)] : labels.intro_segs);
  const introTelop = {
    cat: config.intro.date_label + '   ' + labels.intro_cat,
    segs: introSegs,
  };
  const outroTelop = {cat: labels.outro_cat, segs: labels.outro_segs};
  const telopProps = cur === 'intro'
    ? introTelop
    : cur === 'outro'
      ? outroTelop
      : {cat: config.topics[cur as number].telop_cat, segs: config.topics[cur as number].telop_segs};

  const localFrame = frame - curStart;
  const telopProg = spring({frame: Math.max(0, localFrame), fps, config: {damping: 250, mass: 0.45}});
  const telopX = interpolate(telopProg, [0, 1], [-(W - BADGE_W), 0]);

  return (
    <ThemeColorContext.Provider value={themeColor}>
      <AbsoluteFill style={{backgroundColor: bgImageSrc ? 'transparent' : BLACK}}>
        {bgImageSrc && (
          <Img src={bgImageSrc} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover'}} />
        )}
        {!bgImageSrc && (
          <div style={{position: 'absolute', top: 0, left: 0, width: W, height: TELOP_TOP, background: '#050510'}} />
        )}
        {/* バッジ */}
        <NewsBadge label={labels.badge} />
        {/* テロップ右パネル(slide-in) */}
        <div style={{
          position: 'absolute', top: TELOP_TOP, left: BADGE_W,
          width: W - BADGE_W, height: TELOP_BOTTOM - TELOP_TOP,
          overflow: 'hidden',
        }}>
          <div style={{position: 'absolute', inset: 0, transform: `translateX(${telopX}px)`}}>
            <Telop cat={telopProps.cat} segs={telopProps.segs} />
          </div>
        </div>

        {/* フレーム */}
        <Wipe>
          {cur === 'intro' && <SceneIntro intro={config.intro} />}
          {typeof cur === 'number' && (
            <SceneByTemplate
              topic={{...config.topics[cur], scenes: config.topics[cur].scenes.map((sc) => ({...sc, date: sc.date ?? config.date}))}}
              topicStart={curStart}
              topicEnd={curEnd}
              topicLines={script.lines.filter((ln) => ln.topic === config.topics[cur as number].id)}
              fps={fps}
            />
          )}
          {hook_image_path && hook_image_until_frame != null && frame < hook_image_until_frame && (
            <HookImage src={hook_image_path} />
          )}
          {cur === 'outro' && <SceneOutro outro={config.outro} intro={config.intro} />}
        </Wipe>

        {!bgImageSrc && (
          <div style={{position: 'absolute', top: 1229, left: 0, width: W, height: 1920 - 1229, background: BLACK}} />
        )}
      </AbsoluteFill>
    </ThemeColorContext.Provider>
  );
};
