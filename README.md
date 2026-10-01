# remotion-explainer-templates

Remotion (React) video templates for explainer and news-style videos, plus a Python TTS pipeline that synthesizes narration and verifies it by speech-to-text round trip.

Remotion（React）で作る解説動画・ニュース動画のテンプレート集と、ナレーション合成を音声認識で往復検証する Python パイプラインです。公開用に整理したサンプル実装です。

## 概要

動画を「台本データ（JSON）から描画するテンプレート」にしておくと、題材が変わっても部品を作り直さずに済みます。このリポジトリには、シーン種別ごとの演出コンポーネント、数値を見せるニュース用のグラフ部品、折れ線チャートの図解、そして合成音声の誤読を機械的に検出して直す工程が入っています。

## 主な機能・設計のポイント

- **解説動画テンプレート（`remotion/explainer/`）**: `scene_type` ごとに別コンポーネントを割り当て（タイトル、引用バッジ、事例の導入・データ・引用、概念の提示、まとめ、フェードアウトなど）、未実装の種別は `Fallback` に落とします。背景は Ken Burns、共通効果は Film Grain / Vignette / Letterbox。配色は `ThemeContext` に集約し、1920×1080 / 30fps で出力します。縦型の Shorts 用 `ShortsVideo` もあります。サンプル台本（`slides_*.json`）は合成データです
- **ニュース用テンプレート（`src/remotion/news/`）**: 4 / 5 / 6 トピックの構成（`News4Topic` など）、比較バー・ドーナツ・スパークライン・数値ティッカー・脈動バーなどの部品、`@remotion/transitions` によるシーン切替、ローカルフォント読み込み。バッジ・テロップの文言は `config.labels`、色は `theme.ts` で差し替えます(同梱の値は中立なサンプルです)
- **折れ線チャート図解（`src/remotion/charts/`）**: 折れ線が左から右へ描かれていく図解コンポジション（合成データ）
- **ナレーション合成の自己検証（`tools/_tools/synth_pipeline.py`）**: 表示用の文字（caption）を読み辞書（`kana_dict.yaml`）で読み上げ用の文字（speech）に変換 → ElevenLabs `eleven_v3` で合成 → OpenAI の音声認識で文字起こし → caption / speech との類似度で PASS / WARN / FAIL を判定。FAIL はレポートに残して人のレビュー対象にし、`fix` サブコマンドで該当行だけ再合成します（検証コマンドの自動再合成は既定で無効 = `MAX_RETRIES = 0`。しきい値は定数）。`synth-section` だけは音声の暴走（文字/秒が 3.0 未満）を検出すると seed を変えて最大 4 回再合成します（再合成は従量課金。`--skip-verify` 指定時は行いません）
- **並列実行とエスカレーション（`src/remotion_pipeline/`）**: スラッグ単位で `ProcessPoolExecutor` により並列実行し、エスカレーション（`_escalation.json`）が出たスラッグだけ取り消して他は継続します。ゲート名と次の行動（人のレビュー / 再試行 など）は型で列挙しています

## ディレクトリ構成（主要ファイル）

```
remotion-explainer-templates/
├ remotion/explainer/        解説動画テンプレート（package.json, src/scenes, src/components, src/theme）
├ src/remotion/news/         ニュース用テンプレートとグラフ部品
├ src/remotion/charts/       折れ線チャート図解
├ src/remotion_pipeline/     paths / escalation / orchestrator
├ src/channel_resolver.py  src/_dotenv.py     ← 合成スタブ
└ tools/
   ├ _tools/synth_pipeline.py   合成 + 往復検証
   ├ kana_dict.yaml  voices.yaml   ← 合成サンプル（本番の辞書ではありません）
```

## 動かし方

```bash
cd remotion/explainer
npm install
npm run preview        # Remotion Studio
npm run render:mvp     # 合成サンプルを mp4 に書き出し
```

- 自分の台本を使う場合は、環境変数 `REMOTION_SLIDES_DIR` に `slides_full.json` のあるディレクトリを指定します。背景画像と音声は `public/images/` と `public/audio/` に置きます
- ナレーション合成: `python tools/_tools/synth_pipeline.py verify --audio <mp3> --caption "<文>"` など（サブコマンドは `--help` を参照）。環境変数は `ELEVENLABS_API_KEY`（合成）と `OPENAI_API_KEY`（音声認識による検証）
- `src/remotion/news` と `src/remotion/charts` には独自の `package.json` がありません。`remotion/explainer/package.json` の依存に加えて下記の `@remotion/transitions` が必要です

## 制限事項（閉包）

`ast` と import 文（TypeScript は正規表現）の調査で、リポジトリ内・標準ライブラリ・`package.json` / `requirements.txt` のいずれにも無い import は次の 2 件です。

- **同梱していない Python パッケージ（1 件）**: `yaml`（PyYAML。`requirements.txt` が無いため）
- **同梱していない npm パッケージ（1 件）**: `@remotion/transitions`（`src/remotion/news/NewsFlexible.tsx` が使用。`package.json` に未記載）
- **他の公開リポジトリへの依存**: なし（`news-video-pipeline` リポジトリが `src/remotion/news` を描画エントリとして使います）
- **合成スタブ**: `src/channel_resolver.py`（チャンネルとスラッグからパスを返す最小実装）, `src/_dotenv.py`。`tools/kana_dict.yaml` と `tools/voices.yaml` も合成サンプル（音声 ID はプレースホルダ）です
- **非同梱の実行時データ**: 背景画像、音声ファイル、フォント、実際の台本
- Remotion 自体の利用条件は Remotion のライセンスに従います(一定規模を超える企業の商用利用は有償)
- 外部サービス: ElevenLabs、OpenAI（音声認識）。音声・画像・フォント・楽曲などの素材は、各サービスと素材の利用規約・権利者の許諾の範囲で使ってください

## ライセンス

All rights reserved. 閲覧目的で公開しています。詳細は [LICENSE](LICENSE) を参照。
