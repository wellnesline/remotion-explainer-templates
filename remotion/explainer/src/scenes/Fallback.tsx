import React from "react";
import {
  Audio, AbsoluteFill, staticFile, useVideoConfig } from "remotion";
import { Slide } from "../types";
import { KenBurnsBackground } from "../components/KenBurnsBackground";
import { FilmGrain } from "../components/FilmGrain";
import { VignettePulse } from "../components/VignettePulse";
import { LetterboxBars } from "../components/LetterboxBars";
import { LowerThird } from "../components/LowerThird";
import { SubtitleBand } from "../components/SubtitleBand";
import { CentralLayer } from "../components/CentralLayer";

type Props = { slide: Slide; durationFrames?: number };

const FOREGROUND_LIGHT = "#F0F0F0";

export const Fallback: React.FC<Props> = ({ slide, durationFrames }) => {
  const { durationInFrames } = useVideoConfig();
  const totalFrames = durationFrames ?? durationInFrames;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <KenBurnsBackground
        src={slide.bg_image ? staticFile(slide.bg_image) : undefined}
        fallbackTone="dark"
        imageTrack={slide.image_track}
        lineTimings={slide.section_timing}
      />
      {slide.section_audio ? <Audio src={staticFile(slide.section_audio)} /> : null}
      <FilmGrain opacity={0.07} />
      <VignettePulse intensity={0.27} />
      <LetterboxBars height={60} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
            fontFamily: "'Noto Serif CJK JP','Noto Serif JP', serif",
            fontSize: 88,
            fontWeight: 700,
            color: FOREGROUND_LIGHT,
            textAlign: "center",
            padding: "0 120px",
            textShadow: "0 4px 30px rgba(0,0,0,0.85)",
          }}
        >
          {slide.title}
        </div>
      </AbsoluteFill>
      <LowerThird
        primary={slide.scene_type}
        tag="SCENE TYPE (TBD)"
        position="right"
        appearAt={20}
      />
      <CentralLayer centralTrack={slide.central_track} lineTimings={slide.section_timing} />
      <SubtitleBand lines={slide.lines} totalFrames={totalFrames} lineTimings={slide.section_timing} />
    </AbsoluteFill>
  );
};
