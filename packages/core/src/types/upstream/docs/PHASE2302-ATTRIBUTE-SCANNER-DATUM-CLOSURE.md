# Phase 2302 — Laravel Attribute Scanner Datum Closure

## Goal

Close the existing `LaravelAttributeScannerInterface` contract through the implementation, pipeline, manifest boundary, and controller consumer. This phase evolves the existing interface in place; it does not add a parallel scanner interface or a generic authority wrapper.

## Contract decision

The scanner receives `SourceProjectIdentity`. Its scan policy is fixed to `app/Attributes`, so `LaravelAttributeScanScope` is evidence of the scope actually inspected, not a caller-selected semantic decision. Contract version advances from v17 to v18 because discovery failure outcomes now distinguish an unreadable project root and a missing attribute scope from other discovery failures, and the implementation now publishes the v18 result shape.

## Datum path

`scan` / `sync` → controller invocation inventory receipt → `constructRouteSyncManifest` → `laravelSourceAstPipeline.execute` → `LaravelAttributeScannerInterface.scan(sourceProject)` → `scanLaravelAttributes` → per-file AST and contextuality evidence → `LaravelAttributeScanDiscoveryReceipt` + `LaravelContextualAttributeInventory` → controller scanner → complete Source AST → manifest.

## Changes

- Moved the production attribute scanner implementation to `packages/core/src/compiler/scanner/laravelAttributeScanner.ts` and wired the pipeline directly to that implementation.
- Moved the attribute producer implementation to `packages/core/src/compiler/scanner/attributeProducer.ts`; it returns `AttributeProducerJudgment` and models a missing constructor as a typed blocker instead of throwing.
- Left the old subscanner files without implementations rather than deleting them.
- The complete judgment publishes one source-ordered `LaravelAttributeScannedFileSequence`; each node binds the enumerated source file to its AST and contextuality evidence.
- The contextual declaration inventory uses the existing recursive `LaravelContextualAttributeDeclarationSequence` ADT and includes the canonical scan scope.
- A missing `app/Attributes` directory is blocked rather than silently treated as a successful empty scan. Root missing/unreadable, scope missing/unreadable, nested directory unreadable, source-file unreadable, parse failure, unresolved PHP names, and missing constructor are represented by typed failures.
- The pipeline projects ASTs directly from the receipt's file sequence into `SourceDiscovery`; it no longer reads `attributeScan.attributes` or re-pairs ASTs with a parallel source-path array.
- The controller scanner consumes the contextual declaration sequence, and the manifest builder formats every blocker variant instead of assuming every blocker contains `source` and `resolution` fields.
- Updated structural-parser call-site provenance and the existing producer tests to point at the new scanner/producer owners.
- No imports of `semantic/foundation` or `semantic/relations` were added to the new scanner and producer files.

## Verification

- TypeScript syntax/transpilation diagnostics: passed for the changed TypeScript files using `transpileModule`.
- Source trace checks: no production references remain to `scanAttributeAsts`, `attributeScan.attributes`, or the old `subscanners/attributeAstCanonical` / `subscanners/attributeProducer` implementations.
- Full TypeScript typecheck and build were not run. Syntax transpilation is not a substitute for semantic typechecking.

## Explicit residuals

- The producer delegates PHP expression and closure-body lowering to existing helpers. `resolveClosureBody` still has its own `semantic/relations` dependency, so this phase does not claim that the entire transitive PHP syntax-lowering graph is relation-free.
- The CLI still relies on the existing source-AST pipeline and other scanner implementations. This phase closes the attribute scanner path only; it does not claim that every CLI scanner has been converted to a pure interface executor.
- Full semantic typechecking and runtime fixture execution remain required before treating the phase as fully validated.
