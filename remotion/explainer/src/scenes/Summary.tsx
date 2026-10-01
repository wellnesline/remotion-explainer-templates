import React from "react";
import {
  Audio,
  AbsoluteFill,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Slide } from "../types";
import { KenBurnsBackground } from "../components/KenBurnsBackground";
import { FilmGrain } from "../components/FilmGrain";
import { VignettePulse } from "../components/VignettePulse";
import { LetterboxBars } from "../components/LetterboxBars";
import { SubtitleBand } from "../components/SubtitleBand";
import { CentralLayer } from "../components/CentralLayer";

type Props = { slide: Slide; durationFrames?: number };

const ACCENT = "#6B7C85";
const ACCENT_TEXT = "#A7B8C2";
const FOREGROUND_LIGHT = "#F0F0F0";

const SummaryCard: React.FC<{
  number: string;
  title: string;
  subtitle?: string;
  appearAt: number;
}> = ({ number, title, subtitle, appearAt }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({
    frame: frame - appearAt,
    fps,
    config: { damping: 200, stiffness: 80 },
    durationInFrames: fps * 0.9,
  });
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const ty = interpolate(enter, [0, 1], [40, 0]);

  return (
    <div
      style={{
        flex: 1,
        opacity,
        transform: `translateY(${ty}px)`,
        background: "rgba(15,15,15,0.78)",
        border: `1px solid #5a5a5a`,
        borderTop: `3px solid ${ACCENT}`,
        padding: "44px 28px",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        backdropFilter: "blur(2px)",
        minHeight: 320,
      }}
    >
      <div
        style={{
          fontSize: 24,
          color: ACCENT_TEXT,
          fontFamily: "'Noto Sans CJK JP', sans-serif",
          fontWeight: 700,
          letterSpacing: 10,
          marginBottom: 18,
        }}
      >
        {number}
      </div>
      <div
        style={{
          fontSize: 56,
          color: FOREGROUND_LIGHT,
          fontFamily: "'Noto Serif CJK JP', serif",
          fontWeight: 700,
          letterSpacing: 6,
          lineHeight: 1.1,
          marginBottom: 16,
        }}
      >
        {title}
      </div>
      <div
        style={{
          width: 60,
          height: 2,
          background: ACCENT,
          marginBottom: 18,
        }}
      />
      {subtitle ? (
        <div
          style={{
            fontSize: 26,
            color: "#bdbdbd",
            fontFamily: "'Noto Sans CJK JP', sans-serif",
            letterSpacing: 4,
            lineHeight: 1.4,
          }}
        >
          {subtitle}
        </div>
      ) : null}
    </div>
  );
};

export const Summary: React.FC<Props> = ({ slide, durationFrames }) => {
  const { durationInFrames } = useVideoConfig();
  const totalFrames = durationFrames ?? durationInFrames;
  const items = slide.summary?.items ?? [];

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <KenBurnsBackground
        src={slide.bg_image ? staticFile(slide.bg_image) : undefined}
        zoomFrom={1.04}
        zoomTo={1.08}
        fallbackTone="dark"
        imageTrack={slide.image_track}
        lineTimings={slide.section_timing}
      />
      {slide.section_audio ? <Audio src={staticFile(slide.section_audio)} /> : null}
      <FilmGrain opacity={0.07} />
      <VignettePulse intensity={0.31} />
      <LetterboxBars height={64} />

      {/* Top title */}
      <div
        style={{
          position: "absolute",
          top: 130,
          left: 0,
          right: 0,
          textAlign: "center",
        }}
      >
        <div
          style={{
            color: ACCENT_TEXT,
            fontFamily: "'Noto Sans CJK JP', sans-serif",
            fontWeight: 700,
            fontSize: 22,
            letterSpacing: 22,
            marginBottom: 14,
          }}
        >
          SUMMARY
        </div>
        <div
          style={{
            color: FOREGROUND_LIGHT,
            fontFamily: "'Noto Serif CJK JP', serif",
            fontWeight: 700,
            fontSize: 60,
            letterSpacing: 8,
          }}
        >
          {slide.title}
        </div>
      </div>

      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          padding: "0 120px",
          paddingTop: 100,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 32,
            width: "100%",
            maxWidth: 1600,
          }}
        >
          {items.map((it, i) => (
            <SummaryCard
              key={i}
              number={it.number}
              title={it.title}
              subtitle={it.subtitle}
              appearAt={24 + i * 18}
            />
          ))}
        </div>
      </AbsoluteFill>

      <CentralLayer centralTrack={slide.central_track} lineTimings={slide.section_timing} />
      <SubtitleBand lines={slide.lines} totalFrames={totalFrames} lineTimings={slide.section_timing} />
    </AbsoluteFill>
  );
};
