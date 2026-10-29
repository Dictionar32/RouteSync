# Phase 2793 — Existing-Contract-First Runtime Scanner and CLI Manifest Trace

## Governing rule

Before introducing any typed interface or ADT, inspect `packages/core/src/types/upstream` and the current runtime wiring. Reuse or evolve an existing contract when it already owns the responsibility. A new contract is permitted only after a concrete contract-gap is recorded. This phase adds **no new interface or ADT**.

## Existing contracts found and their actual boundaries

| Existing contract | Responsibility / use in the runtime path | Do not duplicate it with |
|---|---|---|
| `PhpAstExpressionSemanticAuthorityInterface<Evidence>` (`phpAstExpressionSemanticAuthorityInterface.ts`) | Upstream-owned authority for deriving the closed semantic `Expression` ADT from PHP AST evidence | Another top-level PHP-AST-to-expression authority or a second complete/blocked wrapper around `Expression` |
| `ExpressionFromPhpAstOperationInterface<SyntaxEvidence>` (`expressionProducerInterface.ts`) | `project({ syntax, sourceFile })` operation for converting syntax evidence into `Expression` | A parallel top-level expression projection operation with the same input/output semantics |
| `ResourceAstExpressionMappingOperationInterface<SyntaxValue>` and `ResourceAstExpressionMappingAuthorityInterface<SyntaxValue>` (`resourceAstExpressionMappingInterface.ts`) | Resource-specific expression mapping and authority | A generic replacement that erases the resource domain boundary |
| `ScannerExpressionOperatorInterface` (`scannerExpressionOperatorInterface.ts`) | Operator resolution under an explicit operator contract | A new generic operator resolver that duplicates precedence/associativity ownership |
| `LaravelSourceAstPipelineInterface` (`laravelSourceAstPipelineInterface.ts`) | Prepared source-AST execution with explicit input/dependencies and a `LaravelSourceAstProjectionJudgment` result | A second scanner-pipeline execution contract or synthetic scan status ADT |
| `ManifestBuilderOperationPreparationInterface` and `ManifestBuilderInterface` (`manifestBuilderInterface.ts`) | Preparation and execution of the existing manifest builder; retains `ManifestBuilderJudgment` complete/blocked arms | Another manifest-builder interface or another complete/blocked result wrapper |

## Runtime trace: CLI to upstream manifest

```text
packages/cli/src/commands/scan.ts / sync.ts
  -> injected composition.manifestScanOperation
  -> controller-invocation manifest composition
  -> ManifestBuilderOperationPreparationInterface.prepare(ManifestBuilderInput)
  -> ManifestBuilderInterface.build()
  -> LaravelSourceAstPipelineInterface.execute()
  -> LaravelSourceAstProjectionJudgment
       ├─ complete -> CompleteSourceAst / source-model construction
       └─ blocked  -> preserve exact source-AST blocker
  -> source-model judgment
       ├─ complete -> manifest surface operations
       └─ blocked  -> ManifestBuilderJudgment(stage: source_model)
  -> ManifestBuilderJudgment
       ├─ manifest_builder_complete -> canonical RouteSyncManifest
       └─ manifest_builder_blocked  -> preserve stage and blocker
  -> CLI manifest projection / validation / serialization
```

The active contract is the existing `LaravelSourceAstProjectionJudgment`; do not substitute a speculative `SourceScanJudgment` unless the runtime path is actually migrated to it. Empty output, missing evidence, and blocked judgments are not interchangeable.

## AST mapping operation review — no unsupported claim of contract reuse

The current low-level files `phpAstExpressionMappings.ts` and `phpAstExpressionClosure.ts` expose frozen, interface-typed operation objects. Their local helper interfaces describe a collection of lower-level syntax mapping methods, which is not identical in shape to the existing upstream authority contracts above. The existing upstream contracts cover the *top-level authority/operation*, not necessarily each helper method. Therefore:

1. Keep the existing upstream authority as owner of the final PHP AST → semantic `Expression` operation.
2. Before moving or expanding the helper interfaces, trace all consumers and determine whether the helper surface is a legitimate internal implementation detail of that authority or a genuine reusable upstream capability.
3. Do not move scanner-owned syntax types into `types/upstream`; upstream contracts should not depend on concrete scanner/frontend implementation types. If a reusable contract gap is demonstrated, express evidence generically and document the gap before adding a new upstream contract.
4. Do not create a parallel top-level authority merely to make a `switch` disappear. Exhaustive switches that eliminate a closed ADT inside its owning implementation may remain; switches that duplicate domain policy in callers should be moved behind the existing owning operation.
5. Do not claim all `switch` statements are wrong. Audit ownership and exhaustiveness, not just syntax.

## Interface-first runtime shape

For an existing contract, the desired implementation shape is:

```ts
export const existingOperation: ExistingOperationInterface = Object.freeze({
  execute: (input: ExistingInput): ExistingJudgment => {
    // Domain implementation; exhaustive ADT handling where appropriate.
  },
});
```

Use the real contract and real ADT from `types/upstream`; the names above are illustrative. Do not add a second result ADT if the existing result already fully represents the domain outcome. Do not export `function name(parameter: Parameter)` as the public runtime entry when the existing operation contract calls for an interface-typed object. Private helper functions may remain private implementation details.

## Verification boundary

Run `npm run audit:phase2793-existing-contract-first-runtime-scanner`. This is a source-structure/contract-inventory audit only. It does not prove a full TypeScript typecheck, build, unit/integration test suite, or real CLI scan/sync end-to-end behavior. Those checks must be reported separately after actually running them.

`packages/core/src/types/upstream/collections.ts` must remain 0 bytes. No collection wrapper or reasoning primitive is introduced by this phase.
