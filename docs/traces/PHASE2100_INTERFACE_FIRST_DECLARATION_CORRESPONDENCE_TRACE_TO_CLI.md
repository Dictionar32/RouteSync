# Phase 2100 — Interface-First Declaration Correspondence Trace to CLI

## Scope

This phase starts from Phase 2099. It changes one semantic boundary: controller declaration selections are now paired with their declaration evidence by the upstream authority's explicit one-to-one, input-order correspondence contract. It does not claim that `semantic/relations`, `semantic/foundation`, or `subscanners` have been removed.

## Production path traced

```text
packages/cli/src/commands/scan.ts
  -> packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts
  -> packages/cli/src/parsers/php/sourceInvocationPipeline.ts
  -> @routesync/core invocation pipeline and inventory authorities
  -> packages/core/src/compiler/scanner/orchestrator/upstreamManifestScanner.ts
  -> packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts
  -> packages/core/src/compiler/scanner/orchestrator/sourceAstScanner.ts
  -> packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts
       -> ModelScanner / FormRequestScanner / query and schema producers
       -> laravelControllerScanner
       -> laravelResourceScanner
       -> laravelRouteScanner
       -> response/service/middleware/DTO/provider/attribute/channel producers
  -> CompleteLaravelSourceModel and semantic data-flow stages
  -> RouteSync manifest and CLI projections
  -> routesync.manifest.json, routesync.graph.json,
     routesync.dataflow.json, routesync.dataflow.ir.json, routesync.ir.json
```

The `scan` command invokes `buildManifestWithInvocationPipeline`; the CLI composition discovers controller PHP files and obtains an authority-validated invocation inventory receipt. The core manifest builder consumes that receipt and calls the source AST scanner. The source AST pipeline calls the controller, resource, and route scanners, then assembles the source AST projection consumed downstream.

## Root issue fixed

Before this phase, `laravelControllerScanner.ts` matched a declaration selection back to the parsed declaration using `declarationSemanticSelections.find(...)` and `laravelSourceIdentitySemantics.relateSourceFiles(...)`. That duplicated a source-correlation operation downstream after the declaration authority had already produced one result for each candidate.

The authority implementation produces selections through `input.map(candidate => ...)`, preserving one result per candidate and preserving each candidate's source identity. The contract did not previously state that correspondence as a public invariant.

## Interface-first change

### Canonical contract

`packages/core/src/types/upstream/controllerDeclarationSemanticJudgmentInterface.ts`

Added:

```ts
readonly selectionCorrespondence:
  'one-output-per-input-in-input-order-with-source-identity-preserved';
```

The contract documents total, positional correspondence and requires consumers not to rediscover the pair using basenames or a second relation.

### Authority implementation

`packages/core/src/types/upstream/controllerDeclarationSemanticJudgmentAuthority.ts`

The existing authority now exposes the exact declared correspondence value. It continues to own declaration/action/ancestry judgments; this phase does not create a parallel authority.

### Scanner executor

`packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts`

- Pairs parsed declarations with selections at the same inventory position before entering the action/response/AST execution fold.
- Removes the `relateSourceFiles(...).find(...)` lookup and its `laravelSourceIdentitySemantics` import from this scanner.
- Retains an explicit invariant error if an output is missing despite the total-correspondence contract.
- Bumps scanner contract version from 28 to 29 to reflect the changed contract surface.

## Findings that remain open

A static import trace of `packages/core/src` reports:

| Dependency | Importing files | Status |
|---|---:|---|
| `semantic/relations` | 379 | Still broadly connected |
| `subscanners` | 24 | Still connected to production paths |
| Direct `semantic/foundation` imports | 0 | No direct import path detected; this alone does not prove every foundation file is dead |

`laravelControllerScanner.ts` still imports relation primitives for sequence folds/projections and subscanner implementations including `scanControllerAction`, `controllerProducer`, AST canonical helpers, and source reading. The source AST pipeline still imports several subscanners and relation helpers. The CLI consumes `@routesync/core` and its manifest/dataflow projections.

Therefore this phase does **not** delete or retire relation, foundation, or subscanner. It removes one redundant identity-correlation lookup from one scanner boundary only.

## Verification

- `scripts/audits/audit-phase2100-controller-declaration-correspondence.cjs`: 12/12 static checks passed.
- TypeScript build/typecheck and Vitest were not run.
- The audit verifies source-contract structure and import-presence/non-removal claims; it is not a runtime proof or compiler typecheck.

## Next interface-first target

Define a canonical controller action execution input/output judgment contract that consumes the already-selected method judgment, invocation judgment, and source identity without making the scanner import `scanControllerAction` directly. Then migrate the consumer and only retire the subscanner after all callers are moved. Continue with response integration and AST projection, then route/resource consumers, then relation helpers across core and CLI. Delete old layers only after a fresh full-path trace shows no production imports or public re-exports remain.
