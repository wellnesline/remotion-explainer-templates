import React from "react";
import {
  Audio,
  AbsoluteFill,
  interpolate,
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

export const OutroFade: React.FC<Props> = ({ slide, durationFrames }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const totalFrames = durationFrames ?? durationInFrames;

  // Final fade-to-black over last 60 frames
  const fadeOutFrames = Math.min(60, Math.floor(totalFrames * 0.25));
  const fadeOutStart = totalFrames - fadeOutFrames;
  const fadeOut = interpolate(
    frame,
    [fadeOutStart, totalFrames],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <KenBurnsBackground
        src={slide.bg_image ? staticFile(slide.bg_image) : undefined}
        zoomFrom={1.04}
        zoomTo={1.20}
        fallbackTone="dark"
        imageTrack={slide.image_track}
        lineTimings={slide.section_timing}
      />
      {slide.section_audio ? <Audio src={staticFile(slide.section_audio)} /> : null}
      <FilmGrain opacity={0.07} />
      <VignettePulse intensity={0.5} pulse />
      <LetterboxBars height={104} />
      {/* Static closing title removed — CentralLayer kinetic_keyword
          handles closing in central_track. Avoids overlap with kinetic + silhouette + subtitle. */}
      <CentralLayer centralTrack={slide.central_track} lineTimings={slide.section_timing} />
      <SubtitleBand lines={slide.lines} totalFrames={totalFrames} lineTimings={slide.section_timing} />
      {/* Final fade to black overlay */}
      <AbsoluteFill style={{ background: "#000", opacity: fadeOut, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};
