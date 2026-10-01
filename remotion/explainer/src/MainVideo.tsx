import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { Slide, SlidesPayload } from "./types";
import { TitleCard } from "./scenes/TitleCard";
import { ResearchCitation } from "./scenes/ResearchCitation";
import { CaseIntro } from "./scenes/CaseIntro";
import { ConceptReveal } from "./scenes/ConceptReveal";
import { CaseData } from "./scenes/CaseData";
import { CaseQuote } from "./scenes/CaseQuote";
import { MechanismTerm } from "./scenes/MechanismTerm";
import { Summary } from "./scenes/Summary";
import { OutroFade } from "./scenes/OutroFade";
import { Fallback } from "./scenes/Fallback";

const FPS = 30;
const DEFAULT_SLIDE_SEC = 6;

const sceneRouter = (slide: Slide, durationFrames: number) => {
  switch (slide.scene_type) {
    case "title_card":
      return <TitleCard slide={slide} durationFrames={durationFrames} />;
    case "research_citation":
      return <ResearchCitation slide={slide} durationFrames={durationFrames} />;
    case "concept_reveal":
      return <ConceptReveal slide={slide} durationFrames={durationFrames} />;
    case "case_intro":
      return <CaseIntro slide={slide} durationFrames={durationFrames} />;
    case "case_data":
      return <CaseData slide={slide} durationFrames={durationFrames} />;
    case "case_quote":
      return <CaseQuote slide={slide} durationFrames={durationFrames} />;
    case "mechanism_term":
      return <MechanismTerm slide={slide} durationFrames={durationFrames} />;
    case "summary":
      return <Summary slide={slide} durationFrames={durationFrames} />;
    case "outro_fade":
      return <OutroFade slide={slide} durationFrames={durationFrames} />;
    default:
      return <Fallback slide={slide} durationFrames={durationFrames} />;
  }
};

type Props = {
  payload: SlidesPayload;
};

export const MainVideo: React.FC<Props> = ({ payload }) => {
  const slidesOnly = payload.slides.filter((s): s is Slide => typeof s === "object");

  let cursor = 0;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {slidesOnly.map((slide, idx) => {
        const dur = Math.round((slide.duration_sec ?? DEFAULT_SLIDE_SEC) * FPS);
        const from = cursor;
        cursor += dur;
        return (
          <Sequence key={`${idx}-${slide.title}`} from={from} durationInFrames={dur}>
            {sceneRouter(slide, dur)}
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

export const computeTotalFrames = (payload: SlidesPayload): number => {
  const slidesOnly = payload.slides.filter((s): s is Slide => typeof s === "object");
  return slidesOnly.reduce(
    (acc, s) => acc + Math.round((s.duration_sec ?? DEFAULT_SLIDE_SEC) * FPS),
    0
  );
};
