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

export const MechanismTerm: React.FC<Props> = ({ slide, durationFrames }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const totalFrames = durationFrames ?? durationInFrames;

  const m = slide.mechanism;
  const term = m?.term ?? slide.title;
  const definition = m?.definition;
  const authors = m?.authors;
  const year = m?.year;

  const tagEnter = spring({
    frame: frame - 6,
    fps,
    config: { damping: 200, stiffness: 90 },
    durationInFrames: fps * 0.7,
  });
  const tagOp = interpolate(tagEnter, [0, 1], [0, 1]);

  const termEnter = spring({
    frame: frame - 18,
    fps,
    config: { damping: 200, stiffness: 60 },
    durationInFrames: fps * 1.5,
  });
  const termOp = interpolate(termEnter, [0, 1], [0, 1]);
  const termScale = interpolate(termEnter, [0, 1], [0.94, 1]);

  const defEnter = spring({
    frame: frame - 60,
    fps,
    config: { damping: 200, stiffness: 80 },
    durationInFrames: fps * 1.0,
  });
  const defOp = interpolate(defEnter, [0, 1], [0, 0.9]);
  const defTy = interpolate(defEnter, [0, 1], [12, 0]);

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <KenBurnsBackground
        src={slide.bg_image ? staticFile(slide.bg_image) : undefined}
        zoomFrom={1.05}
        zoomTo={1.12}
        fallbackTone="midnight_blue"
        imageTrack={slide.image_track}
        lineTimings={slide.section_timing}
      />
      {slide.section_audio ? <Audio src={staticFile(slide.section_audio)} /> : null}
      <FilmGrain opacity={0.07} />
      <VignettePulse intensity={0.35} />
      <LetterboxBars height={68} />

      {/* MECHANISM tag */}
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
          letterSpacing: 22,
          opacity: tagOp,
        }}
      >
        MECHANISM
      </div>

      {/* Static term/def/authors center block removed — CentralLayer kinetic_keyword + brain_network handle. */}
      <span style={{ display: "none" }}>
        {term}{definition}{authors}{year}{termOp}{termScale}{defOp}{defTy}{FOREGROUND_LIGHT}{ACCENT}
      </span>

      <CentralLayer centralTrack={slide.central_track} lineTimings={slide.section_timing} />
      <SubtitleBand lines={slide.lines} totalFrames={totalFrames} lineTimings={slide.section_timing} />
    </AbsoluteFill>
  );
};
