import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { CentralBlock, LineTiming } from "../types";
import { useTheme } from "../theme/ThemeContext";

// round 3.1 Phase β Step 1: KineticKeyword は useTheme() で token 参照済。
// 残り 16 component は hardcoded のまま(Phase β Step 2 で順次 token 化予定)。
// 暫定の theme 切替対応:
// const → let、 Root.tsx で design_template に応じて applyTheme() で書き換える。
// 完全 token 化 (135 箇所 useTheme refactor) は別 PR (workload 2-3 週間)。
export let ACCENT = "#6B7C85";
export let ACCENT_TEXT = "#A7B8C2";
export let FOREGROUND_LIGHT = "#F0F0F0";

export function applyTheme(name: string | undefined | null): void {
  if (name === "documentary_uplifting") {
    ACCENT = "#8A7F6B";        // sample
    ACCENT_TEXT = "#C9BFA8";   // sample
    FOREGROUND_LIGHT = "#E3F2EF";    // cool offwhite (ThemeContext の documentary_uplifting.foreground と同値)
  } else {
    ACCENT = "#6B7C85";
    ACCENT_TEXT = "#A7B8C2";
    FOREGROUND_LIGHT = "#F0F0F0";
  }
}

// =============================================================
// Router
// =============================================================

type RouterProps = {
  centralTrack?: CentralBlock[];
  lineTimings?: LineTiming[];
};

// type 別 auto-clear。
// short impact types は表示開始から MAX 秒で自動 fade-out (次 block 来ない場合でも)。
// long flow types は次 block まで継続 (現行どおり)。
const SHORT_BLOCK_MAX_SEC: Record<string, number> = {
  year_stamp: 5.0,
  kinetic_keyword: 5.0,
  word_dissolve: 5.5,
  heartbeat_pulse: 6.0,
  crowd_anonymous: 6.0,
  statistic_ticker: 7.0,
  overlay_words: 7.0,
  mirror_split: 8.0,
  particle_explosion: 3.0,
  spotlight_reveal: 4.0,
  number_counter: 5.0,
  era_transition: 8.0,
  text_highlight: 6.0,
};

export const CentralLayer: React.FC<RouterProps> = ({ centralTrack, lineTimings }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  if (!centralTrack || centralTrack.length === 0 || !lineTimings || lineTimings.length === 0) {
    return null;
  }

  const segments = centralTrack.map((b, i) => {
    const safeFrom = Math.min(b.from_line_idx, lineTimings.length - 1);
    const startSec = lineTimings[safeFrom].start_sec;
    const startFrame = Math.round(startSec * fps);
    const next = centralTrack[i + 1];
    const nextStartSec = next
      ? lineTimings[Math.min(next.from_line_idx, lineTimings.length - 1)].start_sec
      : durationInFrames / fps;
    // 短い impact 系は最大持続秒で打ち切る (次 block まで遠くてもダラ表示しない)
    const maxSec = SHORT_BLOCK_MAX_SEC[b.type];
    const endSec = maxSec ? Math.min(nextStartSec, startSec + maxSec) : nextStartSec;
    const endFrame = Math.round(endSec * fps);
    return { ...b, startFrame, endFrame };
  });

  const active = segments.find((s) => frame >= s.startFrame && frame < s.endFrame);
  if (!active) return null;

  const localFrame = frame - active.startFrame;
  const totalDur = active.endFrame - active.startFrame;
  const fadeIn = interpolate(localFrame, [0, 12], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(
    localFrame,
    [Math.max(0, totalDur - 14), totalDur],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const opacity = Math.min(fadeIn, fadeOut);

  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity }}>
      {renderByType(active, localFrame, totalDur, fps)}
    </AbsoluteFill>
  );
};

const renderByType = (
  b: CentralBlock,
  localFrame: number,
  totalDur: number,
  fps: number
) => {
  switch (b.type) {
    case "kinetic_keyword":
      return <KineticKeyword text={b.text || ""} subtitle={b.subtitle} localFrame={localFrame} fps={fps} />;
    case "number_counter":
      return (
        <NumberCounter
          from={b.number_from ?? 0}
          to={b.number_to ?? 100}
          unit={b.unit}
          label={b.label}
          emphasize={b.emphasize}
          prefix={b.prefix}
          localFrame={localFrame}
          fps={fps}
        />
      );
    case "phone_mockup":
      return (
        <PhoneMockup
          content={b.phone_content || "sns_feed"}
          timerLabel={b.timer_label}
          localFrame={localFrame}
          totalDur={totalDur}
          fps={fps}
        />
      );
    case "mock_sns_feed":
      return <MockSNSFeed localFrame={localFrame} fps={fps} posts={b.posts ?? 6} />;
    case "notification_cascade":
      return <NotificationCascade count={b.notification_count ?? 6} localFrame={localFrame} fps={fps} />;
    case "clock_timer":
      return (
        <ClockTimer
          hours={b.clock_hours}
          minutes={b.clock_minutes}
          label={b.clock_label}
          localFrame={localFrame}
          totalDur={totalDur}
          fps={fps}
        />
      );
    case "chart_bar":
      return (
        <ChartBar
          data={b.chart_data || []}
          direction={b.chart_direction || "down"}
          max={b.chart_max}
          localFrame={localFrame}
          fps={fps}
        />
      );
    case "comparison_split":
      return (
        <ComparisonSplit
          leftLabel={b.left_label || ""}
          leftValue={b.left_value || ""}
          rightLabel={b.right_label || ""}
          rightValue={b.right_value || ""}
          rightEmphasize={b.right_emphasize}
          localFrame={localFrame}
          fps={fps}
        />
      );
    case "silhouette_group":
      return (
        <SilhouetteGroup
          variant={b.silhouette_variant || "row"}
          localFrame={localFrame}
          fps={fps}
        />
      );
    case "brain_network":
      return <BrainNetwork localFrame={localFrame} fps={fps} />;
    case "calendar_grid":
      return (
        <CalendarGrid
          markedDays={b.marked_days || []}
          label={b.calendar_label}
          localFrame={localFrame}
          fps={fps}
        />
      );
    case "spotlight_reveal":
      return (
        <SpotlightReveal
          text={b.reveal_text || ""}
          subtext={b.reveal_subtext}
          localFrame={localFrame}
          totalDur={totalDur}
          fps={fps}
        />
      );
    case "text_highlight":
      return (
        <TextHighlight
          words={b.highlight_words || []}
          localFrame={localFrame}
          totalDur={totalDur}
          fps={fps}
        />
      );
    case "particle_explosion":
      return (
        <ParticleExplosion
          color={b.explosion_color || "accent"}
          label={b.explosion_label}
          localFrame={localFrame}
          fps={fps}
        />
      );
    case "pulsing_figure":
      return (
        <PulsingFigure
          subject={b.figure_subject || "female"}
          glow={b.figure_glow !== false}
          orbits={b.figure_orbits}
          localFrame={localFrame}
          totalDur={totalDur}
          fps={fps}
        />
      );
    case "image_callout":
      return (
        <ImageCallout
          image={b.callout_image || ""}
          caption={b.callout_caption}
          kenBurns={b.callout_kenburns !== false}
          localFrame={localFrame}
          totalDur={totalDur}
          fps={fps}
        />
      );
    // round 3.2: 追加の演出 type 8 種
    case "year_stamp":
      return (
        <YearStamp
          year={b.year_text || ""}
          subtext={b.year_subtext}
          localFrame={localFrame}
          fps={fps}
        />
      );
    case "quote_frame":
      return (
        <QuoteFrame
          quote={b.quote_text || ""}
          attribution={b.quote_attribution}
          localFrame={localFrame}
          fps={fps}
        />
      );
    case "statistic_ticker":
      return (
        <StatisticTicker
          items={b.ticker_items || []}
          localFrame={localFrame}
          fps={fps}
        />
      );
    case "word_dissolve":
      return (
        <WordDissolve
          word={b.dissolve_word || ""}
          subtitle={b.dissolve_subtitle}
          localFrame={localFrame}
          totalDur={totalDur}
          fps={fps}
        />
      );
    case "timeline_progression":
      return (
        <TimelineProgression
          points={b.timeline_points || []}
          currentIndex={b.current_index ?? 0}
          localFrame={localFrame}
          fps={fps}
        />
      );
    case "photo_montage":
      return (
        <PhotoMontage
          images={b.montage_images || []}
          speed={b.montage_speed ?? 1.5}
          localFrame={localFrame}
          fps={fps}
        />
      );
    case "document_zoom":
      return (
        <DocumentZoom
          image={b.document_image || ""}
          highlightBbox={b.document_highlight_bbox}
          caption={b.document_caption}
          localFrame={localFrame}
          totalDur={totalDur}
          fps={fps}
        />
      );
    case "brain_heatmap":
      return (
        <BrainHeatmap
          intensityCurve={b.heatmap_intensity_curve || [1, 0.7, 0.4, 0.1]}
          localFrame={localFrame}
          totalDur={totalDur}
          fps={fps}
        />
      );
    // round 3.3: Tier 1+2+3 = 10 新規 type
    case "mirror_split":
      return (
        <MirrorSplit
          leftImage={b.mirror_left_image || ""}
          rightImage={b.mirror_right_image || ""}
          leftLabel={b.mirror_left_label}
          rightLabel={b.mirror_right_label}
          localFrame={localFrame}
          totalDur={totalDur}
          fps={fps}
        />
      );
    case "day_clock":
      return (
        <DayClock
          activeHours={b.day_clock_active_hours || []}
          label={b.day_clock_label}
          subtitle={b.day_clock_subtitle}
          localFrame={localFrame}
          fps={fps}
        />
      );
    case "fading_contacts":
      return (
        <FadingContacts
          names={b.contacts_names || []}
          label={b.contacts_label}
          localFrame={localFrame}
          totalDur={totalDur}
          fps={fps}
        />
      );
    case "crowd_anonymous":
      return (
        <CrowdAnonymous
          count={b.crowd_count ?? 12}
          label={b.crowd_label}
          localFrame={localFrame}
          fps={fps}
        />
      );
    case "overlay_words":
      return (
        <OverlayWords
          words={b.overlay_words || []}
          circleLabel={b.overlay_circle_label}
          localFrame={localFrame}
          fps={fps}
        />
      );
    case "text_typewriter":
      return (
        <TextTypewriter
          text={b.typewriter_text || ""}
          attribution={b.typewriter_attribution}
          speed={b.typewriter_speed ?? 8}
          localFrame={localFrame}
          fps={fps}
        />
      );
    case "era_transition":
      return (
        <EraTransition
          years={b.era_years || []}
          currentIndex={b.era_current_index ?? 0}
          localFrame={localFrame}
          fps={fps}
        />
      );
    case "zoom_into_eye":
      return (
        <ZoomIntoEye
          image={b.eye_image || ""}
          zoomTarget={b.eye_zoom_target}
          localFrame={localFrame}
          totalDur={totalDur}
          fps={fps}
        />
      );
    case "receipt_scroll":
      return (
        <ReceiptScroll
          lines={b.receipt_lines || []}
          title={b.receipt_title}
          total={b.receipt_total}
          localFrame={localFrame}
          fps={fps}
        />
      );
    case "heartbeat_pulse":
      return (
        <HeartbeatPulse
          bpmCurve={b.heartbeat_bpm_curve || [60, 80, 100, 80, 60]}
          label={b.heartbeat_label}
          localFrame={localFrame}
          totalDur={totalDur}
          fps={fps}
        />
      );
    default:
      return null;
  }
};

// =============================================================
// 12 Sub-components
// =============================================================

