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

export const ConceptReveal: React.FC<Props> = ({ slide, durationFrames }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const totalFrames = durationFrames ?? durationInFrames;

  const concept = slide.concept;
  const keyword = concept?.keyword ?? slide.title;
  const motif = concept?.motif ?? "none";
  const subtitle = concept?.subtitle;

  const titleEnter = spring({
    frame: frame - 18,
    fps,
    config: { damping: 200, stiffness: 70 },
    durationInFrames: fps * 1.4,
  });
  const titleOpacity = interpolate(titleEnter, [0, 1], [0, 1]);
  const titleScale = interpolate(titleEnter, [0, 1], [0.94, 1]);

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <KenBurnsBackground
        src={slide.bg_image ? staticFile(slide.bg_image) : undefined}
        zoomFrom={1.05}
        zoomTo={1.13}
        fallbackTone="dark"
        imageTrack={slide.image_track}
        lineTimings={slide.section_timing}
      />
      {slide.section_audio ? <Audio src={staticFile(slide.section_audio)} /> : null}
      <FilmGrain opacity={0.07} />
      <VignettePulse intensity={0.43} />
      <LetterboxBars height={68} />

      {/* Top CONCEPT tag (small, doesn't conflict with center) */}
      <div
        style={{
          position: "absolute",
          top: 130,
          left: 0,
          right: 0,
          textAlign: "center",
          color: ACCENT_TEXT,
          fontFamily: "'Noto Sans CJK JP','Noto Sans JP', sans-serif",
          fontWeight: 700,
          fontSize: 22,
          letterSpacing: 18,
          opacity: titleOpacity * 0.9,
        }}
      >
        CONCEPT
      </div>
      {/* Static center keyword + Motif removed — CentralLayer takes over center. */}
      <span style={{ display: "none" }}>{keyword}{subtitle}{titleScale}{motif}{FOREGROUND_LIGHT}{ACCENT}</span>
      <CentralLayer centralTrack={slide.central_track} lineTimings={slide.section_timing} />
      <SubtitleBand lines={slide.lines} totalFrames={totalFrames} lineTimings={slide.section_timing} />
    </AbsoluteFill>
  );
};
