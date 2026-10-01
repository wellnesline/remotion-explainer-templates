"""remotion_pipeline — Remotion 系 ch 共通の制作パイプラインモジュール。

multi-channel 基盤。

モジュール:
- paths.py: ch + slug → 各種 path 解決
- escalation.py: _escalation.json 出力ヘルパ
- orchestrator.py: 並列実行 (ProcessPoolExecutor + escalation cancel)
- central_planner.py: D1-script (deterministic central_plan.json 生成、 実装予定)
- merge_central.py: D2 出力 (_central/*.json) を slides_full.json に merge (実装予定)
- qa_text.py: A1-A9 + U1-U7 text-level QA (実装予定)
- qa_visual.py: V1-V9 visual-level QA (実装予定)
- render.py: F 3-step オーケストレーション (実装予定)
"""
