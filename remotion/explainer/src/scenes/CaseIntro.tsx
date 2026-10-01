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

export const CaseIntro: React.FC<Props> = ({ slide, durationFrames }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const totalFrames = durationFrames ?? durationInFrames;

  const labelEnter = spring({
    frame: frame - 12,
    fps,
    config: { damping: 200, stiffness: 80 },
    durationInFrames: fps * 0.9,
  });
  const labelOpacity = interpolate(labelEnter, [0, 1], [0, 1]);
  const labelTranslate = interpolate(labelEnter, [0, 1], [-20, 0]);

  const c = slide.case;

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
      <VignettePulse intensity={0.25} />
      <LetterboxBars height={64} />

      {/* Static "CASE STUDY 事例 N" big block removed — CentralLayer spotlight_reveal handles. */}
      <span style={{ display: "none" }}>{labelOpacity}{labelTranslate}{c?.label}{ACCENT}{ACCENT_TEXT}{FOREGROUND_LIGHT}</span>

      <LowerThird
        primary={c ? `${c.subject} ${c.age ?? ""}歳` : slide.title}
        secondary={c?.occupation}
        tag="SUBJECT"
        position="left"
        appearAt={28}
      />
      <CentralLayer centralTrack={slide.central_track} lineTimings={slide.section_timing} />
      <SubtitleBand lines={slide.lines} totalFrames={totalFrames} lineTimings={slide.section_timing} />
    </AbsoluteFill>
  );
};
