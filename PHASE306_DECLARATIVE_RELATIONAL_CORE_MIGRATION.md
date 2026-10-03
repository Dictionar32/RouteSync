# Phase 306 — Declarative Relational Core Migration

## Objective

Continue the migration of RouteSync semantic authority away from imperative control-flow and collection combinators toward declarative semantic relations, constraint selection, recursive closure, and rewrite-ready catalogs.

## External design evidence

- CodeQL models analysis data as named relations and QL uses Datalog-style stratified semantics.
- MLIR PDL/PDLL separates declarative pattern matching from rewrite application and represents patterns as first-class IR.
- WebAssembly validation defines validity through declarative constraints and derives an effective validation algorithm from those rules.
- Flix demonstrates relation and lattice constraints as semantic program constructs.

These systems are used as architectural evidence, not as implementation dependencies.

## RouteSync policy

1. Parser output is syntax evidence.
2. Semantic meaning is represented by typed relations and relation catalogs.
3. Selection is constraint satisfaction, not imperative branching.
4. Traversal is recursive closure or relation fold, not host-language iteration.
5. Transformation is expressed as rewrite candidates and fixed-point closure.
6. `if`, `for`, `while`, `switch`, ternary, `.map()`, `.filter()`, `.reduce()`, and `.flatMap()` are forbidden in the semantic authority surface.
7. Legacy modules are removed/emptied only after their dependency graph has a relation-native replacement. No active module is emptied merely to make an audit pass.

## Migrated in this phase

- `packages/core/src/semantic/SemanticResolutionKernel.ts`
- `packages/core/src/semantic/kernel/relationalSequence.ts`
- `packages/core/src/semantic/kernel/typeMapper.ts`
- `packages/core/src/semantic/plugins/PrimitiveResolver.ts`
- `packages/core/src/semantic/plugins/frameworkRuleSelection.ts`
- `packages/core/src/semantic/plugins/method-return/instanceMethodSupport.ts`
- `packages/core/src/semantic/plugins/method-return/instanceMethodResolution.ts`
- `packages/core/src/semantic/plugins/method-return/selectRawProjectionParser.ts`

## Relational substrate

`relationalSequence.ts` provides recursive relation primitives:

- `relationChoose`
- `relationFirst`
- `relationSelect`
- `relationProject`
- `relationFold`

The semantic modules use these as an execution substrate. They do not expose imperative control constructs as semantic concepts.

## Parser state transition

`selectRawProjectionParser.ts` models top-level SQL projection splitting as a recursive state transition over:

- index
- start offset
- parenthesis depth
- quote state
- accumulated relation output

The state machine is syntax processing only. Its output is then projected into semantic relations.

## Audit status

The core AST audit scans all TypeScript/TSX source under `packages/core/src` and rejects:

- `IfStatement`
- `ForStatement`
- `ForInStatement`
- `ForOfStatement`
- `WhileStatement`
- `DoStatement`
- `SwitchStatement`
- `ConditionalExpression`
- `.map()`
- `.filter()`
- `.reduce()`
- `.flatMap()`

At this phase the complete core is not yet clean. The remaining concentration is primarily in the legacy compiler/scanner pipeline, `compiler.ts`, `types`, and several runtime-facing modules. Those require semantic replacement before safe removal.
