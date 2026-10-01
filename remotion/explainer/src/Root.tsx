import React from "react";
import { Composition } from "remotion";
import { MainVideo, computeTotalFrames } from "./MainVideo";
import slidesMvpRaw from "./slides_mvp.json";
import slidesFullRaw from "./slides_full.json";
import { Slide, SlidesPayload } from "./types";
import { TitleCard } from "./scenes/TitleCard";
import { ResearchCitation } from "./scenes/ResearchCitation";
import { CaseIntro } from "./scenes/CaseIntro";
import { Fallback } from "./scenes/Fallback";
import { ThemeProvider, resolveTheme } from "./theme/ThemeContext";
import { applyTheme } from "./components/CentralLayer";
import { ShortsMainVideo, computeShortsTotalFrames } from "./ShortsMainVideo";

// round 3.1: env-based slug 切替対応
// REMOTION_SLIDES_DIR が set されれば外部 path から動的読込、
// 未 set なら src/ 同梱の fallback (preview / 後方互換用)。
//
// 実装方針: `calculateMetadata` を将来導入する場合の foundation として、
// Node 起動時の env を読んで slides を解決する。
// 現状は require() で外部 path を読む(webpack の require は静的解析できないため
// __non_webpack_require__ 相当の path-based require が必要だが、
// remotion render は Node で bundler 経由のため eval 経路で実行可能).
// 安定動作確認まで段階的に切替、 fallback として静的 import を残す。
function loadSlides(): SlidesPayload {
  const dir = process.env.REMOTION_SLIDES_DIR;
  if (dir) {
    try {
      // Node-side eval (remotion render は webpack バンドル後 Node で実行)
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const path = require("path");
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const fs = require("fs");
      const slidesPath = path.isAbsolute(dir)
        ? path.join(dir, "slides_full.json")
        : path.resolve(process.cwd(), dir, "slides_full.json");
      if (fs.existsSync(slidesPath)) {
        const raw = fs.readFileSync(slidesPath, "utf-8");
        return JSON.parse(raw) as SlidesPayload;
      }
      // env set だが file 無し → 警告して fallback
      // eslint-disable-next-line no-console
      console.warn(
        `[Root.tsx] REMOTION_SLIDES_DIR=${dir} 但し slides_full.json 不在、 src/slides_full.json fallback`,
      );
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn(`[Root.tsx] dynamic slides load 失敗: ${e}; fallback to src/slides_full.json`);
    }
  }
  return slidesFullRaw as unknown as SlidesPayload;
}

const slidesMvp = slidesMvpRaw as unknown as SlidesPayload;
const slidesFull = loadSlides();

// 暫定の theme 切替: bundle 初回 eval 時に design_template を CentralLayer に通知
// 完全 token 化までの繋ぎ。 KineticKeyword は useTheme 経由で別解決。
applyTheme((slidesFull as { design_template?: string }).design_template);

const mvpTotalFrames = Math.max(120, computeTotalFrames(slidesMvp));
const fullTotalFrames = Math.max(120, computeTotalFrames(slidesFull));

const firstSlide = (() => {
  for (const s of slidesMvp.slides) {
    if (typeof s === "object") return s as Slide;
  }
  throw new Error("slides_mvp.json に slide オブジェクトが見つからない");
})();

const SingleSceneRouter: React.FC<{ slide: Slide }> = ({ slide }) => {
  switch (slide.scene_type) {
    case "title_card":
      return <TitleCard slide={slide} />;
    case "research_citation":
      return <ResearchCitation slide={slide} />;
    case "case_intro":
      return <CaseIntro slide={slide} />;
    default:
      return <Fallback slide={slide} />;
  }
};

// round 3.1: ThemeProvider で MainVideo / SingleSceneRouter をラップ
const ThemedMainVideo: React.FC<{ payload: SlidesPayload }> = ({ payload }) => {
  const theme = resolveTheme((payload as { design_template?: string }).design_template);
  return (
    <ThemeProvider value={theme}>
      <MainVideo payload={payload} />
    </ThemeProvider>
  );
};

const ThemedSingleScene: React.FC<{ slide: Slide }> = ({ slide }) => {
  // SingleScene は slug 共通 default (documentary_serious)
  return (
    <ThemeProvider>
      <SingleSceneRouter slide={slide} />
    </ThemeProvider>
  );
};

// Shorts プロトタイプ用 (1080×1920 縦型)
const ThemedShortsVideo: React.FC<{ payload: SlidesPayload }> = ({ payload }) => {
  const theme = resolveTheme((payload as { design_template?: string }).design_template);
  return (
    <ThemeProvider value={theme}>
      <ShortsMainVideo payload={payload} />
    </ThemeProvider>
  );
};
const shortsTotalFrames = Math.max(120, computeShortsTotalFrames(slidesFull));

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="FullVideo"
        component={ThemedMainVideo}
        durationInFrames={fullTotalFrames}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{ payload: slidesFull }}
      />
      <Composition
        id="MvpSequence"
        component={ThemedMainVideo}
        durationInFrames={mvpTotalFrames}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{ payload: slidesMvp }}
      />
      <Composition
        id="SingleScene"
        component={ThemedSingleScene}
        durationInFrames={180}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{ slide: firstSlide }}
      />
      <Composition
        id="ShortsVideo"
        component={ThemedShortsVideo}
        durationInFrames={shortsTotalFrames}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ payload: slidesFull }}
      />
    </>
  );
};
