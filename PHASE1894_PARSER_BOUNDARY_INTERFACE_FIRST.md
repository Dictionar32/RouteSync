# Phase 1894 — Parser Boundary Interface First

## Trace finding

The canonical parser entry accepts `LaravelControllerInvocationSemanticJudgmentInterface`, but it delegates to `parseControllerDeclaration`, whose signature separately accepts `filePath` and `InvocationPhpSourceIntegratedResponse`. That legacy helper also supplies a synthetic `not_connected` default. This is a semantic escape hatch: callers can represent source identity and integrated response independently, even though the canonical judgment already correlates them.

## Interface correction

The existing `LaravelControllerSemanticBoundaryContract` in `laravelControllerScannerInterface.ts` advances to v61 and explicitly records:

- the independent `filePath` + `integratedResponse` helper as legacy/internal contract debt;
- the source-correlated judgment as the only production parser boundary;
- the synthetic not-connected default as invalid for canonical invocation semantics;
- runtime signature retirement as a later migration gate after all call sites are traced.

No new invocation judgment model, source-subject projection, inventory, or response union is added. The canonical judgment remains the single semantic authority.

## Runtime boundary

No parser, producer, invocation authority, inventory authority, or scanner implementation is changed. This phase records the required interface boundary only; it does not claim the legacy escape hatch has been removed. `semantic/foundation` remains unused.

## Verification

The new static audit checks the interface declaration, existing legacy signature, producer judgment ownership, unchanged parser/scanner implementation hashes, and absence of parallel V2 types. TypeScript compilation and full build are not run in this environment.
