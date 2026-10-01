import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { Slide, SlidesPayload } from "./types";
import { ShortsScene } from "./ShortsScene";

const FPS = 30;
const DEFAULT_SLIDE_SEC = 6;

type Props = { payload: SlidesPayload };

// Shorts プロトタイプ
// 1080×1920 縦型 Composition 用の MainVideo。
// 全 scene を ShortsScene (minimal vertical layout) で render。

export const ShortsMainVideo: React.FC<Props> = ({ payload }) => {
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
            <ShortsScene slide={slide} durationFrames={dur} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

export const computeShortsTotalFrames = (payload: SlidesPayload): number => {
  const slidesOnly = payload.slides.filter((s): s is Slide => typeof s === "object");
  return slidesOnly.reduce(
    (acc, s) => acc + Math.round((s.duration_sec ?? DEFAULT_SLIDE_SEC) * FPS),
    0
  );
};
