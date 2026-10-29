# Phase 2754 — Fully Typed AST/ADT Runtime Export Audit

## Purpose

Phase 2754 extends the prior manifest-builder ADT repair with a TypeScript Compiler API audit of the selected CLI/scanner runtime roots. It parses TypeScript source into AST nodes instead of relying solely on regular expressions to identify exported function declarations and exported arrow/function-expression values.

## Runtime operation change

`packages/core/src/compiler/scanner/wiring/semanticDataflowInputAdapter.ts` now exports `semanticDataflowInputAdapterOperations` with the explicit `SemanticDataflowInputAdapterOperationsInterface`. Adapter construction, input construction, and runtime request creation are grouped as named operations. The analyzer now calls `semanticDataflowInputAdapterOperations.runtimeRequestFromKnowledge(model)`.

## ADT contract

The manifest builder keeps a closed `ManifestBuilderJudgment` union. AST-projection failure and source-model failure retain distinct blocker discriminators and their exact typed evidence. A blocked outcome must not be converted into an empty or complete manifest.

## Trace

CLI command (`scan` / `sync` / drift audit) → upstream composition → controller invocation inventory closure receipt → prepared manifest builder → Laravel source-AST projection → complete source model → dataflow/resource-group projections → `RouteSyncManifest` → CLI consumer. AST/source-model blocked judgments must gate manifest use and publication.

## Audit command

`npm run audit:phase2754-ast-runtime-export-surface`

The audit parses selected runtime roots with the TypeScript Compiler API, reports remaining exported function-shaped declarations, and enforces zero such declarations on the designated critical manifest spine. Findings outside that spine are reported as migration backlog, not silently described as migrated.

## Verification boundaries

The audit is structural and syntax-oriented. Full semantic typecheck, tests, package build, and CLI E2E require project dependencies and are not implied by this audit. The known transitive `semantic/relations` CLI reachability and incomplete independent 34-law verifier remain separate blockers.
