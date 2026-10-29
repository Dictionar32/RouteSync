# Phase 2727 — Fully Typed Resolver-Graph Runtime Operations

## Scope

Convert the resolver-graph semantic runtime's exported function entrypoints into one interface-first, frozen operation object. Keep the existing CLI → upstream manifest construction path intact and re-run the prior source audits.

## Source change

File: `packages/core/src/compiler/scanner/resolvers/resolverGraphSemanticInterface.ts`

- `resolveResolverGraphJudgment` is now the internal `resolveResolverGraphJudgmentImplementation`.
- `resolverGraphSemanticInterface` is now the internal `createResolverGraphSemanticInterfaceImplementation`.
- The public runtime API is:

```ts
export interface ResolverGraphSemanticOperationsInterface {
  readonly resolveJudgment: (input: ResolverGraphInput) => ResolverGraphSemanticJudgment;
  readonly createInterface: (input: ResolverGraphInput) => ResolverGraphSemanticInterface;
}

export const resolverGraphSemanticOperations: ResolverGraphSemanticOperationsInterface = Object.freeze({
  resolveJudgment: resolveResolverGraphJudgmentImplementation,
  createInterface: createResolverGraphSemanticInterfaceImplementation,
});
```

The semantic graph's existing closed judgment, relation rules, `solveClosedSemanticRelations` fixed-point solver, and discriminants were preserved. This phase does not replace semantic reasoning with booleans, does not create a new foundation, and does not move the CLI manifest authority.

## Upstream CLI manifest trace

The production path remains:

```text
CLI scan / sync
  → composition.manifestScanOperation.scan(input)
  → controllerInvocationManifestCompositionAuthority.compose(input)
  → canonical project identity
  → route selection and controller source discovery
  → source-document read and identity binding
  → invocation semantic judgments
  → inventory validation / receipt closure
  → manifest builder
  → manifest_builder_complete | manifest_builder_blocked
  → request-resolution preflight and semantic RequestType projection
  → RequestTypesArtifact lowering
  → semanticMappingContractDerivation.derive(requestTypes)
  → mapper artifact lowering
```

Resolver-graph operations are not a substitute for or bypass around this upstream manifest path. Inventory rejection, manifest `complete` and `blocked`, and downstream projection blockers remain separate outcomes.

## Audit results

- Phase 2727 resolver-graph runtime operations: **8/8** static checks passed.
- Phase 2726 semantic mapping runtime ownership: **11/11** passed.
- Phase 2725 semantic resource binding ownership: **13/13** passed.
- Phase 2686 upstream CLI manifest runtime trace: **12/12** passed.
- The audit output is saved at `reports/PHASE2727_RESOLVER_GRAPH_RUNTIME_OPERATIONS_AUDIT.json`.

## Remaining limitations

These are static source audits, not a full project build. Full TypeScript typecheck, unit tests, package build, and CLI end-to-end execution are not claimed as passing. The earlier reported **37 `relationFoundation` references across 28 TypeScript files** still require migration to their actual owners; no replacement foundation was added here. The scanner is not yet fully wiring-only.

## Changed files

- `packages/core/src/compiler/scanner/resolvers/resolverGraphSemanticInterface.ts`
- `scripts/audits/audit-phase2727-resolver-graph-runtime-operations.cjs`
- `reports/PHASE2727_RESOLVER_GRAPH_RUNTIME_OPERATIONS_AUDIT.json`
- `package.json` (audit script)
