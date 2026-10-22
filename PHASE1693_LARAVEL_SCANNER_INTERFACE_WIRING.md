# Phase 1693 — Laravel Source AST Scanner Interface Wiring

## Scope

Introduced `LaravelSourceAstScannerInterface` in `packages/core/src/types/upstream/laravelSourceAstScannerInterface.ts` as the typed boundary for Laravel source AST acquisition. The scanner orchestrator now exposes `laravelSourceAstScanner`, and `wiring/upstreamManifestBuilder.ts` consumes that interface instead of calling the scanner function directly. The legacy `scanSourceAsts` function remains as a compatibility entry point.

## Architectural intent

`LaravelSourceAstScannerInterface` defines the scanner execution contract. It does not become the semantic authority: Laravel domain judgments, schema/migration semantics, route/controller binding, and other semantic decisions must remain owned by their respective upstream authorities. Scanner orchestration should coordinate evidence producers and pass their products onward.

## Static verification

- PASS — interface is declared and exported from `types/upstream/index.ts`.
- PASS — scanner implementation is typed against the interface.
- PASS — manifest builder consumes `laravelSourceAstScanner.scan`.
- PASS — compatibility entry point remains.
- BLOCKED — `npm run build`: `tsdown: not found` because dependencies are not installed in this workspace.

## Remaining work

This phase is a wiring-boundary improvement, not proof that all semantic reasoning has been removed from scanner/subscanner code. Follow-up audit should trace `sourceAstScanner.ts`, `LaravelSourceLexer.ts`, domain subscanners, `schemaProducer`, `queryProducer`, and their upstream authority interfaces. Each remaining inference/classification decision must be moved to or delegated through its canonical semantic authority before the scanner can be called a thin executor end-to-end.
