# Phase 3051 — Upstream → CLI → Manifest Deleted-Foundation Import Frontier

## Result

This phase is a runtime-path audit, not a claim that the import migration is complete. It found a critical mismatch: the forbidden/deleted generic relation modules remain absent, while source files on the PHP semantic producer/validation route still import those module paths. The audit records the concrete import frontier so the next implementation can migrate each operation to the domain that owns it instead of restoring or recreating the generic foundation.

## Real path traced

1. `packages/cli/src/manifestScanOperationInterface.ts` — CLI manifest scan operation.
2. `packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts` — manifest composition authority.
3. `packages/core/src/compiler/frontend/php/routeAst/semanticKnowledgeDataFlowProducer.ts` — producer interface.
4. `packages/core/src/compiler/frontend/php/routeAst/phpAstSemanticKnowledgeDataFlowAdapter.ts` — actual PHP AST → semantic knowledge construction.
5. `packages/core/src/compiler/frontend/php/routeAst/semanticKnowledgeDataFlowRelations.ts` — compatibility/validation facade.
6. `packages/core/src/compiler/relational/sequence.ts` — compiler sequence facade, which itself imports from the deleted relation foundation.

## Critical finding

The three forbidden modules remain absent:

- `packages/core/src/semantic/relations/relationMembership.ts`
- `packages/core/src/semantic/relations/relationalSequence.ts`
- `packages/core/src/semantic/relations/semanticRelations.ts`

But the active runtime source still contains imports into these paths. Therefore, the current source tree cannot honestly be described as fully migrated or proven build-clean on this route. The fix is **not** to restore those modules, add kernel re-exports, or create a generic replacement. Migrate each consumer according to its domain ownership and keep one source of truth.

## Explicit interface target

The target shape remains a named contract with an explicit operation, assigned as a typed exported object:

```ts
export interface SemanticDomainOperationInterface {
  readonly continueForDomainOutcome: (outcome: SemanticDomainOutcome) => SemanticDomainContinuation;
}

export const semanticDomainOperation: SemanticDomainOperationInterface = Object.freeze({
  continueForDomainOutcome: outcome => /* domain-owned continuation */,
});
```

This is an illustrative shape only; it must not be pasted as a generic universal operation. The actual interface and outcome type must belong to the concrete consumer domain.

## Laravel and TypeScript modeling implication

Laravel route declarations expose domain evidence such as URI parameters, named routes, controller actions, and route-model binding. RouteSync should preserve those as typed semantic evidence through the producer and manifest boundary rather than treating framework knowledge as arbitrary control-flow branches. TypeScript interfaces name contracts, while discriminated unions represent a closed set of outcomes; neither feature alone eliminates runtime branching, so claims must be backed by source and test evidence.

## Next migration order

1. Remove stale deleted-foundation imports from the real PHP semantic producer/validator path by migrating operations into already-existing domain interfaces.
2. Preserve source spans, evidence providers, fact IDs, provenance, and blocker outcomes.
3. Re-audit the `upstream → CLI → manifest` path after each migration.
4. Run strict TypeScript on the affected dependency closure and a CLI-to-manifest integration test.
5. Only claim completion when the runtime path no longer imports the deleted foundation and tests actually pass.

## Verification boundary

The Phase 3051 audit harness verifies the path anchors, confirms the forbidden modules are absent, and enumerates stale imports. It does not certify a clean TypeScript build or a successful end-to-end manifest run; the stale imports are the blocking finding.
