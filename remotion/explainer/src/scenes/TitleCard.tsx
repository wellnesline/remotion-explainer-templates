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
export const TitleCard: React.FC<Props> = ({ slide, durationFrames }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const totalFrames = durationFrames ?? durationInFrames;

  const titleEnter = spring({
    frame: frame - 20,
    fps,
    config: { damping: 200, stiffness: 60 },
    durationInFrames: fps * 1.6,
  });
  const titleOpacity = interpolate(titleEnter, [0, 1], [0, 1]);
  const titleScale = interpolate(titleEnter, [0, 1], [0.92, 1]);

  const subEnter = spring({
    frame: frame - 60,
    fps,
    config: { damping: 200, stiffness: 80 },
    durationInFrames: fps * 1.2,
  });
  const subOpacity = interpolate(subEnter, [0, 1], [0, 1]);
  const subTranslate = interpolate(subEnter, [0, 1], [12, 0]);

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <KenBurnsBackground
        src={slide.bg_image ? staticFile(slide.bg_image) : undefined}
        zoomFrom={1.04}
        zoomTo={1.16}
        fallbackTone="deep_teal"
        imageTrack={slide.image_track}
        lineTimings={slide.section_timing}
      />
      {slide.section_audio ? <Audio src={staticFile(slide.section_audio)} /> : null}
      <FilmGrain opacity={0.07} />
      <VignettePulse intensity={0.35} />
      <LetterboxBars height={76} />
      {/* Static title removed — CentralLayer kinetic_keyword handles title display. */}
      {/* Suppress unused vars */}
      <span style={{ display: "none" }}>{titleOpacity}{titleScale}{subOpacity}{subTranslate}{ACCENT}</span>
      <CentralLayer centralTrack={slide.central_track} lineTimings={slide.section_timing} />
      <SubtitleBand lines={slide.lines} totalFrames={totalFrames} lineTimings={slide.section_timing} />
    </AbsoluteFill>
  );
};
