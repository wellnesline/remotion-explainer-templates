/**
 * localFont.ts — Noto Sans JP を public/fonts からローカル読み込みする。
 *
 * ★なぜ @remotion/google-fonts をやめたか
 *   従来は `loadFont('normal', {weights: ['400','700','900']})` を使っていたが、
 *   subsets を渡していなかったため NotoSansJP.mjs:46 の
 *     const subsets = options?.subsets ?? Object.keys(meta.fonts[style][weight]);
 *   が効いて 124 subsets 全部を取りに行き、3 x 124 = 372 本の delayRender が立っていた
 *   (Noto Sans JP の日本語グリフが unicode-range で 120 分割されているため)。
 *   フォント側の猶予は同 :64 で 60 秒あるが、フレーム待ちは既定 30 秒
 *   (seek-to-frame.js:45 が +3000 して 33 秒) しかないため、
 *   ネットワークが少しでも遅れるとフレーム側が先に諦めて
 *     TimeoutError: waiting for the page to render the React component at frame N
 *   になることがある。
 *   しかも同 :28 のとおり、subsets 未指定は Remotion v5 では例外になる。
 *
 *   可変フォント 1 本をローカルから読めば、ネットワークリクエストは 0 になり、
 *   この失敗の系統がまるごと消える。
 *
 * ★可変フォントを選んだ理由
 *   手元の静的フォントは 400 と 700 しか無いが、実際のコードは
 *   900 を 56 箇所、800 を 9 箇所、600 を 3 箇所で使っている
 *   (800/600 は従来 3 ウェイトしか読んでいなかったので効いていなかった)。
 *   NotoSansJP[wght].ttf は wght 軸 100-900 を連続で持つので 1 本で足りる。
 *
 * ライセンス: SIL Open Font License 1.1 (public/fonts/OFL.txt)
 */
import {continueRender, delayRender, staticFile} from 'remotion';

export const fontFamily = 'Noto Sans JP';

// 可変フォントの既定インスタンスは Thin(100) なので、
// @font-face 側で 100-900 の範囲を宣言して CSS の font-weight で選ばせる。
const WEIGHT_RANGE = '100 900';

let loadPromise: Promise<void> | null = null;

/**
 * Noto Sans JP を読み込み、fontFamily 名を返す。
 *
 * モジュールスコープから呼ぶ想定 (従来の loadFont と同じ使い方)。
 * 複数モジュールから呼ばれても実際の読み込みは 1 回だけ行う。
 */
export const loadLocalNotoSansJP = (): string => {
	// SSR/バンドル解析時など document が無い文脈では何もしない。
	if (typeof document === 'undefined' || typeof FontFace === 'undefined') {
		return fontFamily;
	}

	if (loadPromise) {
		return fontFamily;
	}

	const handle = delayRender('Loading Noto Sans JP (local variable font)');

	const face = new FontFace(
		fontFamily,
		`url(${staticFile('fonts/NotoSansJP-VF.ttf')}) format('truetype')`,
		{weight: WEIGHT_RANGE},
	);

	loadPromise = face
		.load()
		.then((loaded) => {
			document.fonts.add(loaded);
			continueRender(handle);
		})
		.catch((err) => {
			// 握り潰すと字が豆腐のまま無言で描画されてしまう。
			// continueRender してからレンダリングを失敗させる。
			continueRender(handle);
			throw err;
		});

	return fontFamily;
};
