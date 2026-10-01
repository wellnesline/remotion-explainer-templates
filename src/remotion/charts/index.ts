/**
 * 解説アニメ Remotion entry point。
 * `npx remotion render src/remotion/charts/index.ts <comp> <out>` で使用。
 */
import {registerRoot} from 'remotion';
import {Root} from './Root';

registerRoot(Root);
