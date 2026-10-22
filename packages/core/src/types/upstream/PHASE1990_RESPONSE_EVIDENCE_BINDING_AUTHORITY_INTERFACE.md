# Phase 1990 — Response Evidence Source-Binding Authority Interface

## Trace finding

The Phase 1989 contract already models source-binding outcomes (`complete`, `rejected`, and `empty`) and a response semantic authority. The missing upstream contract was the producer boundary that turns a source evidence inventory into that closed source-binding receipt. The production scanner at `packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts` still emits no `responseJudgment`; its current descriptor-derived response object is not yet a source-bound response evidence inventory.

## Interface-first change

Added `LaravelControllerResponseEvidenceSourceBindingInput`, with separate empty and non-empty inventory variants; `LaravelControllerResponseEvidenceSourceBindingJudgmentFromInput`, which constrains empty input to the empty receipt and non-empty input to complete/rejected receipts; and `LaravelControllerResponseEvidenceSourceBindingAuthorityInterface`. The authority must delegate identity comparisons to the existing `LaravelSourceIdentitySemanticsInterface`; it does not own response-product classification. The source-binding contract version is now 4 and states the producer boundary and inventory outcome obligations.

The existing `LaravelControllerInvocationResponseAstContractMap` now includes the response-evidence binding authority as an explicit stage before the response judgment. The new types are exported through `packages/core/src/index.ts`. No runtime scanner, authority implementation, wiring implementation, AST implementation, or subscanner was changed.

## Intended closed chain

`source evidence inventory → response evidence source-binding authority → response semantic judgment authority → controller artifact → invocation/response wiring → AST projection → runtime executor`

The identity authority remains the sole owner of source identity comparison. A non-empty inventory can still produce either a complete or rejected receipt because the type must not predict the identity comparison result from evidence shape alone. An empty inventory can only produce the explicit empty receipt.

## Scope and verification

This phase changes interface/type declarations only. It does not claim that production wiring now emits `responseJudgment`, and does not claim full TypeScript typecheck/build success. Structural audit is provided by `scripts/audits/audit-phase1990-response-evidence-binding-authority-interface.cjs`. Existing `semantic/relations` imports remain in the controller scanner tree; no `semantic/foundation` layer or replacement subscanner is added.
