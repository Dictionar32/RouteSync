# Phase 2423 — RequestType Interface-First Execution Blocker

## Result

The requested production cutover is **blocked by missing canonical route-occurrence evidence**. This phase does not fabricate a proof-backed judgment from the legacy `RequestType[]` result and does not claim the CLI path is fixed.

## Reproduced source facts

- `compiler/scanner/wiring/routeManifestTypeLowering.ts` invokes `requestTypeDerivationProjectionPipeline.derive(...)` directly.
- `compiler/semantic/request-type-derivation/requestTypeDerivationProjectionPipeline.ts` invokes the legacy derivation context/group aggregation path.
- `requestTypeDerivationInterface.ts` requires route occurrence evidence and has laws requiring pairwise-distinct source locations and occurrence keys matching source coordinates.
- `RouteSemanticFlow.provenance` currently exposes `sourceFile`, `sourceLine`, and `uri` only.
- The route scanner already has the exact `SourceSpan` while constructing each `RouteAst` from `declaration.source.startOffset` and `declaration.end.endOffset`, but that span is not propagated into the `RouteSemanticFlow` provenance consumed by RequestType derivation.
- The Phase2421 assembler composes existing reasoning, verifier, decision, and authority interfaces, but the repository has no production implementations composed for this request-type path.
- `routeManifestTypeLoweringAuthority.ts` exposes an injected authority-backed path, but it is not the active lowering path.

## Why the wiring cannot be honestly completed yet

The active route source path discards a span that is available at the scanner boundary. For two declarations on the same line, file + line + URI cannot prove distinct source occurrences. Building occurrence keys from array order, object identity, or a guessed offset would contradict the upstream contract. Likewise, wrapping the legacy solver's bare `RequestType[]` in a `derivation_verified` judgment would fabricate evidence, verified-law coverage, and closure.

## Required fix order

1. Evolve the existing route provenance/boundary contract to retain the original `SourceSpan` from the route declaration AST.
2. Propagate that exact span through the route scanner's boundary-to-flow composition without reconstructing it from line numbers.
3. Change RequestType route occurrence location/key contracts to use the canonical span coordinates and update evidence inventory, collision witnesses, and law verification.
4. Implement concrete production reasoning and proof-verification capabilities against the existing law ADT; use the existing decision, authority, and assembler contracts.
5. Compose the capabilities at the production composition root and inject that pipeline into the active manifest lowering path.
6. Make the active path preserve all non-projectable outcomes through CLI; remove legacy fallback only after behavior and consumer contracts are migrated.
7. Add same-line duplicate declaration regressions, then run targeted tests, typecheck, package build, and real CLI checks.

## Validation status

- Source inspection: performed against the supplied Phase2422 repository snapshot.
- Official technical reference reviewed: TypeScript Handbook, discriminated unions and exhaustive checking: https://www.typescriptlang.org/docs/handbook/2/narrowing.html
- Production source changes: none in this phase; the required source-span migration crosses the route provenance producer, boundary contract, flow construction, and proof laws and cannot be safely replaced by a local type-only change.
- Typecheck, Vitest, package build, and CLI: not run. The ZIP has no installed `node_modules`, and this work environment is not the user's configured Arch workspace.

## Completion gate

Do not mark RequestType interface-first cutover complete until a test proves that same-line duplicate route declarations receive distinct canonical span-based occurrence keys, the proof verifier accepts valid evidence and rejects forged/missing evidence, and the CLI active path uses the assembled authority-backed pipeline with no semantic fallback.
