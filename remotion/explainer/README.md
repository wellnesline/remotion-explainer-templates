# explainer Remotion compositions

解説ドキュメンタリー向け Remotion プロジェクト(scene_type ごとに異なる演出コンポーネント)。

## 設計方針

- **背景**: 生成AI画像(写真風)を Ken Burns で slow zoom
- **オーバーレイ**: scene_type ごとに異なる Remotion コンポーネントを乗せる
- **ベース解像度**: 1920×1080 / 30fps / h264 / yuv420p
- **カラー**: 暗背景 + 明るい前景のサンプル配色(値は `src/theme/ThemeContext.tsx` のテーマトークン。用途に合わせて差し替える)
- **共通効果**: Film Grain + Vignette + Letterbox(強さ・高さは設定値)

## scene_type と対応 component

| scene_type | 担当 component | 用途 |
|---|---|---|
| `title_card` | `scenes/TitleCard.tsx` | フックの大型タイトル表示 |
| `research_citation` | `scenes/ResearchCitation.tsx` | 論文出典バッジ + 著者・年表示 |
| `case_intro` | `scenes/CaseIntro.tsx` | 事例導入 |
| `concept_reveal` / `case_data` / `case_quote` / `mechanism_term` / `summary` / `outro_fade` | `scenes/*.tsx` | 各種演出 |
| その他 | `scenes/Fallback.tsx` | 未実装 scene_type の placeholder |

## ローカル実行

```bash
cd remotion/explainer
npm install
npm run preview   # Remotion Studio (http://localhost:3000)
```

### サンプル(合成スライド)を動画書き出し

```bash
npm run render:mvp     # → out/mvp.mp4
```

`src/slides_mvp.json` / `src/slides_full.json` は **合成データ(synthetic sample)** です。実際の台本・題材は含みません。
自分のスライドを使うには、環境変数 `REMOTION_SLIDES_DIR` に `slides_full.json` のあるディレクトリを指定します。

## ファイル構成

```
remotion/explainer/
├── package.json
├── tsconfig.json
├── remotion.config.ts
├── README.md
└── src/
    ├── index.ts                      # registerRoot
    ├── Root.tsx                      # Composition 登録
    ├── MainVideo.tsx                 # スライド配列を順次再生する compose
    ├── types.ts                      # Slide / SceneType 型
    ├── slides_mvp.json               # 合成サンプル(2スライド)
    ├── slides_full.json              # 合成サンプル(2スライド)
    ├── components/
    └── scenes/
```

## データソース

スライド JSON は `types.ts` の `SlidesPayload` 形式。背景画像・音声は `public/images/` `public/audio/` に配置します(生成工程は非同梱)。
