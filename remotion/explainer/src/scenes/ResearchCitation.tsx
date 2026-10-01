import React from "react";
import {
  Audio, AbsoluteFill, staticFile, useVideoConfig } from "remotion";
import { Slide } from "../types";
import { KenBurnsBackground } from "../components/KenBurnsBackground";
import { FilmGrain } from "../components/FilmGrain";
import { VignettePulse } from "../components/VignettePulse";
import { LetterboxBars } from "../components/LetterboxBars";
import { CitationBadge } from "../components/CitationBadge";
import { SubtitleBand } from "../components/SubtitleBand";
import { CentralLayer } from "../components/CentralLayer";

type Props = { slide: Slide; durationFrames?: number };

export const ResearchCitation: React.FC<Props> = ({ slide, durationFrames }) => {
  const c = slide.citation;
  const { durationInFrames } = useVideoConfig();
  const totalFrames = durationFrames ?? durationInFrames;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <KenBurnsBackground
        src={slide.bg_image ? staticFile(slide.bg_image) : undefined}
        zoomFrom={1.06}
        zoomTo={1.14}
        fallbackTone="midnight_blue"
        imageTrack={slide.image_track}
        lineTimings={slide.section_timing}
      />
      {slide.section_audio ? <Audio src={staticFile(slide.section_audio)} /> : null}
      <FilmGrain opacity={0.07} />
      <VignettePulse intensity={0.27} />
      <LetterboxBars height={60} />
      {/* ResearchDiagram (static center) removed — CentralLayer takes over center. */}
      {c ? (
        <CitationBadge
          authors={c.authors}
          year={c.year}
          publication={c.publication}
          label={c.label || "RESEARCH"}
        />
      ) : null}
      {/* LowerThird removed — caused "下のレイヤー" clutter under particle_explosion. */}
      <CentralLayer centralTrack={slide.central_track} lineTimings={slide.section_timing} />
      <SubtitleBand lines={slide.lines} totalFrames={totalFrames} lineTimings={slide.section_timing} />
    </AbsoluteFill>
  );
};