// 1. KineticKeyword (round 3.1 Phase β Step 1: theme token 化)
const KineticKeyword: React.FC<{
  text: string;
  subtitle?: string;
  localFrame: number;
  fps: number;
}> = ({ text, subtitle, localFrame, fps }) => {
  const theme = useTheme();
  const enter = spring({
    frame: localFrame,
    fps,
    config: { damping: 200, stiffness: 60 },
    durationInFrames: Math.round(fps * 1.3),
  });
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const scale = interpolate(enter, [0, 1], [0.88, 1]);

  // Estimate visual width: full-width chars ~ 1.0 unit, half-width ~ 0.55.
  // theme.kinetic_max_widthunits は QA gate A3 で widthUnits ≤ N の上限 check に使う(本 component は描画のみ)
  const widthUnits = Array.from(text).reduce(
    (acc, ch) => acc + (/[　-鿿＀-￯]/.test(ch) ? 1.0 : 0.55),
    0
  );
  const dynamicFontSize = Math.max(56, Math.min(130, Math.floor(1700 / Math.max(1, widthUnits))));
  const trackingShift = interpolate(enter, [0, 1], [4, dynamicFontSize > 100 ? 12 : 6]);

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          padding: "30px 50px",
          background: "rgba(8,8,8,0.55)",
          backdropFilter: "blur(2px)",
          borderLeft: `5px solid ${theme.color.primary}`,
          opacity,
          transform: `scale(${scale})`,
          maxWidth: 1820,
        }}
      >
        <div
          style={{
            fontFamily: `'${theme.font_family_primary}', serif`,
            fontSize: dynamicFontSize,
            fontWeight: theme.font.kinetic_serif_weight,
            color: theme.color.foreground,
            letterSpacing: trackingShift,
            lineHeight: 1.05,
            textShadow: "0 4px 24px rgba(0,0,0,0.85)",
            textAlign: "center",
            whiteSpace: "nowrap",
          }}
        >
          {text}
        </div>
        {subtitle ? (
          <div
            style={{
              marginTop: 20,
              fontFamily: `'${theme.font_family_secondary}', sans-serif`,
              fontSize: 30,
              letterSpacing: 8,
              color: theme.color.subtle_grey,
              textAlign: "center",
              whiteSpace: "nowrap",
            }}
          >
            {subtitle}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

// 2. NumberCounter
const NumberCounter: React.FC<{
  from: number;
  to: number;
  unit?: string;
  label?: string;
  emphasize?: boolean;
  prefix?: string;
  localFrame: number;
  fps: number;
}> = ({ from, to, unit, label, emphasize, prefix, localFrame, fps }) => {
  const enter = spring({
    frame: localFrame,
    fps,
    config: { damping: 200, stiffness: 60 },
    durationInFrames: Math.round(fps * 1.5),
  });
  const t = interpolate(enter, [0, 1], [0, 1]);
  const value = interpolate(t, [0, 1], [from, to]);
  const accent = emphasize ? ACCENT_TEXT : FOREGROUND_LIGHT;
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const scale = interpolate(enter, [0, 1], [0.92, 1]);
  const display =
    Number.isInteger(from) && Number.isInteger(to) ? Math.round(value).toString() : value.toFixed(1);

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          padding: "44px 64px",
          background: "rgba(8,8,8,0.65)",
          backdropFilter: "blur(2px)",
          borderLeft: `5px solid ${ACCENT}`,
          opacity,
          transform: `scale(${scale})`,
          textAlign: "center",
          minWidth: 540,
        }}
      >
        {label ? (
          <div
            style={{
              fontFamily: "'Noto Sans CJK JP', sans-serif",
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: 12,
              color: emphasize ? ACCENT_TEXT : "#a0a0a0",
              marginBottom: 18,
            }}
          >
            {label}
          </div>
        ) : null}
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 10 }}>
          {prefix ? (
            <span style={{ fontSize: 56, color: accent, fontFamily: "'Noto Serif CJK JP', serif" }}>
              {prefix}
            </span>
          ) : null}
          <span
            style={{
              fontFamily: "'Noto Serif CJK JP', serif",
              fontSize: 200,
              fontWeight: 800,
              color: accent,
              lineHeight: 0.95,
            }}
          >
            {display}
          </span>
          {unit ? (
            <span
              style={{
                fontFamily: "'Noto Sans CJK JP', sans-serif",
                fontSize: 50,
                fontWeight: 700,
                color: emphasize ? "#b0cfe8" : "#bdbdbd",
                letterSpacing: 4,
              }}
            >
              {unit}
            </span>
          ) : null}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// (3. IconArray removed — 廃止)

// 4. PhoneMockup
const PhoneMockup: React.FC<{
  content: "sns_feed" | "notifications" | "blank";
  timerLabel?: string;
  localFrame: number;
  totalDur: number;
  fps: number;
}> = ({ content, timerLabel, localFrame, totalDur, fps }) => {
  const enter = spring({
    frame: localFrame,
    fps,
    config: { damping: 200, stiffness: 60 },
    durationInFrames: Math.round(fps * 1.0),
  });
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const scale = interpolate(enter, [0, 1], [0.92, 1]);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 60, opacity, transform: `scale(${scale})` }}>
        <PhoneFrame>
          {content === "sns_feed" ? (
            <MockSNSFeed localFrame={localFrame} fps={fps} posts={6} />
          ) : content === "notifications" ? (
            <NotificationCascade count={6} localFrame={localFrame} fps={fps} />
          ) : null}
        </PhoneFrame>
        {timerLabel ? (
          <div
            style={{
              fontFamily: "'Noto Serif CJK JP', serif",
              fontSize: 90,
              fontWeight: 700,
              color: ACCENT_TEXT,
              letterSpacing: 4,
              padding: "20px 30px",
              background: "rgba(8,8,8,0.6)",
              border: `1px solid ${ACCENT}`,
            }}
          >
            {timerLabel}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

const PhoneFrame: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div
      style={{
        width: 380,
        height: 720,
        borderRadius: 56,
        background: "#121212",
        border: "8px solid #2a2a2a",
        boxShadow: "0 0 48px rgba(0,0,0,0.7)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Notch */}
      <div
        style={{
          position: "absolute",
          top: 16,
          left: "50%",
          transform: "translateX(-50%)",
          width: 110,
          height: 28,
          borderRadius: 14,
          background: "#000",
          zIndex: 10,
        }}
      />
      {/* Screen */}
      <div
        style={{
          position: "absolute",
          top: 14,
          left: 14,
          right: 14,
          bottom: 14,
          borderRadius: 44,
          background: "#0d0d12",
          overflow: "hidden",
        }}
      >
        {children}
      </div>
    </div>
  );
};

// 5. MockSNSFeed
const MockSNSFeed: React.FC<{ localFrame: number; fps: number; posts?: number }> = ({
  localFrame,
  fps,
  posts = 6,
}) => {
  const scrollPx = (localFrame / fps) * 80;
  const enter = spring({
    frame: localFrame,
    fps,
    config: { damping: 200, stiffness: 70 },
    durationInFrames: Math.round(fps * 0.8),
  });
  const op = interpolate(enter, [0, 1], [0, 1]);
  const sc = interpolate(enter, [0, 1], [0.94, 1]);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <AbsoluteFill style={{ background: "rgba(0,0,0,0.55)", opacity: op }} />
      <div
        style={{
          opacity: op,
          transform: `scale(${sc})`,
          background: "rgba(8,8,8,0.92)",
          padding: 18,
          border: `3px solid ${ACCENT}`,
          borderRadius: 18,
          boxShadow: "0 0 80px rgba(0,0,0,0.9), 0 0 24px rgba(31, 95, 139,0.5)",
          width: 460,
          height: 720,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div
          style={{
            transform: `translateY(${-scrollPx}px)`,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {Array.from({ length: posts + 4 }).map((_, i) => (
            <SnsPostCard key={i} index={i} />
          ))}
        </div>
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 36,
            background: "linear-gradient(180deg, rgba(8,8,8,1) 0%, rgba(8,8,8,0) 100%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 36,
            background: "linear-gradient(0deg, rgba(8,8,8,1) 0%, rgba(8,8,8,0) 100%)",
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

const SnsPostCard: React.FC<{ index: number }> = ({ index }) => {
  const tones = [
    "linear-gradient(135deg, #30404a 0%, #10151a 100%)",
    "linear-gradient(135deg, #2a3a4a 0%, #101820 100%)",
    "linear-gradient(135deg, #25353a 0%, #10181a 100%)",
    "linear-gradient(135deg, #304050 0%, #101820 100%)",
  ];
  return (
    <div style={{ background: "#15151a", borderRadius: 8, padding: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <div style={{ width: 24, height: 24, borderRadius: 12, background: "#2a2a30" }} />
        <div style={{ width: 80, height: 8, borderRadius: 4, background: "#2a2a30" }} />
      </div>
      <div
        style={{
          width: "100%",
          height: 130,
          borderRadius: 6,
          background: tones[index % tones.length],
          marginBottom: 8,
        }}
      />
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
        <span style={{ color: ACCENT_TEXT, fontSize: 12 }}>♥</span>
        <div style={{ width: 30, height: 6, background: "#2a2a30", borderRadius: 3 }} />
      </div>
      <div style={{ width: "85%", height: 6, background: "#1f1f25", borderRadius: 3, marginBottom: 4 }} />
      <div style={{ width: "65%", height: 6, background: "#1f1f25", borderRadius: 3 }} />
    </div>
  );
};

// 6. NotificationCascade
const NotificationCascade: React.FC<{ count: number; localFrame: number; fps: number }> = ({
  count,
  localFrame,
  fps,
}) => {
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "relative", width: 600, height: 400 }}>
        {Array.from({ length: count }).map((_, i) => {
          const baseDelay = Math.round(fps * 0.6);
          const itemFrame = localFrame - i * baseDelay;
          const enter = spring({
            frame: itemFrame,
            fps,
            config: { damping: 200, stiffness: 80 },
            durationInFrames: Math.round(fps * 0.4),
          });
          const exit = interpolate(itemFrame, [fps * 1.5, fps * 2.0], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const opacity = enter * exit;
          if (opacity <= 0.001) return null;
          const x = (i % 3) * 180 - 180;
          const y = (Math.floor(i / 3) % 2) * 120 - 60;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                opacity,
                background: "rgba(8,8,8,0.85)",
                border: `1px solid ${ACCENT}`,
                borderRadius: 12,
                padding: "12px 20px",
                display: "flex",
                alignItems: "center",
                gap: 10,
                color: FOREGROUND_LIGHT,
                fontFamily: "'Noto Sans CJK JP', sans-serif",
                fontSize: 22,
                fontWeight: 700,
              }}
            >
              <span style={{ fontSize: 28, color: ACCENT_TEXT }}>♥</span>
              <span>+1</span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// 7. ClockTimer
const ClockTimer: React.FC<{
  hours?: number;
  minutes?: number;
  label?: string;
  localFrame: number;
  totalDur: number;
  fps: number;
}> = ({ hours, minutes, label, localFrame, totalDur, fps }) => {
  const t = interpolate(localFrame, [0, totalDur], [0, 1], { extrapolateRight: "clamp" });
  // If hours+minutes specified, show them; otherwise sweep
  const targetH = hours ?? 1;
  const targetM = minutes ?? 0;
  const animH = Math.round(t * targetH * 60 + targetM * t);
  const displayH = String(Math.floor(animH / 60)).padStart(2, "0");
  const displayM = String(animH % 60).padStart(2, "0");
  const displayS = String(Math.floor((localFrame % fps) * 60 / fps)).padStart(2, "0");

  // Analog hand angle (minutes hand rotates)
  const handAngle = (animH / 60) * 360;

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 60 }}>
        {/* Analog clock */}
        <div
          style={{
            width: 280,
            height: 280,
            borderRadius: "50%",
            border: `4px solid ${ACCENT}`,
            background: "rgba(8,8,8,0.75)",
            position: "relative",
          }}
        >
          {/* Tick marks */}
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                width: 3,
                height: 20,
                background: "#7a7a7a",
                transformOrigin: "50% 120px",
                transform: `translate(-50%, -120px) rotate(${i * 30}deg)`,
              }}
            />
          ))}
          {/* Hand */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: 4,
              height: 100,
              background: ACCENT_TEXT,
              transformOrigin: "50% 100%",
              transform: `translate(-50%, -100%) rotate(${handAngle}deg)`,
              transition: "transform 0.05s linear",
            }}
          />
          {/* Center dot */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: 16,
              height: 16,
              background: ACCENT,
              borderRadius: 8,
              transform: "translate(-50%, -50%)",
            }}
          />
        </div>
        {/* Digital readout */}
        <div
          style={{
            fontFamily: "'Noto Serif CJK JP', serif",
            fontSize: 100,
            fontWeight: 700,
            color: FOREGROUND_LIGHT,
            letterSpacing: 6,
            background: "rgba(8,8,8,0.65)",
            padding: "20px 40px",
            border: `1px solid ${ACCENT}`,
          }}
        >
          {displayH}:{displayM}
          <span style={{ fontSize: 50, color: "#7a7a7a", marginLeft: 8 }}>:{displayS}</span>
          {label ? (
            <div
              style={{
                fontFamily: "'Noto Sans CJK JP', sans-serif",
                fontSize: 22,
                color: ACCENT_TEXT,
                marginTop: 12,
                letterSpacing: 8,
                textAlign: "center",
              }}
            >
              {label}
            </div>
          ) : null}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// 8. ChartBar
const ChartBar: React.FC<{
  data: { label: string; value: number; emphasize?: boolean }[];
  direction: "up" | "down";
  max?: number;
  localFrame: number;
  fps: number;
}> = ({ data, direction, max, localFrame, fps }) => {
  const enter = spring({
    frame: localFrame,
    fps,
    config: { damping: 200, stiffness: 60 },
    durationInFrames: Math.round(fps * 1.4),
  });
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const maxValue = max ?? (Math.max(...data.map((d) => d.value)) || 100);
  const W = 800;
  const H = 360;
  const padding = 40;
  const barWidth = (W - padding * 2) / data.length - 16;

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          width: W,
          height: H,
          background: "rgba(8,8,8,0.65)",
          border: `1px solid #5a5a5a`,
          borderLeft: `4px solid ${ACCENT}`,
          padding,
          opacity,
          position: "relative",
        }}
      >
        {/* Y axis */}
        <div
          style={{
            position: "absolute",
            left: padding,
            top: padding,
            bottom: padding,
            width: 2,
            background: "#5a5a5a",
          }}
        />
        {/* X axis */}
        <div
          style={{
            position: "absolute",
            left: padding,
            right: padding,
            bottom: padding,
            height: 2,
            background: "#5a5a5a",
          }}
        />
        {/* Bars */}
        <div
          style={{
            position: "absolute",
            left: padding + 20,
            right: padding,
            top: padding,
            bottom: padding,
            display: "flex",
            alignItems: "flex-end",
            gap: 16,
          }}
        >
          {data.map((d, i) => {
            const itemDelay = Math.round(fps * 0.15) * i;
            const itemEnter = spring({
              frame: localFrame - itemDelay,
              fps,
              config: { damping: 200, stiffness: 80 },
              durationInFrames: Math.round(fps * 0.9),
            });
            const heightPct = interpolate(itemEnter, [0, 1], [0, d.value / maxValue]);
            return (
              <div
                key={i}
                style={{
                  width: barWidth,
                  height: `${heightPct * 100}%`,
                  background: d.emphasize ? ACCENT_TEXT : "#666",
                  borderTop: d.emphasize ? `2px solid ${ACCENT}` : "none",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-end",
                }}
              >
                <div
                  style={{
                    fontFamily: "'Noto Sans CJK JP', sans-serif",
                    fontSize: 16,
                    fontWeight: 700,
                    color: d.emphasize ? FOREGROUND_LIGHT : "#a0a0a0",
                    textAlign: "center",
                    padding: "4px 0",
                  }}
                >
                  {d.value}
                </div>
              </div>
            );
          })}
        </div>
        {/* Labels */}
        <div
          style={{
            position: "absolute",
            left: padding + 20,
            right: padding,
            bottom: 8,
            display: "flex",
            gap: 16,
          }}
        >
          {data.map((d, i) => (
            <div
              key={i}
              style={{
                width: barWidth,
                fontFamily: "'Noto Sans CJK JP', sans-serif",
                fontSize: 14,
                color: "#a0a0a0",
                textAlign: "center",
                letterSpacing: 1,
              }}
            >
              {d.label}
            </div>
          ))}
        </div>
        {/* Title direction marker */}
        <div
          style={{
            position: "absolute",
            top: 14,
            right: 20,
            fontSize: 38,
            color: direction === "down" ? ACCENT_TEXT : FOREGROUND_LIGHT,
          }}
        >
          {direction === "down" ? "↓" : "↑"}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// 9. ComparisonSplit
const ComparisonSplit: React.FC<{
  leftLabel: string;
  leftValue: string;
  rightLabel: string;
  rightValue: string;
  rightEmphasize?: boolean;
  localFrame: number;
  fps: number;
}> = ({ leftLabel, leftValue, rightLabel, rightValue, rightEmphasize, localFrame, fps }) => {
  const enterL = spring({
    frame: localFrame,
    fps,
    config: { damping: 200, stiffness: 80 },
    durationInFrames: Math.round(fps * 0.9),
  });
  const enterR = spring({
    frame: localFrame - Math.round(fps * 0.4),
    fps,
    config: { damping: 200, stiffness: 80 },
    durationInFrames: Math.round(fps * 0.9),
  });
  const enterVS = spring({
    frame: localFrame - Math.round(fps * 0.7),
    fps,
    config: { damping: 200, stiffness: 80 },
    durationInFrames: Math.round(fps * 0.6),
  });

  const leftOp = interpolate(enterL, [0, 1], [0, 1]);
  const rightOp = interpolate(enterR, [0, 1], [0, 1]);
  const vsOp = interpolate(enterVS, [0, 1], [0, 1]);
  const leftTx = interpolate(enterL, [0, 1], [-60, 0]);
  const rightTx = interpolate(enterR, [0, 1], [60, 0]);

  const cardStyle = (emphasize: boolean): React.CSSProperties => ({
    width: 380,
    padding: "40px 28px",
    background: "rgba(8,8,8,0.7)",
    border: `1px solid ${emphasize ? ACCENT : "#5a5a5a"}`,
    borderTop: `4px solid ${emphasize ? ACCENT : "#7a7a7a"}`,
    textAlign: "center",
  });

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 30 }}>
        {/* Left */}
        <div style={{ ...cardStyle(false), opacity: leftOp, transform: `translateX(${leftTx}px)` }}>
          <div
            style={{
              fontFamily: "'Noto Sans CJK JP', sans-serif",
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: 8,
              color: "#a0a0a0",
              marginBottom: 18,
            }}
          >
            {leftLabel}
          </div>
          <div
            style={{
              fontFamily: "'Noto Serif CJK JP', serif",
              fontSize: 90,
              fontWeight: 800,
              color: FOREGROUND_LIGHT,
              letterSpacing: 2,
            }}
          >
            {leftValue}
          </div>
        </div>
        {/* VS */}
        <div
          style={{
            opacity: vsOp,
            fontFamily: "'Noto Serif CJK JP', serif",
            fontSize: 70,
            fontWeight: 800,
            color: ACCENT_TEXT,
          }}
        >
          vs
        </div>
        {/* Right */}
        <div style={{ ...cardStyle(!!rightEmphasize), opacity: rightOp, transform: `translateX(${rightTx}px)` }}>
          <div
            style={{
              fontFamily: "'Noto Sans CJK JP', sans-serif",
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: 8,
              color: rightEmphasize ? ACCENT_TEXT : "#a0a0a0",
              marginBottom: 18,
            }}
          >
            {rightLabel}
          </div>
          <div
            style={{
              fontFamily: "'Noto Serif CJK JP', serif",
              fontSize: 90,
              fontWeight: 800,
              color: rightEmphasize ? ACCENT_TEXT : FOREGROUND_LIGHT,
              letterSpacing: 2,
            }}
          >
            {rightValue}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// 10. SilhouetteGroup — figures with breathing pulse on hero
