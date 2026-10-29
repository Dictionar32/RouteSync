# Phase2886 — Fully Typed Runtime Scanner Operations audit

## Scope
Trace the upstream-to-CLI manifest runtime and audit callable exports, optional/undefined contracts, and collection operations. This phase is an audit artifact; it does not claim a wholesale migration of every candidate.

## Runtime trace

`controllerInvocationManifestBuilder.build(...)` → CLI manifest scan operation → `ControllerInvocationManifestCompositionAuthorityInterface.compose(...)` → project identity/policy selection → source discovery → source reads → identity binding batch → source-read batch → semantic judgment preparation → inventory closure authority → manifest builder judgment → CLI manifest result.

The upstream contract surface is exported through `packages/core/src/types/upstream/index.ts`; the core public barrel re-exports selected upstream contracts. Verify both barrels whenever a contract changes.

## Findings from source scan

Within `packages/cli/src/parsers/php`, `packages/core/src/types/upstream`, and `packages/core/src/compiler/scanner/wiring`:

- No top-level `export function` declarations were found in the scanned TypeScript files.
- The CLI PHP parser scope has 21 TypeScript files; 10 source lines contain `.map(` and no `.reduce(` lines were found.
- The upstream scope has 530 top-level TypeScript files; 141 lines matched a heuristic for exported callable `const` declarations without an explicit type annotation on the declaration. These are candidates for review, not proof that every declaration is a public runtime operation or can be safely rewritten mechanically.
- The upstream scope has 254 source lines containing `.map(` and 2 containing `.reduce(`. Each needs semantic classification; a collection transform is not automatically a design defect.
- The scanner wiring scope has 41 TypeScript files; 66 source lines contain `.map(` and no `.reduce(` lines were found.
- `packages/core/src/types/upstream/collections.ts` remains empty (0 bytes).

## Concrete policy contract concern

`semanticDataflowQueryPolicy.ts` still contains exported callable constants such as `semanticDataflowFactContractKey`, `materializeSemanticDataflowQueryPolicy`, `validateSemanticDataflowQueryPolicyContract`, `decodeSemanticDataflowQueryPolicyContract`, and `semanticDataflowQueryPolicyMatches`. These are candidates for interface-first object operations if the intended public API is `export const operation: Interface = Object.freeze({ ... })`; call sites and barrel exports must be migrated together. Do not change only the declaration and leave consumers inconsistent.

`SemanticDataflowQueryPolicyIntent` also retains optional properties (`additionalFlowSteps?`, `barrierNodes?`). Before removing these, establish whether omission has legitimate domain semantics; if so, represent default/explicit capabilities with a domain ADT rather than silently equating absence with an empty collection.

## Recommendations

1. Prioritize operations directly on the manifest path, not all upstream exports indiscriminately.
2. For each candidate, document its domain responsibility and existing contract before introducing or changing an interface.
3. Migrate export, all runtime call sites, tests, and both barrels in one coherent change.
4. Keep domain judgments responsible for their own continuation operations; do not merely move `if`/`switch` into a helper.
5. Distinguish `.map()` used for pure projection from collection traversal that makes domain decisions or classifies batch success/failure.
6. Do not normalize AST/pipeline failures to an empty valid manifest.
7. Full typecheck/build/E2E status remains unverified in this phase.
