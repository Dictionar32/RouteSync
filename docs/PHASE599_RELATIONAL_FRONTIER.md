# Phase 599 — Relational Frontier: SSA, Loop, CFG Store, PHP-Type Algebra

## Objective

Push RouteSync past the remaining host-control authority at the scanner/resolver/analysis/type-lowering frontier. The phase follows the declarative direction documented by Soufflé relations, MLIR declarative pattern rewriting, egglog equality-saturation + Datalog, Statix scope graphs, and WebAssembly's declarative typing judgements. Soufflé models facts as typed relations; MLIR separates match/rewrite patterns; egglog combines equality saturation with Datalog; Statix models name binding as scope/edge/declaration constraints; WebAssembly states validity as declarative constraints over abstract syntax.

## Cutover

### CFG / SSA

- `compiler/utils/cfg/basicBlock.ts` now models block storage as immutable relation facts.
- `ControlFlowGraph` is a structural relation-backed value with `createControlFlowGraph` rather than a host constructor.
- Phi incoming edges use immutable predecessor/operand relation tuples instead of `ReadonlyMap`.
- SSA phi placement derives `definition`, `phi_required`, and `incoming` facts and projects them into CFG blocks.
- SSA renaming uses immutable variable-version relations and recursive dominator traversal.
- `SSARepresentation` is a structural projection rather than a class instance.

### Loop analysis

- Natural loops are represented through back-edge and loop-membership relations.
- Loop expansion is recursive monotone relation closure.
- Loop pre-header normalization rewrites CFG facts immutably.
- `Set`, `Map`, loop worklists, and host iteration constructs are absent from the modified loop surface.

### Semantic type lowering

- Resolved PHP variants were moved from concrete classes/constructors to frozen structural witnesses.
- Resolved PHP matching is a relation-driven catamorphic dispatcher rather than `switch`.
- Type hashing uses its relation-backed context factory.
- Subtyping reference-cycle tracking uses relation membership rather than `Set`.
- Type lattice contexts use the canonical hash-context factory.

### Scanner / resolver frontier

- `InvalidationResolver` is now an immutable resolver relation object.
- Its invalidation payload uses the canonical `fromTargets` relation factory rather than a host constructor call.
- Existing scanner lexer/AST relational surfaces selected by the phase audit remain clean under the AST-aware banned-construct audit.

## Vacuum

The production TypeScript tree currently has **0 empty production files** under the audit scope. No additional file was deleted merely because a rough textual import heuristic failed to find its basename: that heuristic produces false positives for entry points, re-export surfaces, and symbol-alias imports. Deletion remains conservative and evidence-based.

## Verification

- AST-aware Phase 599 audit: selected frontier is zero for `if`, `while`, `for`, `switch`, `.map`, `.filter`, `.reduce`, `.flatMap`, `undefined`, `null`, `??`, `===`, `!==`, `as unknown`, `Set`, `Map`, `any`, `new`, and ternary syntax.
- All modified Phase 599 frontier files transpile with TypeScript with zero transpilation diagnostics.
- A focused TypeScript check over the modified CFG/SSA/loop/dominator/dataflow surface completed without diagnostics after the cutover.
- A focused TypeScript check over the resolved-PHP/type-system surface completed without diagnostics after the cutover.
- Full project typecheck remains blocked before project checking by the environment's missing type-definition packages (`node` and `vitest/globals`); unrelated legacy diagnostics therefore are not represented as a Phase 599 regression claim.

## Remaining frontier

The global audit is intentionally **not** claimed clean. Remaining authority is concentrated in older descriptor/factory constructors, scanner subscanners, upstream presence/type vocabulary, verification/generator compatibility surfaces, and other legacy graph/query layers. The next cutover should target:

1. scanner descriptor/factory classes and route-security/resource binding compatibility;
2. AST/upstream presence and mapping surfaces still carrying optional host values;
3. symbol graph/hierarchy and query-cache state;
4. generator/verification boundaries;
5. equality-rewrite saturation over semantic type lowering and route capability constraints.
