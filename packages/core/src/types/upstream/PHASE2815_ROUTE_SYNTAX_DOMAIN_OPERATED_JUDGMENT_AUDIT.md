# Phase 2815 — Route Syntax Domain-Operated Judgment

## Scope

This phase tightens the Laravel route-syntax semantic fact boundary. It reuses the existing `RouteSyntaxSemanticFact` algebra and `RouteSyntaxSemanticJudgment` contract in `semanticRouteSyntaxRelations.ts`; it does not add a parallel upstream contract or a generic reasoning primitive.

## Root cause addressed

Previously, `routeSyntaxSemanticInterface.ts` derived each proof relation by searching a tuple table keyed by `fact.kind`, with `syntax_observes_invocation` as a fallback. That meant the consumer owned fact-to-proof policy and an unrecognized future fact could silently be mislabeled as an invocation fact. The relation belongs to the fact variant itself.

Each fact variant now provides the domain operation `continueForProofRelation`, which explicitly selects its route-syntax proof relation. Proof projection delegates to that operation. This is a route-syntax-specific continuation, not a universal visitor or reasoning abstraction.

## Interface-first runtime factory

The former exported `routeSyntaxSemanticJudgment(cursor, method)` arrow function is now the private implementation `createRouteSyntaxSemanticJudgment` behind:

```ts
export interface RouteSyntaxSemanticJudgmentFactoryInterface {
  readonly create: (cursor: TokenCursor, method: LaravelRouteMethod) => RouteSyntaxSemanticJudgment;
}

export const routeSyntaxSemanticJudgmentFactory: RouteSyntaxSemanticJudgmentFactoryInterface = Object.freeze({
  create: (cursor, method) => createRouteSyntaxSemanticJudgment(cursor, method),
});
```

The production caller now uses `routeSyntaxSemanticJudgmentFactory.create(cursor, method)`.

## Runtime trace

```text
CLI scan.ts / sync.ts
  -> manifestScanOperation.scan(input)
  -> controller invocation manifest composition
  -> manifest request-resolution preflight
  -> PHP route scanner / route AST syntax adapter
  -> routeSyntaxSemanticInterfaceAt(cursor, method)
  -> routeSyntaxSemanticJudgmentFactory.create(cursor, method)
  -> RouteSyntaxSemanticJudgment with domain-operated RouteSyntaxSemanticFact values
  -> each fact.continueForProofRelation(...)
  -> RouteSyntaxSemanticProof[]
  -> route semantic interface / route projection
  -> manifest projection, validation, serialization and persistence
```

This phase changes the route-syntax judgment/proof boundary only. It does not claim that the entire CLI-to-manifest path has been E2E verified.

## Contract audit

- Reuses the existing route syntax judgment and fact ADT.
- Does not create a duplicate upstream contract.
- Keeps `packages/core/src/types/upstream/collections.ts` at exactly 0 bytes.
- Does not introduce a generic reasoning primitive.
- Keeps exhaustive domain decisions local to the owning route-syntax fact variant.

## Verification status

Run `npm run audit:phase2815-route-syntax-domain-operated-judgment` for the focused architecture audit. This audit is a source-structure audit; it is not a substitute for TypeScript typecheck, production build, full tests, or CLI `scan`/`sync` E2E.
