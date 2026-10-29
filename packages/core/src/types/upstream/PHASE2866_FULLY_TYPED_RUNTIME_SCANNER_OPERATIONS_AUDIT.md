# Phase 2866 — Fully Typed Runtime Scanner Operations

## Scope

This phase makes the resolver-graph runtime judgment actionable and removes its passive `reasoning` string discriminator. It does not claim that every reasoning-related field in the repository has been removed; the change is limited to `ResolverGraphSemanticJudgment` and its producer.

## Domain judgment and runtime continuation

`packages/core/src/compiler/scanner/resolvers/resolverGraphSemanticInterface.ts` now exposes a closed union of:

- `ResolverGraphCandidateSelectedJudgment`, with `domainOutcome: 'candidate_selected'`;
- `ResolverGraphDefaultAppliedJudgment`, with `domainOutcome: 'default_applied'`.

Both variants own `continueWith(handlers)`. The handlers receive the corresponding fully typed judgment, so downstream code can follow the domain outcome without re-interpreting a primitive `reasoning` label. The runtime operation remains interface-first:

```ts
export const resolverGraphSemanticOperations: ResolverGraphSemanticOperationsInterface = Object.freeze({
  resolveJudgment: resolveResolverGraphJudgmentImplementation,
  createInterface: createResolverGraphSemanticInterfaceImplementation,
});
```

The upstream `RouteDomainResolutionJudgment` already provides its own continuation; this phase reuses it rather than introducing a competing route-domain contract. `astAnalysisJudgment` now consumes the graph continuation and preserves `domainOutcome` in the resolver-domain fact, so the ADT operation is used on a downstream runtime path.

## Example

```ts
const graph = resolverGraphSemanticOperations.resolveJudgment(input);
return graph.continueWith({
  candidate_selected: judgment => consumeResolvedGraph(judgment),
  default_applied: judgment => continueWithDefaultDomain(judgment),
});
```

The two handlers are consumer-owned domain actions. The ADT owns the decision and routes the judgment to the matching handler.

## Canonical CLI manifest trace

`CLI scan/sync` → `composition.manifestScanOperation.scan(input)` → `routeSyncCliManifestScanOperationFactory` → `controllerInvocationManifestCompositionAuthority.compose(input)` → source discovery and identity binding → controller invocation inventory judgment → `ControllerInvocationManifest.continueForDriftAudit(handlers)` → CLI projection/output.

The resolver graph is a semantic scanner input/analysis operation; it is not a replacement for the CLI manifest composition or builder. Existing manifest and route-domain continuations are preserved.

## Audit and limits

Run:

```bash
npm run audit:phase2866-fully-typed-runtime-scanner-operations
```

The script writes `PHASE2866_AUDIT.json` and checks the closed resolver-graph variants, continuation operations, removal of the `reasoning` primitive and relation-utility imports from this graph judgment, interface-first runtime export, upstream route-domain continuation, CLI manifest trace, no relation imports in CLI, no production `export function` declarations in the audited path, and the empty `collections.ts` contract.

The wider scanner/upstream scope still contains relation imports. This phase does not claim that relation migration or callable-export migration is complete. Structural audit is not a substitute for full typecheck, tests, build, or CLI E2E.

Snapshot findings from the Phase 2866 audit run:

- 14/14 structural checks pass.
- 790 production TypeScript files are included in the scanner/upstream/CLI audit scope.
- 173 `semantic/relations` import statements remain across 86 files in that broader scope; the resolver-graph module now has zero such imports, and CLI still has zero.
- No production `export function` declarations were found in the audited paths.
- `packages/core/src/types/upstream/collections.ts` remains zero bytes.

Syntax transpilation passed for both changed TypeScript production files, and `package.json` parses. A targeted `tsc --noEmit` run remains nonzero because the broader dependency graph has 213 existing diagnostics; no diagnostics in that run directly named the two changed TypeScript files. This does not establish a successful full typecheck, build, unit test, or CLI E2E run.
