# Phase2939 — Fully Explicit Typed Runtime Scanner Operations

## Scope

This phase audits and models the runtime path that forms the upstream CLI manifest. It does **not** claim that implementation changes or tests have been completed. The starting point is the Phase2938 workspace archive.

## Main finding

The route source-read problem was already modeled elsewhere in upstream, but the Laravel route scanner does not consume that contract:

- `packages/core/src/types/upstream/phpSourceFrontendInterface.ts` already defines `PhpSourceText`, `PhpSourceDocument`, `PhpSourceDocumentReaderInterface`, `PhpSourceDocumentReadResult`, blocker ADTs, and read-operation settlement/batch ADTs.
- `packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts` wires an implementation of `PhpSourceDocumentReaderInterface` and maps filesystem failures to typed blockers.
- `packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts` still calls `fs.promises.readFile(file, 'utf-8')` directly, then tokenizes and parses the text. This bypasses the existing source-read contract on the route-manifest path.
- `LaravelRouteScanOutcome` has missing-source, policy, and response blocker variants, but no explicit route-source-read blocker variant. A failed route file read therefore rejects the Promise chain rather than returning a route scan judgment that can be propagated to AST and manifest.

The root cause is not a lack of generic read abstractions. It is a missing connection between an existing upstream source-read ADT and the route scanner's result contract.

## Runtime trace

```text
CLI scan / sync
  -> RouteSyncCliManifestScanOperationInterface
  -> ControllerInvocationManifestCompositionAuthorityInterface
  -> ManifestBuilderOperationPreparationInterface.prepare
  -> ManifestBuilderInterface.build
  -> LaravelSourceAstPipelineInterface.execute
  -> LaravelRouteScannerInterface.prepare / execute
  -> source selection intent + observation judgment
  -> read selected route source files
  -> LaravelSourceLexer.tokenize / parseRouteDeclarations
  -> route declaration evidence + semantic composition
  -> LaravelRouteScanOutcome
  -> LaravelSourceAstProjectionJudgment
  -> CompleteSourceModelBuildResult
  -> ManifestBuilderJudgment
  -> CLI manifest projection/output
```

## Required model

1. **Reuse `PhpSourceDocumentReaderInterface` and its existing ADTs.** Do not create a second generic source-read result type.
2. Route scanning should receive a reader capability through its existing explicit authority/factory wiring. It should not own platform `readFile` semantics.
3. The source-read result's domain operation should bind a successful document to the requested `SourceFile`, or preserve a blocked read with its existing typed blocker.
4. The route scanner must map a blocked route read to a route-domain blocker that preserves the exact `SourceFile` and `PhpSourceDocumentReadBlocker`. This needs a new variant only because `LaravelRouteScanOutcome` currently has no suitable read-blocked arm; document this contract gap before introducing it.
5. `LaravelSourceAstProjectionJudgmentData` must preserve that exact route-read blocker as a blocked AST judgment. The existing AST continuation then carries it to `ManifestBuilderJudgment`; CLI must not convert it to an empty route list or successful manifest.
6. The parser should receive source text only through the complete read path. The blocked path must not invoke tokenization or route declaration parsing.
7. Keep runtime exports interface-first (`export const operation: ExistingInterface = Object.freeze({...})`) where a suitable contract exists. Do not bulk-rewrite unrelated exports without caller/API analysis.
8. Keep `packages/core/src/types/upstream/collections.ts` empty.

## ADT operation ownership

The source-read result already has `continueWith`, and its blocker variants have domain continuation operations. The route-specific blocker should also own a route-domain continuation operation so downstream consumers do not need to reconstruct behavior from primitive filesystem error codes. Node error-code interpretation belongs at the filesystem adapter boundary; domain consumers should receive the existing blocker ADT.

The goal is not to hide every branch behind a helper. The goal is to ensure that each decision is made by the domain contract that owns its meaning and that the exact blocker evidence survives every boundary.

## Implementation order

- P0: Inject the existing source reader into route-scanner runtime wiring.
- P0: Add the route-read blocker arm to `LaravelRouteScanOutcome` and preserve it in the AST projection union.
- P1: Add regression tests for missing, unreadable, and unexpected/rejected reads; assert that the lexer/parser is not invoked on blocked reads.
- P1: Trace blocker propagation through source model, manifest builder, and CLI terminal output.
- P2: Audit all runtime exports in the full repository, separately counting exported function declarations and interface-typed const operations.
- P3: Run project typecheck, unit tests, build, and CLI end-to-end in an environment with the project's declared toolchain and dependencies.

## Verification status

This is a structural audit/model artifact. It does not change runtime source code and does not claim tests, typecheck, build, or CLI end-to-end pass. The audit script records the existing integration gap and verifies that the collections file remains empty.
