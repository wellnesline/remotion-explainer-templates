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

const ACCENT_TEXT = "#A7B8C2";
const FOREGROUND_LIGHT = "#F0F0F0";

export const CaseQuote: React.FC<Props> = ({ slide, durationFrames }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const totalFrames = durationFrames ?? durationInFrames;

  const q = slide.quote;
  const text = q?.text ?? slide.title;
  const attribution = q?.attribution;

  const quoteEnter = spring({
    frame: frame - 24,
    fps,
    config: { damping: 200, stiffness: 60 },
    durationInFrames: fps * 1.6,
  });
  const opacity = interpolate(quoteEnter, [0, 1], [0, 1]);
  const ty = interpolate(quoteEnter, [0, 1], [18, 0]);

  const attrEnter = spring({
    frame: frame - 70,
    fps,
    config: { damping: 200, stiffness: 80 },
    durationInFrames: fps * 1.0,
  });
  const attrOp = interpolate(attrEnter, [0, 1], [0, 0.85]);

  const markEnter = spring({
    frame: frame - 12,
    fps,
    config: { damping: 200, stiffness: 80 },
    durationInFrames: fps * 0.8,
  });
  const markOp = interpolate(markEnter, [0, 1], [0, 0.5]);

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <KenBurnsBackground
        src={slide.bg_image ? staticFile(slide.bg_image) : undefined}
        zoomFrom={1.05}
        zoomTo={1.12}
        fallbackTone="dark"
        imageTrack={slide.image_track}
        lineTimings={slide.section_timing}
      />
      {slide.section_audio ? <Audio src={staticFile(slide.section_audio)} /> : null}
      <FilmGrain opacity={0.07} />
      <VignettePulse intensity={0.43} />
      <LetterboxBars height={72} />

      {/* Big opening quote mark */}
      <div
        style={{
          position: "absolute",
          top: 130,
          left: 240,
          fontSize: 220,
          color: ACCENT_TEXT,
          fontFamily: "Georgia, 'Noto Serif CJK JP', serif",
          fontWeight: 700,
          opacity: markOp,
          lineHeight: 0.6,
        }}
      >
        “
      </div>

      {/* Quote text */}
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          padding: "0 220px",
        }}
      >
        <div
          style={{
            opacity,
            transform: `translateY(${ty}px)`,
            color: FOREGROUND_LIGHT,
            fontFamily: "'Noto Serif CJK JP', serif",
            fontWeight: 600,
            fontSize: 76,
            lineHeight: 1.45,
            letterSpacing: 4,
            textAlign: "center",
            textShadow: "0 2px 16px rgba(0,0,0,0.7)",
          }}
        >
          {text}
        </div>
        {attribution ? (
          <div
            style={{
              marginTop: 50,
              opacity: attrOp,
              color: "#bdbdbd",
              fontFamily: "'Noto Sans CJK JP', sans-serif",
              fontSize: 30,
              letterSpacing: 10,
              display: "flex",
              alignItems: "center",
              gap: 18,
            }}
          >
            <span style={{ width: 60, height: 1, background: "#7a7a7a" }} />
            <span>{attribution}</span>
            <span style={{ width: 60, height: 1, background: "#7a7a7a" }} />
          </div>
        ) : null}
      </AbsoluteFill>

      {/* Closing quote mark */}
      <div
        style={{
          position: "absolute",
          bottom: 280,
          right: 240,
          fontSize: 220,
          color: ACCENT_TEXT,
          fontFamily: "Georgia, 'Noto Serif CJK JP', serif",
          fontWeight: 700,
          opacity: markOp,
          lineHeight: 0.6,
        }}
      >
        ”
      </div>

      <CentralLayer centralTrack={slide.central_track} lineTimings={slide.section_timing} />
      <SubtitleBand lines={slide.lines} totalFrames={totalFrames} lineTimings={slide.section_timing} />
    </AbsoluteFill>
  );
};
