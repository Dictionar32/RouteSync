# RouteSync Phase 502 — Controller Relational Cutover

Phase 502 closes `subscanners/controller/controllerDataflowContract.ts` as a relational semantic surface.

## Architecture

The controller dataflow boundary now follows:

`scanner evidence -> relation facts -> candidate requirements -> relation closure -> semantic authority -> downstream rewrite`

The cutover removes parser-control constructs from the closed surface and replaces them with relation catalogs, recursive relational expansion, option-valued absence, candidate solving, and relation-gated semantic projection.

## Main changes

- controller return collection uses relation projection;
- semantic variable indexing uses relation fold/lookup;
- latest semantic definition is selected through relational option folding;
- binding origin classification uses candidate requirements;
- semantic dataflow facts use recursive relational expansion;
- resource binding discovery uses relation-gated recursive expression traversal;
- method chains traverse both receiver and arguments through relation expansion;
- model-origin resolution is relation-dispatched;
- static DB-table recognition is represented as an option/candidate relation;
- absence is represented through explicit option values rather than `undefined`;
- no imperative parser-control authority remains in the closed controller contract.

## Validation

`npm run audit:scanner-lexer:phase502`

Closed surface is clean for:

- `if`, `for`, `while`, `switch`
- `map`, `filter`, `reduce`, `flatMap`
- `undefined`, `??`
- `===`, `as unknown`
- `||`, `&&`
- `.trim()`, `.slice()`
- ternary expressions

The changed controller file also passes TypeScript syntax transpilation through the repository's installed TypeScript compiler. Repository-wide type checking remains blocked by unavailable `node` and `vitest/globals` type definitions in the environment.

## Research alignment

The semantic direction is consistent with declarative pattern/rewrite and constraint systems: MLIR PDLL separates match and rewrite patterns; Statix models semantic analysis as constraints and scope graphs; Flix treats relation constraints as first-class fixed-point computations; Rascal separates extracted facts from enrichment, closure, constraint solving and rewriting.