const SilhouetteGroup: React.FC<{
  variant: "downward" | "upward" | "left_behind" | "tribe" | "row" | "comparison";
  localFrame: number;
  fps: number;
}> = ({ variant, localFrame, fps }) => {
  const enter = spring({
    frame: localFrame,
    fps,
    config: { damping: 200, stiffness: 60 },
    durationInFrames: Math.round(fps * 1.0),
  });
  const opacity = interpolate(enter, [0, 1], [0, 1]);

  // Breathing pulse for hero figures (1.3 cycle per second)
  const pulseT = (localFrame / fps) * 1.3 * Math.PI;
  const heroPulseScale = 1 + Math.sin(pulseT) * 0.07;
  const heroGlow = 0.7 + Math.sin(pulseT) * 0.3;

  // Radial pulse rings around hero (2.5s period, 2 rings staggered)
  const RING_PERIOD = Math.round(fps * 2.5);
  const HeroRing: React.FC<{ x: number; y: number; offset: number }> = ({ x, y, offset }) => {
    const ringFrame = (localFrame + offset) % RING_PERIOD;
    const ringScale = interpolate(ringFrame, [0, RING_PERIOD], [0.6, 3]);
    const ringOp = interpolate(ringFrame, [0, RING_PERIOD * 0.2, RING_PERIOD], [0.6, 0.4, 0]);
    return (
      <div
        style={{
          position: "absolute",
          left: `calc(50% + ${x}px)`,
          top: `calc(50% + ${y}px)`,
          width: 150,
          height: 150,
          borderRadius: "50%",
          border: `2px solid ${ACCENT}`,
          transform: `translate(-50%, -50%) scale(${ringScale})`,
          opacity: ringOp,
          pointerEvents: "none",
        }}
      />
    );
  };

  const Person: React.FC<{
    x: number;
    y: number;
    color?: string;
    h?: number;
    glow?: boolean;
    fade?: number;
    hero?: boolean;
  }> = ({ x, y, color = "#5a5a5a", h = 200, glow, fade = 1, hero }) => {
    const scale = hero ? heroPulseScale : 1;
    const baseOp = hero ? heroGlow : 1;
    return (
      <svg
        width={80}
        height={h}
        viewBox="0 0 60 120"
        style={{
          position: "absolute",
          left: `calc(50% + ${x}px)`,
          top: `calc(50% + ${y}px)`,
          transform: `translate(-50%, -50%) scale(${scale})`,
          opacity: fade * baseOp,
          filter: glow ? `drop-shadow(0 0 14px ${ACCENT}) drop-shadow(0 0 6px ${ACCENT})` : "none",
        }}
      >
        <circle cx="30" cy="20" r="15" fill={color} />
        <path
          d="M 12 50 Q 30 35 48 50 L 48 95 Q 48 105 42 110 L 18 110 Q 12 105 12 95 Z"
          fill={color}
        />
      </svg>
    );
  };

  const renderVariant = () => {
    switch (variant) {
      case "downward":
        return (
          <>
            <HeroRing x={-100} y={-30} offset={0} />
            <Person x={-100} y={-30} color={FOREGROUND_LIGHT} h={230} glow hero />
            <Person x={100} y={50} color="#3a3a3a" h={150} />
            <div style={{ position: "absolute", left: "50%", top: "50%", fontSize: 80, color: ACCENT, transform: "translate(-50%, -50%)", fontWeight: 700 }}>↘</div>
          </>
        );
      case "upward":
        return (
          <>
            <HeroRing x={100} y={-30} offset={0} />
            <HeroRing x={100} y={-30} offset={Math.round(RING_PERIOD / 2)} />
            <Person x={-100} y={50} color="#5a5a5a" h={170} />
            <Person x={100} y={-30} color={ACCENT_TEXT} h={230} glow hero />
            <div style={{ position: "absolute", left: "50%", top: "50%", fontSize: 80, color: ACCENT, transform: "translate(-50%, -50%)", fontWeight: 700 }}>↗</div>
          </>
        );
      case "left_behind":
        return (
          <>
            <HeroRing x={-200} y={0} offset={0} />
            <Person x={-200} y={0} color={ACCENT_TEXT} h={180} fade={0.7} glow hero />
            <Person x={-50} y={0} color="#5a5a5a" h={200} />
            <Person x={100} y={0} color="#7a7a7a" h={200} />
            <Person x={250} y={0} color="#a0a0a0" h={200} />
          </>
        );
      case "tribe":
        return (
          <>
            {/* Fire glow at center (with pulsing) */}
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: 150,
                height: 150,
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(70, 170, 230,0.7) 0%, rgba(30, 110, 200,0.2) 60%, transparent 100%)",
                transform: `translate(-50%, -50%) scale(${heroPulseScale})`,
                filter: "blur(8px)",
                opacity: heroGlow,
              }}
            />
            {[-180, -90, 0, 90, 180].map((x, i) => (
              <Person key={i} x={x} y={i % 2 === 0 ? 60 : 80} color="#3a3a3a" h={150} />
            ))}
          </>
        );
      case "comparison":
        return (
          <>
            <HeroRing x={150} y={0} offset={0} />
            <Person x={-150} y={0} color="#7a7a7a" h={200} />
            <Person x={150} y={0} color={ACCENT_TEXT} h={210} glow hero />
          </>
        );
      case "row":
      default:
        return (
          <>
            <HeroRing x={-60} y={0} offset={0} />
            {[-180, -60, 60, 180].map((x, i) => (
              <Person key={i} x={x} y={0} color={i === 1 ? ACCENT_TEXT : "#5a5a5a"} h={200} glow={i === 1} hero={i === 1} />
            ))}
          </>
        );
    }
  };

  return (
    <AbsoluteFill style={{ opacity }}>
      <div style={{ position: "absolute", width: "100%", height: "100%" }}>{renderVariant()}</div>
    </AbsoluteFill>
  );
};

