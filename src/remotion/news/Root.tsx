import {Composition} from 'remotion';
import {TemplateDemo} from './TemplateDemo';
import {NewsFlexible, NewsFlexibleProps} from './NewsFlexible';

const FALLBACK_DURATION_SEC = 170;

// Remotion requires props to extend Record<string,unknown>; cast through unknown
const NewsFlexibleComp = NewsFlexible as unknown as React.FC<Record<string, unknown>>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const calculateMetadata = ({props}: {props: any}) => {
  const dur = props?.script?.duration_sec || props?.config?.duration_sec || FALLBACK_DURATION_SEC;
  return {durationInFrames: Math.max(60, Math.round(dur * 30))};
};

const defaultProps4 = {
  config: {} as unknown,
  script: {duration_sec: FALLBACK_DURATION_SEC, lines: []},
} as Record<string, unknown>;
const defaultProps5 = {
  config: {} as unknown,
  script: {duration_sec: FALLBACK_DURATION_SEC, lines: []},
} as Record<string, unknown>;
const defaultProps6 = {
  config: {} as unknown,
  script: {duration_sec: FALLBACK_DURATION_SEC, lines: []},
} as Record<string, unknown>;

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="TemplateDemo"
        component={TemplateDemo}
        durationInFrames={900}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="News4Topic"
        component={NewsFlexibleComp}
        durationInFrames={Math.round(FALLBACK_DURATION_SEC * 30)}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={defaultProps4}
        calculateMetadata={calculateMetadata}
      />
      <Composition
        id="News5Topic"
        component={NewsFlexibleComp}
        durationInFrames={Math.round(FALLBACK_DURATION_SEC * 30)}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={defaultProps5}
        calculateMetadata={calculateMetadata}
      />
      <Composition
        id="News6Topic"
        component={NewsFlexibleComp}
        durationInFrames={Math.round(FALLBACK_DURATION_SEC * 30)}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={defaultProps6}
        calculateMetadata={calculateMetadata}
      />
    </>
  );
};
