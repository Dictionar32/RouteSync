# Phase 3003 — Fully Explicit Upstream Domain Continuations and Runtime Trace

## Scope

This phase continues from Phase 3002 and makes two targeted changes on the controller dataflow / invocation-publication runtime path:

1. Replaces the exported parameterized `createControllerDataflowSemanticJudgmentAuthority(dependencies)` factory with `controllerDataflowSemanticJudgmentAuthorityFactory: ControllerDataflowSemanticJudgmentAuthorityFactoryInterface`.
2. Turns `InvocationSemanticCoveragePublicationResult` into an operational ADT. Both `validated-publication` and `rejected-publication` carry `continueWith(...)`, which routes to a typed handler without requiring consumers to branch on `kind` themselves.

This is a focused migration, not a claim that every exported arrow function in the repository has already been converted.

## Changed files

- `packages/core/src/types/upstream/controllerDataflowSemanticJudgmentAuthorityInterface.ts`
  - Adds the typed dependency contract and factory interface.
- `packages/core/src/types/upstream/controllerDataflowSemanticJudgmentAuthority.ts`
  - Adds `controllerDataflowSemanticJudgmentAuthorityFactory` using `export const name: Interface = Object.freeze({...})`.
  - Production singleton is constructed through the same factory.
  - Removes the old exported parameterized factory.
- `packages/core/src/types/upstream/index.ts`
  - Exports the new runtime operation.
- `packages/core/src/types/upstream/invocationSemanticPipelineInterface.ts`
  - Adds named base contracts for validated/rejected publication outcomes and typed `continueWith` handlers.
- `packages/core/src/types/upstream/invocationSemanticCoveragePublicationAuthority.ts`
  - Both authority-issued outcomes attach the continuation operation while preserving the original publication/analysis/violation references.
- `packages/core/src/compiler/scanner/__test__/ecommerceShopDataflowPhase104.spec.ts`
  - Uses the publication ADT's continuation operation rather than reclassifying the outcome with `switch`/ternary logic.
  - Reads `.response.publication`, matching the integrated response aggregate's declared structure.
- `scripts/audits/audit-phase3003-upstream-domain-continuations.cjs`
  - Repeatable structural audit.

## Runtime trace: upstream → scanner → invocation result

```text
Source-correlated controller input
  ├─ canonical source identity
  ├─ invocation judgment
  ├─ semantic knowledge projection
  └─ statement payload evidence
        ↓
controllerDataflowSemanticJudgmentAuthorityFactory.create(...)
        ↓
controllerDataflowSemanticJudgmentAuthority.derive(...)
        ↓
invocationSemanticIntegratedResponseComposition.integrate(...)
        ├─ inventory.inspectKnowledge(canonical knowledge)
        ├─ pipeline.analyzeKnowledge(the same knowledge reference)
        └─ publicationAuthority.publish({ inventory, analysis })
                ↓
InvocationSemanticCoveragePublicationResult ADT
  ├─ validated-publication.continueWith({ onValidated, onRejected })
  └─ rejected-publication.continueWith({ onValidated, onRejected })
        ↓
Integrated response preserves exact publication result and PHP source-pipeline outcome
        ↓
Controller dataflow judgment → scanner-facing controller body result
```

The publication authority remains the single owner of inventory/analysis correspondence validation. The continuation operation does not re-run validation, rebuild the ledger, or change the analysis. A rejected result retains its non-empty typed violation tuple.

## Example usage

```ts
const analysis = publicationResult.continueWith({
  onValidated: validated => validated.validation.analysis,
  onRejected: rejected => rejected.analysis,
});
```

This example is applied in the focused scanner dataflow test. The consumer asks the ADT to continue the domain result instead of checking `kind` and recreating the decision at the call site.

## Export migration audit

The old `createControllerDataflowSemanticJudgmentAuthority` export was removed from its implementation module and replaced with the typed factory operation. The production singleton and upstream barrel now use/export the new operation.

No `export function` declaration exists in the two changed runtime authority modules. This is a local audit only: it does not establish that every exported function or inferred arrow in every runtime-reachable module across the repository has been migrated. A broader call-graph inventory remains necessary.

## Upstream → CLI → manifest boundary

This phase strengthens the upstream invocation-publication boundary, which is one input into the controller dataflow scanner path. It does not close the previously identified field-by-field provenance bridge between route manifest schema evidence and CLI invocation manifest. That remains an explicit open item; no schema owner or duplicate knowledge graph is introduced here.

## Laravel/PHP source semantics checked

The official Laravel routing documentation distinguishes closure routes from controller-action routes and documents route parameter/dependency-injection behavior. The controller documentation explains controller methods as request-handling entrypoints. RouteSync should preserve these source-derived distinctions upstream and pass typed evidence downstream, rather than making the CLI infer controller meaning from primitive strings. References: https://laravel.com/framework/docs/routing and https://laravel.com/framework/docs/12.x/controllers.

## Constraints preserved

- `packages/core/src/types/upstream/collections.ts` remains intentionally empty.
- `packages/core/src/semantic/relations/relationMembership.ts` remains absent.
- `packages/core/src/semantic/relations/relationalSequence.ts` remains absent.
- `packages/core/src/semantic/relations/semanticRelations.ts` remains absent.
- No replacement relation foundation was added.

## Verification

- Structural audit: 17/17 checks passed.
- TypeScript syntax transpilation: 6 changed files, zero syntax diagnostics.
- Full TypeScript typecheck: blocked by workspace/toolchain configuration. Global `tsc` reports missing global standard library types, missing `node` and `vitest/globals` type definitions, and unsupported `target`/`lib` values in the current root `tsconfig.json` for that global compiler. This is not a passing typecheck.
- Vitest and CLI end-to-end tests were not run.

## Next steps

1. Repair or align the TypeScript toolchain and dependency installation, then run full typecheck.
2. Run the focused scanner dataflow test and add tests for both `continueWith` branches, including reference identity for the original analysis and violation ledger.
3. Continue tracing schema provenance field-by-field from route boundary through route manifest, IR, and CLI invocation manifest.
4. Build a call-graph-based inventory of remaining reachable `export function` and unannotated exported arrow operations, and migrate only where an existing domain interface is the right owner.
5. Audit data-only upstream ADTs and add meaningful domain continuations where they allow consumers to follow a semantic result without reclassifying primitive discriminants.