// 11. BrainNetwork
const BrainNetwork: React.FC<{ localFrame: number; fps: number }> = ({ localFrame, fps }) => {
  const enter = spring({
    frame: localFrame,
    fps,
    config: { damping: 200, stiffness: 60 },
    durationInFrames: Math.round(fps * 1.2),
  });
  const opacity = interpolate(enter, [0, 1], [0, 1]);

  const nodes = [
    { x: 200, y: 100 },
    { x: 350, y: 60 },
    { x: 500, y: 130 },
    { x: 650, y: 80 },
    { x: 280, y: 200 },
    { x: 430, y: 230 },
    { x: 580, y: 220 },
    { x: 720, y: 180 },
    { x: 360, y: 320 },
    { x: 510, y: 340 },
    { x: 670, y: 310 },
    { x: 280, y: 380 },
  ];
  const edges: [number, number][] = [
    [0, 1], [1, 2], [2, 3], [0, 4], [1, 5], [2, 5], [3, 6], [4, 5], [5, 6], [6, 7], [4, 8], [5, 9], [6, 10], [8, 9], [9, 10], [8, 11],
  ];

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity }}>
      <svg width={900} height={460} viewBox="0 0 900 460">
        {/* Edges */}
        {edges.map(([a, b], i) => {
          const pulseFrame = (localFrame + i * 8) % Math.round(fps * 2);
          const pulseOp = interpolate(pulseFrame, [0, fps * 0.2, fps * 0.6, fps * 2], [0.2, 1, 0.3, 0.2]);
          return (
            <line
              key={i}
              x1={nodes[a].x}
              y1={nodes[a].y}
              x2={nodes[b].x}
              y2={nodes[b].y}
              stroke={ACCENT}
              strokeWidth={1.5}
              opacity={pulseOp}
            />
          );
        })}
        {/* Nodes */}
        {nodes.map((n, i) => {
          const pulseFrame = (localFrame + i * 12) % Math.round(fps * 1.6);
          const pulse = interpolate(pulseFrame, [0, fps * 0.3, fps * 1.6], [3, 7, 3]);
          const pulseOp = interpolate(pulseFrame, [0, fps * 0.3, fps * 1.6], [0.6, 1, 0.6]);
          return (
            <circle key={i} cx={n.x} cy={n.y} r={pulse} fill={ACCENT_TEXT} opacity={pulseOp} />
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

// 13. SpotlightReveal — 円形 clip-path 拡大 + 中央テキスト reveal(reactvideoeditor inspired)
const SpotlightReveal: React.FC<{
  text: string;
  subtext?: string;
  localFrame: number;
  totalDur: number;
  fps: number;
}> = ({ text, subtext, localFrame, fps }) => {
  const enter = spring({
    frame: localFrame,
    fps,
    config: { damping: 200, stiffness: 50 },
    durationInFrames: Math.round(fps * 1.6),
  });
  const radiusPct = interpolate(enter, [0, 1], [0, 80]);
  const textEnter = spring({
    frame: localFrame - Math.round(fps * 0.6),
    fps,
    config: { damping: 200, stiffness: 70 },
    durationInFrames: Math.round(fps * 1.2),
  });
  const textOp = interpolate(textEnter, [0, 1], [0, 1]);
  const textScale = interpolate(textEnter, [0, 1], [0.85, 1]);

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      {/* Spotlight gradient circle */}
      <div
        style={{
          position: "absolute",
          width: 1400,
          height: 1400,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(79, 163, 217,0.25) 0%, rgba(31, 95, 139,0.15) 30%, rgba(0,0,0,0) 70%)`,
          clipPath: `circle(${radiusPct}% at center)`,
        }}
      />
      {/* Outer ring */}
      <div
        style={{
          position: "absolute",
          width: 700,
          height: 700,
          borderRadius: "50%",
          border: `2px solid ${ACCENT}`,
          opacity: interpolate(enter, [0, 1], [0, 0.4]),
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 500,
          height: 500,
          borderRadius: "50%",
          border: `1px solid ${ACCENT}`,
          opacity: interpolate(enter, [0, 1], [0, 0.6]),
        }}
      />
      {/* Center text */}
      <div
        style={{
          opacity: textOp,
          transform: `scale(${textScale})`,
          textAlign: "center",
          padding: "30px 50px",
        }}
      >
        <div
          style={{
            fontFamily: "'Noto Serif CJK JP', serif",
            fontSize: 130,
            fontWeight: 700,
            color: FOREGROUND_LIGHT,
            letterSpacing: 8,
            textShadow: `0 4px 24px rgba(0,0,0,0.85)`,
          }}
        >
          {text}
        </div>
        {subtext ? (
          <div
            style={{
              marginTop: 18,
              fontFamily: "'Noto Sans CJK JP', sans-serif",
              fontSize: 32,
              color: ACCENT_TEXT,
              letterSpacing: 12,
            }}
          >
            {subtext}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

// 14. TextHighlight — 単語を順次ハイライト(reactvideoeditor inspired)
const TextHighlight: React.FC<{
  words: string[];
  localFrame: number;
  totalDur: number;
  fps: number;
}> = ({ words, localFrame, totalDur, fps }) => {
  const opacity = interpolate(localFrame, [0, 8], [0, 1], { extrapolateRight: "clamp" });
  // Each word gets its own active window
  const wordDur = totalDur / Math.max(1, words.length);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity }}>
      <div
        style={{
          maxWidth: 1400,
          padding: "40px 60px",
          background: "rgba(8,8,8,0.65)",
          backdropFilter: "blur(2px)",
          borderLeft: `5px solid ${ACCENT}`,
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "16px 32px",
            justifyContent: "center",
            alignItems: "center",
            fontFamily: "'Noto Serif CJK JP', serif",
            fontSize: 80,
            fontWeight: 700,
            lineHeight: 1.3,
          }}
        >
          {words.map((word, i) => {
            const wordStart = i * wordDur;
            const wordEnd = (i + 1) * wordDur;
            const isActive = localFrame >= wordStart && localFrame < wordEnd;
            const wasActive = localFrame >= wordEnd;
            const enterFrame = localFrame - wordStart;
            const enter = spring({
              frame: enterFrame,
              fps,
              config: { damping: 200, stiffness: 80 },
              durationInFrames: Math.round(fps * 0.4),
            });
            const scale = isActive ? interpolate(enter, [0, 1], [1, 1.15]) : 1;
            const color = isActive ? ACCENT_TEXT : wasActive ? FOREGROUND_LIGHT : "#5a5a5a";
            return (
              <span
                key={i}
                style={{
                  color,
                  transform: `scale(${scale})`,
                  display: "inline-block",
                  transition: "color 0.15s",
                  letterSpacing: 4,
                }}
              >
                {word}
              </span>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// 15. ParticleExplosion — 中央から粒子放射(reactvideoeditor inspired)
const ParticleExplosion: React.FC<{
  color: "accent" | "white" | "accent2";
  label?: string;
  localFrame: number;
  fps: number;
}> = ({ color, label, localFrame, fps }) => {
  const colorMap: Record<string, string> = {
    accent: ACCENT_TEXT,
    white: FOREGROUND_LIGHT,
    accent2: "#3FB8A4",  // 第2アクセント(青緑)
  };
  const c = colorMap[color] || ACCENT_TEXT;
  const NUM = 36;
  const particles = Array.from({ length: NUM });

  const enter = spring({
    frame: localFrame,
    fps,
    config: { damping: 200, stiffness: 60 },
    durationInFrames: Math.round(fps * 0.4),
  });
  const labelEnter = spring({
    frame: localFrame - Math.round(fps * 0.3),
    fps,
    config: { damping: 200, stiffness: 80 },
    durationInFrames: Math.round(fps * 0.6),
  });
  const labelOp = interpolate(labelEnter, [0, 1], [0, 1]);
  const labelScale = interpolate(labelEnter, [0, 1], [0.7, 1]);

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      {/* Center burst flash */}
      <div
        style={{
          position: "absolute",
          width: 200,
          height: 200,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${c}99 0%, ${c}00 70%)`,
          opacity: interpolate(localFrame, [0, fps * 0.3, fps * 1.0], [0, 1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          filter: "blur(6px)",
        }}
      />
      {/* Particles */}
      {particles.map((_, i) => {
        const angle = (i / NUM) * Math.PI * 2;
        const distance = 200 + (i % 4) * 80;
        const t = interpolate(localFrame, [0, fps * 1.2], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const x = Math.cos(angle) * distance * t;
        const y = Math.sin(angle) * distance * t;
        const particleOp = interpolate(t, [0, 0.3, 1], [0, 1, 0]);
        const particleSize = interpolate(t, [0, 1], [10, 4]);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: particleSize,
              height: particleSize,
              borderRadius: "50%",
              background: c,
              transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
              opacity: particleOp,
              boxShadow: `0 0 ${particleSize * 2}px ${c}`,
            }}
          />
        );
      })}
      {/* Label */}
      {label ? (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: `translate(-50%, -50%) scale(${labelScale})`,
            opacity: labelOp * Math.min(1, enter),
            fontFamily: "'Noto Serif CJK JP', serif",
            fontSize: 110,
            fontWeight: 700,
            color: FOREGROUND_LIGHT,
            letterSpacing: 8,
            textShadow: `0 0 20px ${c}, 0 4px 24px rgba(0,0,0,0.85)`,
          }}
        >
          {label}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// 16. PulsingFigure — 単独subject(silhouette)が点滅+拡大、放射パルス付き
const PulsingFigure: React.FC<{
  subject: "female" | "male" | "neutral";
  glow: boolean;
  orbits?: string[];
  localFrame: number;
  totalDur: number;
  fps: number;
}> = ({ subject, glow, orbits, localFrame, fps }) => {
  const enter = spring({
    frame: localFrame,
    fps,
    config: { damping: 200, stiffness: 60 },
    durationInFrames: Math.round(fps * 0.9),
  });
  const baseOp = interpolate(enter, [0, 1], [0, 1]);

  // Continuous breathing pulse (1.5 cycle/sec)
  const pulseT = (localFrame / fps) * 1.5 * Math.PI;
  const pulseScale = 1 + Math.sin(pulseT) * 0.10;
  const pulseGlow = 0.7 + Math.sin(pulseT) * 0.3;

  // Radial pulse rings (3 expanding rings)
  const ringCount = 3;
  const RING_PERIOD = Math.round(fps * 2.2);

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: baseOp }}>
      {/* Pulse rings */}
      {Array.from({ length: ringCount }).map((_, i) => {
        const ringFrame = (localFrame + i * Math.round(RING_PERIOD / ringCount)) % RING_PERIOD;
        const ringScale = interpolate(ringFrame, [0, RING_PERIOD], [1, 5]);
        const ringOp = interpolate(ringFrame, [0, RING_PERIOD * 0.2, RING_PERIOD], [0.7, 0.5, 0]);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              width: 220,
              height: 220,
              borderRadius: "50%",
              border: `3px solid ${ACCENT}`,
              transform: `scale(${ringScale})`,
              opacity: ringOp,
            }}
          />
        );
      })}
      {/* Orbiting items (text labels) */}
      {orbits && orbits.length > 0
        ? orbits.map((label, i) => {
            const orbitT = (localFrame / fps) * 0.6;
            const angle = orbitT + (i / orbits.length) * Math.PI * 2;
            const radius = 280;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                  background: "rgba(8,8,8,0.78)",
                  border: `1px solid ${ACCENT}`,
                  padding: "6px 14px",
                  fontFamily: "'Noto Sans CJK JP', sans-serif",
                  fontSize: 18,
                  fontWeight: 700,
                  color: FOREGROUND_LIGHT,
                  letterSpacing: 4,
                  borderRadius: 4,
                }}
              >
                {label}
              </div>
            );
          })
        : null}
      {/* Subject SVG */}
      <svg
        width={400}
        height={520}
        viewBox="0 0 100 130"
        style={{
          opacity: pulseGlow,
          transform: `scale(${pulseScale})`,
          filter: glow ? `drop-shadow(0 0 24px ${ACCENT}) drop-shadow(0 0 12px ${ACCENT_TEXT})` : "none",
        }}
      >
        {subject === "female" ? (
          <g>
            {/* long hair */}
            <path d="M 32 18 Q 26 36 28 56 L 24 70 Q 20 80 22 92 L 30 100 L 35 60 Z" fill={ACCENT_TEXT} />
            <path d="M 68 18 Q 74 36 72 56 L 76 70 Q 80 80 78 92 L 70 100 L 65 60 Z" fill={ACCENT_TEXT} />
            {/* head */}
            <ellipse cx="50" cy="22" rx="13" ry="15" fill={ACCENT_TEXT} />
            {/* upper body / dress */}
            <path d="M 33 50 Q 50 44 67 50 L 65 70 Q 60 76 50 76 Q 40 76 35 70 Z" fill={ACCENT_TEXT} />
            {/* skirt flare */}
            <path d="M 35 70 L 28 120 L 72 120 L 65 70 Z" fill={ACCENT_TEXT} />
          </g>
        ) : (
          <g>
            <ellipse cx="50" cy="22" rx="14" ry="16" fill={ACCENT_TEXT} />
            <path d="M 32 50 Q 50 44 68 50 L 68 95 Q 68 105 62 110 L 38 110 Q 32 105 32 95 Z" fill={ACCENT_TEXT} />
          </g>
        )}
      </svg>
    </AbsoluteFill>
  );
};

