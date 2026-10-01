/**
 * 解説アニメ用 Remotion Root。
 * 各 diagram を Composition として登録。800×450 (16:9) で出力。
 */
import {Composition} from 'remotion';
import {ZigzagChart} from './ZigzagChart';

const DURATION_SEC = 25; // 表示時間(秒)

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="DiagZigzagChart"
        component={ZigzagChart}
        durationInFrames={Math.round(DURATION_SEC * 30)}
        fps={30}
        width={800}
        height={450}
      />
    </>
  );
};
