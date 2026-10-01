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
import { LowerThird } from "../components/LowerThird";
import { SubtitleBand } from "../components/SubtitleBand";
import { CentralLayer } from "../components/CentralLayer";

type Props = { slide: Slide; durationFrames?: number };

const ACCENT = "#6B7C85";
const ACCENT_TEXT = "#A7B8C2";
const FOREGROUND_LIGHT = "#F0F0F0";

const StatBlock: React.FC<{
  label: string;
  value: string;
  unit?: string;
  emphasize?: boolean;
  appearAt: number;
}> = ({ label, value, unit, emphasize, appearAt }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({
    frame: frame - appearAt,
    fps,
    config: { damping: 200, stiffness: 80 },
    durationInFrames: fps * 0.8,
  });
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const ty = interpolate(enter, [0, 1], [22, 0]);
  const accent = emphasize ? ACCENT_TEXT : FOREGROUND_LIGHT;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        opacity,
        transform: `translateY(${ty}px)`,
        minWidth: 280,
      }}
    >
      <div
        style={{
          fontSize: 22,
          letterSpacing: 14,
          color: emphasize ? ACCENT_TEXT : "#9a9a9a",
          fontFamily: "'Noto Sans CJK JP', sans-serif",
          fontWeight: 700,
          marginBottom: 18,
        }}
      >
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
        <div
          style={{
            fontSize: 168,
            fontWeight: 800,
            color: accent,
            fontFamily: "'Noto Serif CJK JP', serif",
            lineHeight: 0.95,
          }}
        >
          {value}
        </div>
        {unit ? (
          <div
            style={{
              fontSize: 40,
              color: emphasize ? "#b0cfe8" : "#bdbdbd",
              fontFamily: "'Noto Sans CJK JP', sans-serif",
              fontWeight: 700,
              letterSpacing: 4,
            }}
          >
            {unit}
          </div>
        ) : null}
      </div>
      <div
        style={{
          marginTop: 12,
          width: 80,
          height: 2,
          background: emphasize ? ACCENT : "#5a5a5a",
        }}
      />
    </div>
  );
};

export const CaseData: React.FC<Props> = ({ slide, durationFrames }) => {
  const { durationInFrames } = useVideoConfig();
  const totalFrames = durationFrames ?? durationInFrames;

  const cd = slide.case_data;
  const stats = cd?.stats ?? [];

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <KenBurnsBackground
        src={slide.bg_image ? staticFile(slide.bg_image) : undefined}
        zoomFrom={1.04}
        zoomTo={1.10}
        fallbackTone="dark"
        imageTrack={slide.image_track}
        lineTimings={slide.section_timing}
      />
      {slide.section_audio ? <Audio src={staticFile(slide.section_audio)} /> : null}
      <FilmGrain opacity={0.07} />
      <VignettePulse intensity={0.31} />
      <LetterboxBars height={64} />

      {/* Top tag */}
      <div
        style={{
          position: "absolute",
          top: 150,
          left: 0,
          right: 0,
          textAlign: "center",
          color: ACCENT_TEXT,
          fontFamily: "'Noto Sans CJK JP', sans-serif",
          fontWeight: 700,
          fontSize: 22,
          letterSpacing: 18,
        }}
      >
        DATA
      </div>

      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          padding: "0 100px",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 80,
            alignItems: "flex-end",
            justifyContent: "center",
          }}
        >
          {stats.map((s, i) => (
            <StatBlock
              key={i}
              label={s.label}
              value={s.value}
              unit={s.unit}
              emphasize={s.emphasize}
              appearAt={20 + i * 18}
            />
          ))}
        </div>
        {cd?.caption ? (
          <div
            style={{
              marginTop: 60,
              color: "#a0a0a0",
              fontFamily: "'Noto Serif CJK JP', serif",
              fontSize: 30,
              letterSpacing: 6,
            }}
          >
            {cd.caption}
          </div>
        ) : null}
      </AbsoluteFill>

      <LowerThird primary={slide.title} tag="DATA" position="left" appearAt={32} />
      <CentralLayer centralTrack={slide.central_track} lineTimings={slide.section_timing} />
      <SubtitleBand lines={slide.lines} totalFrames={totalFrames} lineTimings={slide.section_timing} />
    </AbsoluteFill>
  );
};
