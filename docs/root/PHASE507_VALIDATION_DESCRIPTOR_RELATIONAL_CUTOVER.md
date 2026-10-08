# Phase 507 — Validation Descriptor Relational Cutover

## Objective

Move `descriptors/validation/validationRuleEntry.ts` from imperative syntax-driven semantic authority to declarative semantic relations + candidate solver + recursive relation closure.

## Research synthesis

The design follows several higher-level compiler/static-semantics patterns:

- MLIR PDLL/PDL represents matching and rewriting declaratively and exposes patterns as an IR-level abstraction.
- Statix models static semantics as constraint solving and name binding as scope-graph relations and queries.
- Rascal separates extracted facts from fact enrichment, transitive closure, constraint solving, and rewriting.
- egglog combines Datalog-style deduction with equality saturation, allowing analysis facts and rewrites to reinforce each other.

The RouteSync projection is:

`scanner evidence -> validation relations -> candidate requirements -> recursive closure -> canonical validation authority -> rewrite`

## Phase 507 changes

### `validationRuleEntry.ts`

- field-path wildcard discovery moved to relation index/range operations;
- path projection moved to `relationProject`;
- collection/root choice moved to `relationGate`;
- nested validation object construction is recursive relation closure;
- semantic type recognition is a relation candidate set solved by `solveCandidate`;
- array element type is selected through relation gating;
- validation presence is derived from relation witnesses rather than `some`/imperative branching;
- object property construction uses relation projection;
- absence is represented by relation options rather than runtime absence sentinels;
- no forbidden host-language control/operator constructs remain on the closed surface.

## Audit

Command:

`npm run audit:scanner-lexer:phase507`

Result:

`closedSurfaceClean: true`

Target `descriptors/validation/validationRuleEntry.ts`: all forbidden categories are `0`.

## Next frontier

1. `descriptors/manifest/resourceRouteGroupDescriptor.ts` — 54
2. `subscanners/controller/responseAttributeScanner.ts` — 54
3. `subscanners/resource/resourceUpstreamExpressionCanonical.ts` — 54
4. `orchestrator/sourceAstScanner.ts` — 51
5. `subscanners/form-request/ruleCollector.ts` — 51
6. `subscanners/resource/resourceAstExpressionMapper.ts` — 51

The next strategic cutover should target the resource route-group descriptor or response-attribute scanner as a relation catalog rather than treating each remaining keyword independently.

## Validation limitation

Repository-wide TypeScript typechecking is not claimed as green when the environment lacks the required external type-definition baseline. Target-file syntax transpilation was checked successfully.
