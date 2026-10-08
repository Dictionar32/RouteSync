# Phase 428 — Scanner/Resolver Relational Middleware + Constraint Authority

## Goal
Continue the semantic-authority cutover from imperative collection/control constructs to declarative semantic relations and relation-driven resolution.

## Changed authority files
- `packages/core/src/compiler/scanner/descriptors/route/routeMiddlewareResolver.ts`
- `packages/core/src/compiler/scanner/descriptors/route/routeConstraintAstAdapter.ts`

## Cutovers
- middleware assembly: relation projection instead of imperative loops/push
- effective middleware: relation selection + relation predicates instead of filter/map
- scope semantics: relation gates + membership relations
- middleware parameter equality: relation equality + recursive relational traversal
- middleware normalization: relation gate + relational projection
- controller declarations/exclusions: relational projection
- route constraint AST adaptation: relational projection instead of map
- optional constraint presence signatures: optional-property form rather than `undefined` sentinel vocabulary

## Verification
Both changed files transpile with TypeScript `transpileModule` with 0 diagnostics.
The target lexical audit reports 0 occurrences of:
`if`, `for`, `while`, `switch`, `.map(`, `.filter(`, `.reduce(`, `.flatMap(`, `undefined`, `??`, `null`, `===`, `as unknown`, `||`, `.trim(`, `&&`, and numeric positional `identifier + number`.

This phase does not claim the entire scanner is clean. Remaining hotspots are intentionally the next migration frontier.
