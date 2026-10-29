# Phase 3016 — Fully Explicit Simplicity Typed Runtime Scanner Operations

## Objective

Continue the RouteSync upstream/scanner runtime audit by making route-projection output an explicit operational ADT. The projection result must not merely carry route-derived facts: it must expose a domain operation that tells downstream code how to continue with those facts.

## Changed files

1. `packages/core/src/types/upstream/semanticDataflowRouteProjection.ts`
2. `packages/core/src/types/upstream/semanticDataflowInputFactory.ts`

## Implementation

### Route projection result ADT

Added:

- `SemanticDataflowRouteProjectionHandlers<Result>`
- `SemanticDataflowRouteProjectionResult`
- the `continueWith(handlers)` domain continuation on the result

The result carries the canonical route projection facts and offers a typed continuation:

```ts
export interface SemanticDataflowRouteProjectionResult {
  readonly kind: 'semantic_dataflow_route_projection_result';
  readonly facts: readonly SemanticDataflowInputFact[];
  readonly continueWith: <Result>(
    handlers: SemanticDataflowRouteProjectionHandlers<Result>,
  ) => Result;
}
```

The projection implementation is now private (`projectRouteParameterFactsFromSourceModel` and `projectRouteParameterFacts`). The previous directly exported callable `semanticDataflowRouteParameterFacts` was removed. Runtime consumers get the explicitly typed `semanticDataflowRouteProjectionAuthority` instead:

```ts
export const semanticDataflowRouteProjectionAuthority:
  SemanticDataflowRouteProjectionAuthorityInterface = Object.freeze({
    kind: 'semantic_dataflow_route_projection_authority',
    project: projectRouteParameterFacts,
  });
```

### Runtime use

`semanticDataflowInputFactory.ts` now consumes route projection through the ADT operation:

```ts
projections.route.project(sourceModel, controller).continueWith({
  onProjected: routeFacts => routeFacts,
})
```

This keeps the semantic projection behind its authority interface and makes the continuation step visible at the call site. The already-produced immutable facts array is passed through without creating a second semantic fact collection.

## Provenance and runtime trace

The inspected path is:

1. `semanticDataflowInputAdapter` translates scanner-local semantic knowledge to canonical upstream input evidence.
2. `semanticDataflowInputProducer` composes canonical dataflow seed inputs.
3. Its `controllerSeed` calls `semanticDataflowRouteProjectionAuthority.project(sourceModel, controller)`.
4. Route projection matches Laravel route controller/action identity against the controller contract.
5. Route parameters are matched to controller route-parameter inputs; proven model bindings can additionally produce a route-parameter-to-model-parameter flow.
6. Each produced fact retains source-span-based identities and is marked with route lineage by `semanticDataflowFactLineageOperations.withLineage`.
7. The projection result's `continueWith` operation passes the existing fact collection to the canonical input producer.

The route parameter and controller parameter are not merged into a string-only lookup result. The flow retains source and target identities and route lineage. This phase does not change the underlying route matching or model-binding rules.

## Audit results

- Structural audit: **8/8 checks passed** (`PHASE3016_AUDIT.json`).
- Syntax transpilation: **2 changed TypeScript files, 0 syntax diagnostics** (`PHASE3016_SYNTAX_CHECK.json`).
- Targeted TypeScript typecheck: **not clean**. It is blocked by known workspace baseline issues including missing relation foundation modules, `collections.ts` being whitespace-only, and resulting inference errors. Full output is in `PHASE3016_TYPECHECK.log`.
- Unit tests and Laravel CLI end-to-end tests were not run.

## Workspace constraints preserved

- `packages/core/src/types/upstream/collections.ts` remains one newline byte.
- The removed relation foundation files remain absent:
  - `packages/core/src/semantic/relations/relationMembership.ts`
  - `packages/core/src/semantic/relations/relationalSequence.ts`
  - `packages/core/src/semantic/relations/semanticRelations.ts`
- No kernel re-exports were restored to point at the removed files.

## Scope boundary / next step

Phase 3016 closes one concrete upstream semantic projection boundary. It does **not** claim that every `export function`, inferred exported arrow, primitive branch, or manifest field across the whole repository has been migrated or audited. The next phase should continue along the actual scanner-to-CLI/manifest call graph, inventory exported callables at each reachable boundary, and trace every manifest field back to its source evidence before changing more code.

## Official documentation consulted

- Laravel Routing: https://laravel.com/framework/docs/routing — route parameters, controller actions, dependency injection, and route-model binding are distinct semantics that upstream must preserve.
- PHP Type Declarations: https://www.php.net/manual/en/language.types.declarations.php — type declarations constrain values at call boundaries, but type annotations alone do not establish data provenance or semantic correctness.