// 17. ImageCallout — AI画像をボックスフレーム内に Ken Burns で表示(絵文字 icon の代替)
const ImageCallout: React.FC<{
  image: string;
  caption?: string;
  kenBurns: boolean;
  localFrame: number;
  totalDur: number;
  fps: number;
}> = ({ image, caption, kenBurns, localFrame, fps }) => {
  const enter = spring({
    frame: localFrame,
    fps,
    config: { damping: 200, stiffness: 60 },
    durationInFrames: Math.round(fps * 0.9),
  });
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const scale = interpolate(enter, [0, 1], [0.94, 1]);

  // Slow Ken Burns within the frame
  const kbT = kenBurns ? Math.min(1, localFrame / (fps * 6)) : 0;
  const kbScale = 1 + kbT * 0.08;

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      {/* Dim layer behind callout to clearly separate from bg */}
      <AbsoluteFill style={{ background: "rgba(0,0,0,0.55)", opacity }} />
      <div
        style={{
          opacity,
          transform: `scale(${scale})`,
          background: "rgba(8,8,8,0.85)",
          padding: 22,
          border: `3px solid ${ACCENT}`,
          boxShadow: "0 0 80px rgba(0,0,0,0.9), 0 0 24px rgba(31, 95, 139,0.5)",
          position: "relative",
        }}
      >
        <div
          style={{
            width: 800,
            height: 450,
            overflow: "hidden",
            background: "#000",
            position: "relative",
          }}
        >
          {image ? (
            <Img
              src={staticFile(image)}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transform: `scale(${kbScale})`,
              }}
            />
          ) : null}
          <div
            style={{
              position: "absolute",
              inset: 0,
              boxShadow: "inset 0 0 60px rgba(0,0,0,0.7)",
              pointerEvents: "none",
            }}
          />
        </div>
        {caption ? (
          <div
            style={{
              marginTop: 18,
              color: FOREGROUND_LIGHT,
              fontFamily: "'Noto Serif CJK JP', serif",
              fontSize: 28,
              letterSpacing: 8,
              textAlign: "center",
              padding: "4px 0",
            }}
          >
            {caption}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

// 12. CalendarGrid
const CalendarGrid: React.FC<{
  markedDays: number[];
  label?: string;
  localFrame: number;
  fps: number;
}> = ({ markedDays, label, localFrame, fps }) => {
  const enter = spring({
    frame: localFrame,
    fps,
    config: { damping: 200, stiffness: 60 },
    durationInFrames: Math.round(fps * 1.0),
  });
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const days = Array.from({ length: 30 }, (_, i) => i + 1);

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity }}>
      <div
        style={{
          background: "rgba(8,8,8,0.65)",
          border: `1px solid #5a5a5a`,
          borderTop: `3px solid ${ACCENT}`,
          padding: "30px 36px",
        }}
      >
        {label ? (
          <div
            style={{
              fontFamily: "'Noto Sans CJK JP', sans-serif",
              fontSize: 22,
              color: ACCENT_TEXT,
              letterSpacing: 8,
              marginBottom: 18,
              textAlign: "center",
            }}
          >
            {label}
          </div>
        ) : null}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 60px)",
            gap: 6,
          }}
        >
          {days.map((d) => {
            const isMarked = markedDays.includes(d);
            const markFrame = isMarked
              ? localFrame - Math.round(fps * 0.5) - markedDays.indexOf(d) * Math.round(fps * 0.3)
              : 0;
            const markEnter = isMarked
              ? spring({
                  frame: markFrame,
                  fps,
                  config: { damping: 200, stiffness: 80 },
                  durationInFrames: Math.round(fps * 0.5),
                })
              : 0;
            const markOp = interpolate(markEnter, [0, 1], [0, 1]);
            return (
              <div
                key={d}
                style={{
                  width: 60,
                  height: 60,
                  border: `1px solid ${isMarked ? ACCENT : "#3a3a3a"}`,
                  background: isMarked ? "rgba(79, 163, 217,0.15)" : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "'Noto Sans CJK JP', sans-serif",
                  fontSize: 22,
                  color: isMarked ? ACCENT_TEXT : "#5a5a5a",
                  fontWeight: 700,
                  position: "relative",
                }}
              >
                {d}
                {isMarked ? (
                  <div
                    style={{
                      position: "absolute",
                      top: 4,
                      right: 4,
                      fontSize: 16,
                      color: ACCENT,
                      opacity: markOp,
                    }}
                  >
                    ✕
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// =============================================================
// round 3.2  — 追加の演出 type 8 種
// =============================================================

// 18. YearStamp — 古印刷風年号 stamp(タイプライター serif + 紙テクスチャ + 印章)
const YearStamp: React.FC<{
  year: string;
  subtext?: string;
  localFrame: number;
  fps: number;
}> = ({ year, subtext, localFrame, fps }) => {
  const enter = spring({
    frame: localFrame,
    fps,
    config: { damping: 200, stiffness: 60 },
    durationInFrames: Math.round(fps * 1.0),
  });
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const rotate = interpolate(enter, [0, 1], [-8, -2]);  // 微妙に傾く印章感
  const scale = interpolate(enter, [0, 1], [1.4, 1]);

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          opacity,
          transform: `rotate(${rotate}deg) scale(${scale})`,
          padding: "40px 80px",
          border: `6px double ${ACCENT}`,
          background: "rgba(233, 241, 245, 0.95)",  // 淡い青灰の紙色
          boxShadow: "0 0 60px rgba(0,0,0,0.6)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: "'Noto Serif CJK JP', 'Times New Roman', serif",
            fontSize: 180,
            fontWeight: 700,
            color: ACCENT,
            letterSpacing: 12,
            textShadow: "2px 2px 0 rgba(31, 95, 139,0.3)",  // 印影のにじみ感(青系)
          }}
        >
          {year}
        </div>
        {subtext ? (
          <div
            style={{
              marginTop: 12,
              fontFamily: "'Noto Sans CJK JP', sans-serif",
              fontSize: 28,
              letterSpacing: 6,
              color: "#2a323a",
              fontStyle: "italic",
            }}
          >
            {subtext}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

// 19. QuoteFrame — 古フィルム風引用 box
const QuoteFrame: React.FC<{
  quote: string;
  attribution?: string;
  localFrame: number;
  fps: number;
}> = ({ quote, attribution, localFrame, fps }) => {
  const enter = spring({
    frame: localFrame,
    fps,
    config: { damping: 200, stiffness: 80 },
    durationInFrames: Math.round(fps * 1.0),
  });
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const translateY = interpolate(enter, [0, 1], [20, 0]);
  // ちかちか感が強すぎたので flicker 廃止 (visualノイズ削減)
  const flicker = 1.0;

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          opacity: opacity * flicker,
          transform: `translateY(${translateY}px)`,
          maxWidth: 1400,
          padding: "60px 80px",
          background: "rgba(10, 12, 15, 0.92)",
          border: `1px solid rgba(220, 235, 242, 0.4)`,
          position: "relative",
        }}
      >
        {/* 大きな引用符 */}
        <div
          style={{
            position: "absolute",
            top: -10,
            left: 30,
            fontSize: 120,
            fontFamily: "'Noto Serif CJK JP', serif",
            color: ACCENT_TEXT,
            opacity: 0.6,
            lineHeight: 1,
          }}
        >
          "
        </div>
        <div
          style={{
            position: "absolute",
            bottom: -50,
            right: 30,
            fontSize: 120,
            fontFamily: "'Noto Serif CJK JP', serif",
            color: ACCENT_TEXT,
            opacity: 0.6,
            lineHeight: 1,
          }}
        >
          "
        </div>
        <div
          style={{
            fontFamily: "'Noto Serif CJK JP', serif",
            fontSize: 64,
            fontWeight: 500,
            color: FOREGROUND_LIGHT,
            letterSpacing: 4,
            lineHeight: 1.5,
            textAlign: "center",
            fontStyle: "italic",
          }}
        >
          {quote}
        </div>
        {attribution ? (
          <div
            style={{
              marginTop: 30,
              fontFamily: "'Noto Sans CJK JP', sans-serif",
              fontSize: 24,
              letterSpacing: 8,
              color: "#9a9a9a",
              textAlign: "right",
            }}
          >
            {attribution}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

// 20. StatisticTicker — 数値が流れるティッカー
const StatisticTicker: React.FC<{
  items: string[];
  localFrame: number;
  fps: number;
}> = ({ items, localFrame, fps }) => {
  const enter = spring({
    frame: localFrame,
    fps,
    config: { damping: 200, stiffness: 60 },
    durationInFrames: Math.round(fps * 0.8),
  });
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  // 横スクロール: 1 item 表示時間 約 2 秒
  const itemDuration = Math.round(fps * 2.0);
  const totalItems = items.length;
  // 連結して連続表示
  const tickerContent = items.join("    ◆    ");
  const scrollSpeed = 180;  // px / sec
  const offsetX = -((localFrame / fps) * scrollSpeed);

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          opacity,
          width: "100%",
          height: 180,
          background: "linear-gradient(180deg, rgba(0,0,0,0.85) 0%, rgba(31, 95, 139,0.5) 50%, rgba(0,0,0,0.85) 100%)",
          borderTop: `3px solid ${ACCENT}`,
          borderBottom: `3px solid ${ACCENT}`,
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          position: "relative",
        }}
      >
        <div
          style={{
            transform: `translateX(${offsetX}px)`,
            whiteSpace: "nowrap",
            fontFamily: "'Noto Sans CJK JP', sans-serif",
            fontSize: 80,
            fontWeight: 700,
            color: FOREGROUND_LIGHT,
            letterSpacing: 12,
            textShadow: "0 2px 8px rgba(0,0,0,0.9)",
          }}
        >
          {/* 2 周分連結してループ感を出す */}
          {tickerContent}{"    ◆    "}{tickerContent}{"    ◆    "}{tickerContent}
        </div>
      </div>
      {/* suppress unused */}
      <span style={{ display: "none" }}>{itemDuration}{totalItems}</span>
    </AbsoluteFill>
  );
};

// 21. WordDissolve — 漢字 1-3 文字が画面で薄れて消える
const WordDissolve: React.FC<{
  word: string;
  subtitle?: string;
  localFrame: number;
  totalDur: number;
  fps: number;
}> = ({ word, subtitle, localFrame, totalDur, fps }) => {
  const enter = spring({
    frame: localFrame,
    fps,
    config: { damping: 200, stiffness: 60 },
    durationInFrames: Math.round(fps * 0.8),
  });
  const entered = interpolate(enter, [0, 1], [0, 1]);
  // 表示後、 後半でゆっくり dissolve
  const dissolveStart = Math.round(totalDur * 0.4);
  const dissolveEnd = totalDur;
  const dissolveT = interpolate(localFrame, [dissolveStart, dissolveEnd], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const blur = interpolate(localFrame, [dissolveStart, dissolveEnd], [0, 24], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scale = interpolate(localFrame, [dissolveStart, dissolveEnd], [1, 1.4], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const opacity = entered * dissolveT;

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: "'Noto Serif CJK JP', serif",
            fontSize: 200,
            fontWeight: 700,
            color: FOREGROUND_LIGHT,
            letterSpacing: 24,
            textShadow: "0 4px 32px rgba(0,0,0,0.85)",
            opacity,
            filter: `blur(${blur}px)`,
            transform: `scale(${scale})`,
            lineHeight: 1,
          }}
        >
          {word}
        </div>
        {subtitle ? (
          <div
            style={{
              marginTop: 30,
              fontFamily: "'Noto Sans CJK JP', sans-serif",
              fontSize: 30,
              color: ACCENT_TEXT,
              letterSpacing: 12,
              opacity: opacity * 0.9,
            }}
          >
            {subtitle}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

// 22. TimelineProgression — 横方向の進行バー(progress + 現在地点 pulse)
const TimelineProgression: React.FC<{
  points: { label: string; marker?: string }[];
  currentIndex: number;
  localFrame: number;
  fps: number;
}> = ({ points, currentIndex, localFrame, fps }) => {
  const enter = spring({
    frame: localFrame,
    fps,
    config: { damping: 200, stiffness: 60 },
    durationInFrames: Math.round(fps * 1.2),
  });
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  // 現在地点 pulse
  const pulseT = (localFrame / fps) * 1.5 * Math.PI;
  const pulseScale = 1 + Math.sin(pulseT) * 0.15;

  const n = points.length;
  if (n === 0) return null;
  const barWidth = 1400;
  const segmentWidth = barWidth / (n - 1);

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          opacity,
          width: barWidth + 200,
          padding: 80,
          background: "rgba(8,8,8,0.65)",
          borderLeft: `5px solid ${ACCENT}`,
          position: "relative",
        }}
      >
        {/* JOURNEY ラベル */}
        <div
          style={{
            position: "absolute",
            top: 24,
            left: 100,
            fontFamily: "'Noto Sans CJK JP', sans-serif",
            fontSize: 22,
            color: ACCENT_TEXT,
            letterSpacing: 14,
            opacity: 0.85,
          }}
        >
          JOURNEY
        </div>
        {/* バー */}
        <div
          style={{
            position: "relative",
            width: barWidth,
            height: 8,
            background: "rgba(154,154,154,0.3)",
            margin: "60px auto 0",
            borderRadius: 4,
          }}
        >
          {/* 進捗 (0 〜 currentIndex まで強調色) */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              height: "100%",
              width: (currentIndex / Math.max(1, n - 1)) * 100 + "%",
              background: ACCENT,
              borderRadius: 4,
            }}
          />
          {/* 各 point */}
          {points.map((p, i) => {
            const x = i * segmentWidth;
            const isCurrent = i === currentIndex;
            const isPast = i < currentIndex;
            return (
              <div key={i}>
                <div
                  style={{
                    position: "absolute",
                    left: x - 12,
                    top: -8,
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    background: isCurrent ? ACCENT : isPast ? ACCENT : "rgba(154,154,154,0.5)",
                    border: isCurrent ? `4px solid ${ACCENT_TEXT}` : `2px solid ${FOREGROUND_LIGHT}`,
                    transform: isCurrent ? `scale(${pulseScale})` : "scale(1)",
                    boxShadow: isCurrent ? `0 0 24px ${ACCENT}` : "none",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    left: x - 50,
                    top: 30,
                    width: 100,
                    textAlign: "center",
                    fontFamily: "'Noto Sans CJK JP', sans-serif",
                    fontSize: isCurrent ? 32 : 22,
                    fontWeight: isCurrent ? 700 : 400,
                    color: isCurrent ? FOREGROUND_LIGHT : isPast ? ACCENT_TEXT : "#9a9a9a",
                    letterSpacing: 2,
                  }}
                >
                  {p.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// 23. PhotoMontage — 複数 AI 画像の ken-burns crossfade
const PhotoMontage: React.FC<{
  images: string[];
  speed: number;
  localFrame: number;
  fps: number;
}> = ({ images, speed, localFrame, fps }) => {
  const enter = spring({
    frame: localFrame,
    fps,
    config: { damping: 200, stiffness: 80 },
    durationInFrames: Math.round(fps * 0.6),
  });
  const opacity = interpolate(enter, [0, 1], [0, 1]);

  if (images.length === 0) return null;

  const imageDurationFrames = Math.round(speed * fps);
  const fadeDuration = Math.round(fps * 0.4);

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          opacity,
          width: 1200,
          height: 700,
          position: "relative",
          background: "rgba(8,8,8,0.85)",
          border: `3px solid ${ACCENT}`,
          boxShadow: "0 0 80px rgba(0,0,0,0.9), 0 0 24px rgba(31, 95, 139,0.5)",
          overflow: "hidden",
        }}
      >
        {images.map((src, i) => {
          const startFrame = i * imageDurationFrames;
          const endFrame = (i + 1) * imageDurationFrames + fadeDuration;
          const localT = localFrame - startFrame;
          // fade in / out
          const fadeIn = interpolate(localT, [0, fadeDuration], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const fadeOut = interpolate(
            localT,
            [imageDurationFrames, imageDurationFrames + fadeDuration],
            [1, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );
          // ken-burns zoom: 1.0 → 1.12 over image duration
          const kb = interpolate(localT, [0, imageDurationFrames + fadeDuration], [1.0, 1.12], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const op = Math.min(fadeIn, fadeOut);
          if (op <= 0 || localFrame < startFrame - 5 || localFrame > endFrame + 5) return null;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                inset: 0,
                opacity: op,
              }}
            >
              <Img
                src={staticFile(src)}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  transform: `scale(${kb})`,
                }}
              />
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// 24. DocumentZoom — 論文/法律文書/新聞紙面 zoom + highlight
const DocumentZoom: React.FC<{
  image: string;
  highlightBbox?: { x: number; y: number; w: number; h: number };
  caption?: string;
  localFrame: number;
  totalDur: number;
  fps: number;
}> = ({ image, highlightBbox, caption, localFrame, totalDur, fps }) => {
  const enter = spring({
    frame: localFrame,
    fps,
    config: { damping: 200, stiffness: 60 },
    durationInFrames: Math.round(fps * 1.0),
  });
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  // zoom: 1.0 → 1.3 across totalDur
  const zoom = interpolate(localFrame, [0, totalDur], [1.0, 1.3], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  // 矩形 highlight が後半で出る
  const highlightFrame = Math.round(totalDur * 0.4);
  const highlightOp = interpolate(localFrame, [highlightFrame, highlightFrame + fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <AbsoluteFill style={{ background: "rgba(0,0,0,0.55)", opacity }} />
      <div
        style={{
          opacity,
          width: 1100,
          height: 700,
          position: "relative",
          background: "rgba(233, 241, 245, 0.98)",
          border: `4px solid ${ACCENT}`,
          boxShadow: "0 0 80px rgba(0,0,0,0.9)",
          overflow: "hidden",
        }}
      >
        {image ? (
          <Img
            src={staticFile(image)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: `scale(${zoom})`,
              filter: "sepia(0.4) contrast(1.1)",
            }}
          />
        ) : null}
        {highlightBbox ? (
          <div
            style={{
              position: "absolute",
              left: `${highlightBbox.x}%`,
              top: `${highlightBbox.y}%`,
              width: `${highlightBbox.w}%`,
              height: `${highlightBbox.h}%`,
              border: `4px solid ${ACCENT}`,
              background: "rgba(110, 225, 200, 0.25)",
              opacity: highlightOp,
              boxShadow: `inset 0 0 24px rgba(31, 95, 139,0.3)`,
            }}
          />
        ) : null}
        {caption ? (
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              padding: "16px 28px",
              background: "rgba(8, 8, 8, 0.85)",
              borderTop: `2px solid ${ACCENT}`,
              fontFamily: "'Noto Sans CJK JP', sans-serif",
              fontSize: 26,
              color: FOREGROUND_LIGHT,
              letterSpacing: 4,
              textAlign: "center",
            }}
          >
            {caption}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

// 25. BrainHeatmap — 断面図上のヒートマップ。強度カーブに沿って対象領域の強さが変化
const BrainHeatmap: React.FC<{
  intensityCurve: number[];
  localFrame: number;
  totalDur: number;
  fps: number;
}> = ({ intensityCurve, localFrame, totalDur, fps }) => {
  const enter = spring({
    frame: localFrame,
    fps,
    config: { damping: 200, stiffness: 60 },
    durationInFrames: Math.round(fps * 1.0),
  });
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  // intensity curve に沿って対象 region の opacity を補間
  const n = intensityCurve.length;
  const segmentDur = totalDur / Math.max(1, n);
  const segIdx = Math.min(n - 1, Math.floor(localFrame / Math.max(1, segmentDur)));
  const segLocal = (localFrame - segIdx * segmentDur) / Math.max(1, segmentDur);
  const fromI = intensityCurve[segIdx];
  const toI = intensityCurve[Math.min(n - 1, segIdx + 1)];
  const currentIntensity = fromI + (toI - fromI) * Math.min(1, segLocal);

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          opacity,
          textAlign: "center",
        }}
      >
        {/* 断面図 SVG */}
        <svg width={800} height={600} viewBox="0 0 800 600">
          {/* 外形 */}
          <ellipse cx={400} cy={300} rx={300} ry={240} fill="#1a1a1f" stroke="#4a4a55" strokeWidth={2} />
          {/* 内部の線 (lines) */}
          {[150, 250, 350, 450, 550].map((y, i) => (
            <path
              key={i}
              d={`M ${130 + i * 20} ${y} Q 400 ${y - 30} ${670 - i * 20} ${y}`}
              stroke="#3a3a45"
              strokeWidth={1.5}
              fill="none"
              opacity={0.6}
            />
          ))}
          {/* 対象 region (heatmap、 left + right) */}
          <ellipse
            cx={310}
            cy={350}
            rx={40}
            ry={30}
            fill={`rgba(${Math.floor(40 + (1 - currentIntensity) * 60)}, ${Math.floor(90 + currentIntensity * 70)}, ${Math.floor(150 + currentIntensity * 90)}, ${0.4 + currentIntensity * 0.6})`}
            filter="url(#glow)"
          />
          <ellipse
            cx={490}
            cy={350}
            rx={40}
            ry={30}
            fill={`rgba(${Math.floor(40 + (1 - currentIntensity) * 60)}, ${Math.floor(90 + currentIntensity * 70)}, ${Math.floor(150 + currentIntensity * 90)}, ${0.4 + currentIntensity * 0.6})`}
            filter="url(#glow)"
          />
          {/* region ラベル */}
          <text
            x={400}
            y={420}
            fill={ACCENT_TEXT}
            fontSize={20}
            fontFamily="'Noto Sans CJK JP', sans-serif"
            textAnchor="middle"
            letterSpacing={6}
          >
            領域A
          </text>
          <text
            x={400}
            y={445}
            fill="#9a9a9a"
            fontSize={14}
            fontFamily="'Noto Sans CJK JP', sans-serif"
            textAnchor="middle"
            letterSpacing={4}
          >
            REGION A
          </text>
          <defs>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="6" />
            </filter>
          </defs>
        </svg>
        {/* 強度 indicator */}
        <div
          style={{
            marginTop: 20,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 16,
            fontFamily: "'Noto Sans CJK JP', sans-serif",
            fontSize: 22,
            color: "#9a9a9a",
            letterSpacing: 6,
          }}
        >
          <span>反応強度</span>
          <div
            style={{
              width: 280,
              height: 12,
              background: "rgba(154,154,154,0.3)",
              borderRadius: 6,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: currentIntensity * 100 + "%",
                height: "100%",
                background: `linear-gradient(90deg, ${ACCENT} 0%, ${ACCENT_TEXT} 100%)`,
              }}
            />
          </div>
          <span style={{ color: FOREGROUND_LIGHT }}>
            {(currentIntensity * 100).toFixed(0)}%
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// =============================================================
// round 3.3  — Tier 1+2+3 = 10 新規 type
// =============================================================

// 26. MirrorSplit — 左右画像に ken-burns + 中央分線脈動 + ラベル wipe-in
const MirrorSplit: React.FC<{
  leftImage: string;
  rightImage: string;
  leftLabel?: string;
  rightLabel?: string;
  localFrame: number;
  totalDur: number;
  fps: number;
}> = ({ leftImage, rightImage, leftLabel, rightLabel, localFrame, totalDur, fps }) => {
  const enter = spring({
    frame: localFrame, fps,
    config: { damping: 200, stiffness: 60 },
    durationInFrames: Math.round(fps * 1.0),
  });
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  // 中央分線脈動
  const pulseT = (localFrame / fps) * 1.2 * Math.PI;
  const lineGlow = 0.5 + Math.sin(pulseT) * 0.5;
  const fadeBoundary = interpolate(localFrame, [totalDur * 0.6, totalDur], [1, 0.2], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  // ken-burns: 左は zoom in、 右は zoom out で動きを対比化
  const leftZoom = interpolate(localFrame, [0, totalDur], [1.0, 1.18], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const leftPanX = interpolate(localFrame, [0, totalDur], [-10, 10], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const rightZoom = interpolate(localFrame, [0, totalDur], [1.15, 1.0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const rightPanX = interpolate(localFrame, [0, totalDur], [10, -10], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  // ラベル wipe-in (左から / 右から)
  const labelEnter = spring({
    frame: localFrame - Math.round(fps * 0.4), fps,
    config: { damping: 200, stiffness: 80 },
    durationInFrames: Math.round(fps * 0.8),
  });
  const labelOpacity = interpolate(labelEnter, [0, 1], [0, 1]);
  const leftLabelTx = interpolate(labelEnter, [0, 1], [-40, 0]);
  const rightLabelTx = interpolate(labelEnter, [0, 1], [40, 0]);

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity }}>
      <div
        style={{
          width: 1600,
          height: 700,
          position: "relative",
          display: "flex",
          background: "rgba(8,8,8,0.85)",
          border: `3px solid ${ACCENT}`,
          boxShadow: "0 0 80px rgba(0,0,0,0.9)",
        }}
      >
        {/* 左 */}
        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          {leftImage ? (
            <Img
              src={staticFile(leftImage)}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transform: `scale(${leftZoom}) translateX(${leftPanX}px)`,
                filter: "grayscale(0.15) contrast(1.08) brightness(0.95)",
              }}
            />
          ) : null}
          {leftLabel ? (
            <div
              style={{
                position: "absolute",
                bottom: 24,
                left: 24,
                padding: "10px 18px",
                background: "rgba(8,8,8,0.92)",
                borderLeft: `4px solid ${ACCENT}`,
                fontFamily: "'Noto Sans CJK JP', sans-serif",
                fontSize: 32,
                fontWeight: 700,
                color: FOREGROUND_LIGHT,
                letterSpacing: 6,
                opacity: labelOpacity,
                transform: `translateX(${leftLabelTx}px)`,
              }}
            >
              {leftLabel}
            </div>
          ) : null}
        </div>
        {/* 中央分線 */}
        <div
          style={{
            width: 4,
            background: ACCENT,
            opacity: fadeBoundary * lineGlow,
            boxShadow: `0 0 ${20 * lineGlow}px ${ACCENT}`,
          }}
        />
        {/* 右 */}
        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          {rightImage ? (
            <Img
              src={staticFile(rightImage)}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transform: `scale(${rightZoom}) translateX(${rightPanX}px)`,
                filter: "grayscale(0.15) contrast(1.08) brightness(0.95)",
              }}
            />
          ) : null}
          {rightLabel ? (
            <div
              style={{
                position: "absolute",
                bottom: 24,
                right: 24,
                padding: "10px 18px",
                background: "rgba(8,8,8,0.92)",
                borderRight: `4px solid ${ACCENT}`,
                fontFamily: "'Noto Sans CJK JP', sans-serif",
                fontSize: 32,
                fontWeight: 700,
                color: FOREGROUND_LIGHT,
                letterSpacing: 6,
                opacity: labelOpacity,
                transform: `translateX(${rightLabelTx}px)`,
              }}
            >
              {rightLabel}
            </div>
          ) : null}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// 27. DayClock — 24h 円時計 + 活動帯ハイライト
const DayClock: React.FC<{
  activeHours: number[];
  label?: string;
  subtitle?: string;
  localFrame: number;
  fps: number;
}> = ({ activeHours, label, subtitle, localFrame, fps }) => {
  const enter = spring({
    frame: localFrame, fps,
    config: { damping: 200, stiffness: 60 },
    durationInFrames: Math.round(fps * 1.2),
  });
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const scale = interpolate(enter, [0, 1], [0.85, 1]);
  const cx = 300, cy = 300, r = 240, innerR = 180;
  const activeSet = new Set(activeHours);
  const hourAngle = (h: number) => (h / 24) * 2 * Math.PI - Math.PI / 2;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity }}>
      <div style={{ transform: `scale(${scale})`, textAlign: "center" }}>
        <svg width={600} height={600} viewBox="0 0 600 600">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#3a3a45" strokeWidth={2} />
          <circle cx={cx} cy={cy} r={innerR} fill="rgba(8,8,8,0.85)" stroke="#3a3a45" strokeWidth={1} />
          {Array.from({ length: 24 }).map((_, h) => {
            const a1 = hourAngle(h), a2 = hourAngle(h + 1);
            const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
            const x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2);
            const xi1 = cx + innerR * Math.cos(a1), yi1 = cy + innerR * Math.sin(a1);
            const xi2 = cx + innerR * Math.cos(a2), yi2 = cy + innerR * Math.sin(a2);
            const isActive = activeSet.has(h);
            const path = `M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} L ${xi2} ${yi2} A ${innerR} ${innerR} 0 0 0 ${xi1} ${yi1} Z`;
            return <path key={h} d={path} fill={isActive ? ACCENT : "rgba(60, 60, 70, 0.4)"} opacity={isActive ? 0.85 : 0.5} />;
          })}
          {[0, 4, 8, 12, 16, 20].map((h) => {
            const a = hourAngle(h);
            const tx = cx + (r + 28) * Math.cos(a);
            const ty = cy + (r + 28) * Math.sin(a);
            return <text key={h} x={tx} y={ty} fontSize={28} fontFamily="'Noto Sans CJK JP', sans-serif" fontWeight={700} fill={activeSet.has(h) ? ACCENT_TEXT : "#9a9a9a"} textAnchor="middle" dominantBaseline="middle">{h}</text>;
          })}
          {label ? <text x={cx} y={cy - 10} fontSize={32} fontFamily="'Noto Sans CJK JP', sans-serif" fontWeight={700} fill={FOREGROUND_LIGHT} textAnchor="middle" letterSpacing={4}>{label}</text> : null}
          {subtitle ? <text x={cx} y={cy + 30} fontSize={18} fontFamily="'Noto Sans CJK JP', sans-serif" fill="#9a9a9a" textAnchor="middle" letterSpacing={4}>{subtitle}</text> : null}
        </svg>
      </div>
    </AbsoluteFill>
  );
};

// 28. FadingContacts
const FadingContacts: React.FC<{
  names: string[];
  label?: string;
  localFrame: number;
  totalDur: number;
  fps: number;
}> = ({ names, label, localFrame, totalDur, fps }) => {
  const enter = spring({ frame: localFrame, fps, config: { damping: 200, stiffness: 60 }, durationInFrames: Math.round(fps * 0.8) });
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const n = names.length;
  const fadeStart = Math.round(fps * 0.8);
  const fadeStep = Math.round((totalDur - fadeStart) / Math.max(1, n));
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity }}>
      <div style={{ width: 600, padding: 40, background: "rgba(8,8,8,0.85)", border: `2px solid #3a3a45`, borderTop: `4px solid ${ACCENT}`, boxShadow: "0 0 60px rgba(0,0,0,0.9)" }}>
        {label ? <div style={{ fontFamily: "'Noto Sans CJK JP', sans-serif", fontSize: 22, fontWeight: 700, color: ACCENT_TEXT, letterSpacing: 10, marginBottom: 24 }}>{label}</div> : null}
        {names.map((name, i) => {
          const itemFadeFrame = fadeStart + i * fadeStep;
          const fadeT = interpolate(localFrame, [itemFadeFrame, itemFadeFrame + Math.round(fps * 0.4)], [1, 0.15], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const strikeT = interpolate(localFrame, [itemFadeFrame - 10, itemFadeFrame + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const grayT = interpolate(localFrame, [itemFadeFrame, itemFadeFrame + fps * 0.4], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <div key={i} style={{ position: "relative", padding: "12px 16px", borderBottom: "1px solid rgba(154,154,154,0.2)", fontFamily: "'Noto Sans CJK JP', sans-serif", fontSize: 28, color: grayT > 0.5 ? "#5a5a5a" : FOREGROUND_LIGHT, opacity: fadeT, letterSpacing: 2 }}>
              {name}
              <div style={{ position: "absolute", left: 16, right: 16, top: "50%", height: 2, background: ACCENT, transform: `scaleX(${strikeT})`, transformOrigin: "left center", opacity: 0.7 }} />
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// 29. CrowdAnonymous
const CrowdAnonymous: React.FC<{
  count: number;
  label?: string;
  localFrame: number;
  fps: number;
}> = ({ count, label, localFrame, fps }) => {
  const enter = spring({ frame: localFrame, fps, config: { damping: 200, stiffness: 60 }, durationInFrames: Math.round(fps * 1.0) });
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const cols = 4;
  const rows = Math.ceil(count / cols);
  const figures = Array.from({ length: count });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity }}>
      <div style={{ width: 1500, height: 600, position: "relative", display: "flex", flexDirection: "column", justifyContent: "space-around", padding: 40, background: "linear-gradient(180deg, rgba(8,8,8,0) 0%, rgba(8,8,8,0.6) 100%)" }}>
        {Array.from({ length: rows }).map((_, row) => (
          <div key={row} style={{ display: "flex", justifyContent: "space-around", alignItems: "flex-end" }}>
            {figures.slice(row * cols, (row + 1) * cols).map((_, col) => {
              const idx = row * cols + col;
              const walkT = (localFrame / fps + idx * 0.7) * 1.0 * Math.PI;
              const sway = Math.sin(walkT) * 4;
              const personHeight = 100 + (row % 2) * 20;
              const fade = 0.5 + (row / rows) * 0.5;
              return (
                <svg key={col} width={60} height={personHeight + 20} viewBox="0 0 60 130" style={{ transform: `translateY(${sway}px)`, opacity: fade }}>
                  <circle cx={30} cy={20} r={12} fill={FOREGROUND_LIGHT} opacity={0.7} />
                  <path d="M 14 38 Q 30 28 46 38 L 46 100 Q 46 110 40 115 L 20 115 Q 14 110 14 100 Z" fill={FOREGROUND_LIGHT} opacity={0.7} />
                </svg>
              );
            })}
          </div>
        ))}
        {label ? <div style={{ position: "absolute", top: 20, left: 0, right: 0, textAlign: "center", fontFamily: "'Noto Sans CJK JP', sans-serif", fontSize: 32, fontWeight: 700, color: ACCENT_TEXT, letterSpacing: 14, textShadow: "0 2px 8px rgba(0,0,0,0.9)" }}>{label}</div> : null}
      </div>
    </AbsoluteFill>
  );
};

// 30. OverlayWords — 円周等分配置 + 中心ラベル(均等配置で重なり防止)
const OverlayWords: React.FC<{
  words: string[];
  circleLabel?: string;
  localFrame: number;
  fps: number;
}> = ({ words, circleLabel, localFrame, fps }) => {
  const enter = spring({
    frame: localFrame, fps,
    config: { damping: 200, stiffness: 60 },
    durationInFrames: Math.round(fps * 0.8),
  });
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  // 円周等分: 12 時方向開始、 時計回り
  const n = words.length;
  const radius = 280;  // 単語の中心位置の半径
  // 微小 pulse (1.5s 周期)
  const pulseT = (localFrame / fps) * 0.7 * Math.PI;
  const pulseScale = 1 + Math.sin(pulseT) * 0.02;

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity }}>
      <div style={{ position: "relative", width: 900, height: 700 }}>
        {/* 中央の円 */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: 320,
            height: 320,
            borderRadius: "50%",
            border: `3px dashed ${ACCENT}`,
            background: "rgba(31, 95, 139,0.08)",
            transform: `translate(-50%, -50%) scale(${pulseScale})`,
          }}
        />
        {circleLabel ? (
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              fontFamily: "'Noto Sans CJK JP', sans-serif",
              fontSize: 28,
              fontWeight: 700,
              color: ACCENT_TEXT,
              letterSpacing: 10,
              textAlign: "center",
              textShadow: "0 2px 8px rgba(0,0,0,0.9)",
              maxWidth: 280,
              lineHeight: 1.3,
            }}
          >
            {circleLabel}
          </div>
        ) : null}
        {/* 単語を円周等分配置 */}
        {words.map((word, i) => {
          // 12 時 (-90°) から始め、 時計回りに等分
          const angle = (-Math.PI / 2) + (i / n) * 2 * Math.PI;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          const itemFrame = localFrame - i * Math.round(fps * 0.15);
          const itemEnter = spring({
            frame: itemFrame, fps,
            config: { damping: 200, stiffness: 80 },
            durationInFrames: Math.round(fps * 0.6),
          });
          const itemOpacity = interpolate(itemEnter, [0, 1], [0, 1]);
          const itemScale = interpolate(itemEnter, [0, 1], [0.6, 1]);
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: `calc(50% + ${x}px)`,
                top: `calc(50% + ${y}px)`,
                transform: `translate(-50%, -50%) scale(${itemScale})`,
                opacity: itemOpacity,
                fontFamily: "'Noto Sans CJK JP', sans-serif",
                fontSize: 42,
                fontWeight: 700,
                color: i % 2 === 0 ? FOREGROUND_LIGHT : ACCENT_TEXT,
                letterSpacing: 4,
                textShadow: "0 2px 8px rgba(0,0,0,0.95)",
                whiteSpace: "nowrap",
                padding: "8px 14px",
                background: "rgba(8,8,8,0.55)",
                borderRadius: 6,
              }}
            >
              {word}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// 31. TextTypewriter
const TextTypewriter: React.FC<{
  text: string;
  attribution?: string;
  speed: number;
  localFrame: number;
  fps: number;
}> = ({ text, attribution, speed, localFrame, fps }) => {
  const charPerFrame = speed / fps;
  const charsShown = Math.min(text.length, Math.floor(localFrame * charPerFrame));
  const visibleText = text.slice(0, charsShown);
  const cursorOn = Math.floor(localFrame / Math.round(fps * 0.3)) % 2 === 0;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ maxWidth: 1500, padding: "60px 80px", background: "rgba(8, 8, 8, 0.92)", border: `1px solid ${ACCENT}`, fontFamily: "'Noto Serif CJK JP', monospace", fontSize: 56, fontWeight: 500, color: FOREGROUND_LIGHT, letterSpacing: 4, lineHeight: 1.5, textAlign: "left", minHeight: 100 }}>
        {visibleText}
        <span style={{ opacity: cursorOn ? 1 : 0, color: ACCENT }}>▍</span>
        {attribution && charsShown >= text.length ? <div style={{ marginTop: 24, fontFamily: "'Noto Sans CJK JP', sans-serif", fontSize: 22, color: "#9a9a9a", letterSpacing: 6, textAlign: "right" }}>{attribution}</div> : null}
      </div>
    </AbsoluteFill>
  );
};

// 32. EraTransition
const EraTransition: React.FC<{
  years: { year: string; label?: string }[];
  currentIndex: number;
  localFrame: number;
  fps: number;
}> = ({ years, currentIndex, localFrame, fps }) => {
  const enter = spring({ frame: localFrame, fps, config: { damping: 200, stiffness: 60 }, durationInFrames: Math.round(fps * 1.0) });
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const slotWidth = 260;
  const totalWidth = years.length * slotWidth;
  const offsetX = -(currentIndex * slotWidth) + (totalWidth / 2 - slotWidth / 2);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity }}>
      <div style={{ width: 1700, height: 320, padding: 40, background: "rgba(8,8,8,0.85)", borderTop: `2px solid ${ACCENT}`, borderBottom: `2px solid ${ACCENT}`, overflow: "hidden", position: "relative" }}>
        <div style={{ position: "absolute", top: 12, left: 40, fontFamily: "'Noto Sans CJK JP', sans-serif", fontSize: 18, color: ACCENT_TEXT, letterSpacing: 14, opacity: 0.8 }}>ERA</div>
        <div style={{ display: "flex", transform: `translateX(${offsetX}px)`, marginTop: 40, alignItems: "center" }}>
          {years.map((y, i) => {
            const isCurrent = i === currentIndex;
            const dist = Math.abs(i - currentIndex);
            const scale = isCurrent ? 1.0 : Math.max(0.6, 1.0 - dist * 0.2);
            const op = isCurrent ? 1 : Math.max(0.3, 1.0 - dist * 0.3);
            return (
              <div key={i} style={{ width: slotWidth, textAlign: "center", flexShrink: 0, transform: `scale(${scale})`, opacity: op }}>
                <div style={{ fontFamily: "'Noto Serif CJK JP', 'Times New Roman', serif", fontSize: 100, fontWeight: 700, color: isCurrent ? FOREGROUND_LIGHT : "#5a5a5a", letterSpacing: 6 }}>{y.year}</div>
                {y.label ? <div style={{ fontFamily: "'Noto Sans CJK JP', sans-serif", fontSize: 22, color: isCurrent ? ACCENT_TEXT : "#6a6a75", letterSpacing: 4, marginTop: 8 }}>{y.label}</div> : null}
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// 33. ZoomIntoEye — ゆっくり ken-burns 風で 1.0→1.5 (旧 1.0→8.0 は速すぎた)
const ZoomIntoEye: React.FC<{
  image: string;
  zoomTarget?: string;
  localFrame: number;
  totalDur: number;
  fps: number;
}> = ({ image, zoomTarget, localFrame, totalDur, fps }) => {
  const enter = spring({ frame: localFrame, fps, config: { damping: 200, stiffness: 60 }, durationInFrames: Math.round(fps * 0.8) });
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  // ken-burns 緩 zoom: 1.0 → 1.5 (8.0 から大幅抑制)
  const zoom = interpolate(localFrame, [0, totalDur], [1.0, 1.5], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  // 微妙な pan も併用
  const panX = interpolate(localFrame, [0, totalDur], [-15, 15], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const targetOpacity = interpolate(localFrame, [totalDur * 0.6, totalDur * 0.85], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", background: "#000" }}>
      <div style={{ opacity, width: "100%", height: "100%", position: "relative", overflow: "hidden" }}>
        {image ? (
          <Img
            src={staticFile(image)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: `scale(${zoom}) translateX(${panX}px)`,
              filter: `contrast(1.05) brightness(0.95) sepia(0.1)`,
            }}
          />
        ) : null}
        {/* 暗いビネット */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(circle, transparent 30%, rgba(0,0,0,0.55) 90%)",
            pointerEvents: "none",
          }}
        />
        {zoomTarget ? (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: "50%",
              transform: "translateY(-50%)",
              textAlign: "center",
              fontFamily: "'Noto Serif CJK JP', serif",
              fontSize: 90,
              fontWeight: 700,
              color: FOREGROUND_LIGHT,
              letterSpacing: 16,
              textShadow: "0 4px 24px rgba(0,0,0,0.95)",
              opacity: targetOpacity,
              mixBlendMode: "screen",
            }}
          >
            {zoomTarget}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

// 34. ReceiptScroll — dark テーマ (暗色基調 + 強調色縁取り)
const ReceiptScroll: React.FC<{
  lines: { date?: string; item: string; amount?: string }[];
  title?: string;
  total?: string;
  localFrame: number;
  fps: number;
}> = ({ lines, title, total, localFrame, fps }) => {
  const enter = spring({
    frame: localFrame, fps,
    config: { damping: 200, stiffness: 80 },
    durationInFrames: Math.round(fps * 0.8),
  });
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const lineDelay = Math.round(fps * 0.5);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity }}>
      <div
        style={{
          width: 720,
          padding: "40px 50px",
          // dark theme: 黒紙 + 強調色縁
          background: "rgba(8, 10, 12, 0.95)",
          border: `2px solid ${ACCENT}`,
          borderLeft: `6px solid ${ACCENT}`,
          fontFamily: "'Noto Sans Mono CJK JP', 'Courier New', monospace",
          color: FOREGROUND_LIGHT,
          boxShadow: "0 0 80px rgba(0,0,0,0.9), 0 0 24px rgba(31, 95, 139,0.4)",
          maxHeight: 800,
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* ヘッダ LOG マーク */}
        <div
          style={{
            position: "absolute",
            top: 12,
            right: 18,
            fontFamily: "'Noto Sans CJK JP', sans-serif",
            fontSize: 14,
            color: ACCENT_TEXT,
            letterSpacing: 8,
            opacity: 0.7,
          }}
        >
          LOG
        </div>
        {title ? (
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              textAlign: "center",
              letterSpacing: 8,
              borderBottom: `2px dashed ${ACCENT}`,
              paddingBottom: 16,
              marginBottom: 24,
              color: FOREGROUND_LIGHT,
              fontFamily: "'Noto Sans CJK JP', sans-serif",
            }}
          >
            {title}
          </div>
        ) : null}
        {lines.map((ln, i) => {
          const itemFrame = localFrame - i * lineDelay;
          const itemEnter = spring({
            frame: itemFrame, fps,
            config: { damping: 200, stiffness: 100 },
            durationInFrames: Math.round(fps * 0.3),
          });
          const itemOp = interpolate(itemEnter, [0, 1], [0, 1]);
          const itemTy = interpolate(itemEnter, [0, 1], [12, 0]);
          return (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                padding: "10px 0",
                fontSize: 22,
                opacity: itemOp,
                transform: `translateY(${itemTy}px)`,
                borderBottom: "1px dotted rgba(31, 95, 139, 0.4)",
              }}
            >
              <span style={{ width: 100, color: "#9a9a9a", fontSize: 18 }}>
                {ln.date || ""}
              </span>
              <span style={{ flex: 1, color: FOREGROUND_LIGHT }}>{ln.item}</span>
              <span
                style={{
                  minWidth: 100,
                  textAlign: "right",
                  fontWeight: 700,
                  color: ACCENT_TEXT,
                }}
              >
                {ln.amount || ""}
              </span>
            </div>
          );
        })}
        {total ? (
          <div
            style={{
              marginTop: 24,
              padding: "14px 0",
              borderTop: `2px solid ${ACCENT}`,
              fontSize: 32,
              fontWeight: 700,
              textAlign: "right",
              letterSpacing: 4,
              color: ACCENT_TEXT,
              fontFamily: "'Noto Sans CJK JP', sans-serif",
            }}
          >
            {total}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

// 35. HeartbeatPulse
const HeartbeatPulse: React.FC<{
  bpmCurve: number[];
  label?: string;
  localFrame: number;
  totalDur: number;
  fps: number;
}> = ({ bpmCurve, label, localFrame, totalDur, fps }) => {
  const enter = spring({ frame: localFrame, fps, config: { damping: 200, stiffness: 60 }, durationInFrames: Math.round(fps * 1.0) });
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const n = bpmCurve.length;
  const segDur = totalDur / Math.max(1, n - 1);
  const segIdx = Math.min(n - 2, Math.floor(localFrame / Math.max(1, segDur)));
  const segLocal = (localFrame - segIdx * segDur) / Math.max(1, segDur);
  const currentBpm = bpmCurve[segIdx] + (bpmCurve[segIdx + 1] - bpmCurve[segIdx]) * Math.min(1, segLocal);
  const width = 1200;
  const height = 240;
  const pathPoints: string[] = [];
  for (let x = 0; x <= width; x += 4) {
    const t = (x / width) * 4;
    const beatT = (t - Math.floor(t));
    let y = 0;
    if (beatT < 0.1) y = Math.sin(beatT * Math.PI * 10) * 8;
    else if (beatT < 0.15) y = 0;
    else if (beatT < 0.2) y = -Math.sin((beatT - 0.15) * Math.PI * 20) * 60;
    else if (beatT < 0.4) y = Math.sin((beatT - 0.2) * Math.PI * 5) * 15;
    else y = 0;
    pathPoints.push(`${x},${height / 2 + y}`);
  }
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity }}>
      <div style={{ width: width + 80, padding: 40, background: "rgba(8,12,12,0.92)", border: `2px solid ${ACCENT}`, textAlign: "center" }}>
        {label ? <div style={{ fontFamily: "'Noto Sans CJK JP', sans-serif", fontSize: 22, color: ACCENT_TEXT, letterSpacing: 10, marginBottom: 8 }}>{label}</div> : null}
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          {Array.from({ length: 12 }).map((_, i) => (
            <line key={i} x1={i * (width / 12)} y1={0} x2={i * (width / 12)} y2={height} stroke="rgba(31, 95, 139, 0.2)" strokeWidth={1} />
          ))}
          <polyline points={pathPoints.join(" ")} fill="none" stroke={ACCENT_TEXT} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" filter="url(#ekg_glow)" />
          <defs>
            <filter id="ekg_glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" />
            </filter>
          </defs>
        </svg>
        <div style={{ marginTop: 8, fontFamily: "'Noto Sans Mono CJK JP', monospace", fontSize: 48, fontWeight: 700, color: FOREGROUND_LIGHT, letterSpacing: 4 }}>
          {currentBpm.toFixed(0)} <span style={{ fontSize: 22, color: "#9a9a9a" }}>BPM</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
