/**
 * Remotion entry point — registerRoot を呼ぶ。
 * `npx remotion render src/remotion/news/index.ts <comp> <out> --props='...'` で使用。
 */
import {registerRoot} from 'remotion';
import {Root} from './Root';

registerRoot(Root);
