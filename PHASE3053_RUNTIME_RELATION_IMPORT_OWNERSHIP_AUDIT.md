# Phase 3053 — Runtime relation import ownership audit

## Scope
Trace the PHP semantic evidence producer into the CLI manifest path and identify remaining imports whose target modules are intentionally absent. This phase does not restore the removed generic relation foundation.

## Runtime path
`packages/cli/src/manifestScanOperationInterface.ts` → controller invocation manifest composition → PHP semantic producer/adapter → semantic evidence relation compiler and relation store → upstream semantic knowledge/manifest preparation.

## Findings

| Consumer | Remaining dependency | Domain responsibility to migrate |
|---|---|---|
| `packages/core/src/compiler/frontend/php/routeAst/phpAstSemanticKnowledgeDataFlowAdapter.ts` | `relationalSequence`, `semanticRelations`, `semanticRelationalCollections` facade | PHP AST fact construction, semantic catalog resolution, and flow emission |
| `packages/core/src/compiler/frontend/php/routeAst/semanticEvidenceRelationCompiler.ts` | `relationMembership`, `semanticRelations`, `relationalSequence`, collection facade | Projection of source-backed semantic facts to theory facts and duplicate theory-fact suppression |
| `packages/core/src/compiler/frontend/php/routeAst/semanticVersionedStateDataFlowRelations.ts` | `relationalSequence`, collection facade | Versioned semantic state / reaching-definition domain operations |
| `packages/core/src/compiler/frontend/php/routeAst/semanticRelationStore.ts` | `relationalSequence`, `relationMembership`, collection facade | Semantic relation tuple store and its bucket/containment operations |
| `packages/core/src/compiler/relational/sequence.ts` | `relationalSequence` | Broad generic sequence/option algebra; must not be rebuilt as another generic relation foundation |

## Implementation decision
Do not perform a mechanical rename or recreate `relationMembership`, `relationalSequence`, `semanticRelations`, or `semanticRelationalCollections` under another path. Migrate consumers by domain ownership. In particular, the evidence compiler must own theory-fact projection and canonical duplicate handling; the versioned-state analyzer must own state-version lookup/merge; the relation store must own tuple-store operations. Generic sequence helpers require a separate dependency inventory before replacement because they have broad downstream consumers.

## Type/interface direction
Use explicit named operation contracts and exported frozen objects for each domain. Each operation should return a typed outcome when the caller needs to continue the runtime path. Reserve `void` for operations whose only contract is a side effect. Keep source span, source identity, provenance, evidence, and blocker facts in the typed model.

## Laravel evidence requirements
The source model must preserve route URI parameters, controller actions, implicit/explicit route-model binding, and resource-route semantics. Laravel's official routing documentation describes controller actions and route model binding as distinct runtime semantics; RouteSync should model those as source-backed facts instead of reconstructing them downstream: https://laravel.com/framework/docs/routing.

## Honest status
This phase is an ownership audit, not a claim that the remaining imports have been migrated. The direct foundation imports remain in the listed consumers. Full repository typecheck and CLI-to-manifest E2E must remain marked unverified until those imports and their transitive dependencies are migrated.
