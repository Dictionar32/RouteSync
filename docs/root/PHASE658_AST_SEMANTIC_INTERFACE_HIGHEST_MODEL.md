# Phase 658 — AST Semantic Interface Highest Model

## Objective

Raise the Phase 657 AST algebra one level further: the AST is not only a closed judgment constructor/eliminator. It is now the **semantic interface contract across compiler stages**.

The intended pipeline is:

`Laravel source evidence -> upstream mapping -> AST judgment -> resolver graph -> analysis closure -> semantic type lowering -> Next.js target projection`

Every semantic stage receives and emits explicit ADT/relation facts. Traversal state remains an implementation detail and is not the semantic authority.

## Phase 658 changes

### 1. Closed cross-stage semantic interface

Added:

`packages/core/src/types/upstream/astSemanticInterface.ts`

It defines:

- `AstSemanticStage`
- `AstSemanticRelationName`
- `AstSemanticTerm`
- `AstSemanticFact`
- `AstSemanticRule`
- `AstSemanticDerivation`
- `AstSemanticClosure`
- `AstSemanticJudgment`
- `AstSemanticProjection`
- `AstSemanticInterface`

The closed stages are:

1. scanner evidence
2. upstream mapping
3. resolver graph
4. analysis
5. semantic type lowering
6. target projection

The interface also exposes relation-driven fixed-point closure. The implementation is monotone: facts are accumulated and closure terminates at a stable relation set or the configured round bound.

### 2. AST remains the SSOT

`packages/core/src/types/upstream/ast.ts` re-exports the cross-stage semantic interface. There is still one AST judgment universe; the new interface does not create a second AST schema.

### 3. Resolver graph boundary

Added:

`packages/core/src/compiler/scanner/subscanners/resource/resourceBindingSemanticInterface.ts`

Resource traversal is now able to project into the AST semantic interface as `resolver_graph` facts:

- property resolution
- relation dependence
- method analysis
- resolution status
- semantic diagnostics
- derivation witness

This is the intended migration direction for the remaining resource binding traversal/origin/path compatibility surfaces.

### 4. Target projection boundary

`typeScriptTargetSurfaceRelations.ts` now carries an `AstSemanticFact` for each closed TypeScript target-surface operation.

The target remains independent of `semanticRelationSolver.ts` and now explicitly identifies itself as `target_projection` in the AST semantic interface.

## Boundary invariant

The new highest interface must not introduce these constructs in the semantic boundary implementation:

- `if`
- `while`
- `for`
- `switch`
- `map`
- `filter`
- `reduce`
- `flatMap`
- `undefined`
- `??`
- `===`
- `!==`
- `as unknown`
- `any`
- `new Set`
- `new Map`

The Phase 658 interface implementation itself is clean under this invariant. Existing historical AST comments and documentation can contain ordinary English words that happen to match a lexical token; these are not executable semantic constructs.

## Remaining frontier

The audit confirms the architectural frontier is now lower in the stack rather than in the AST schema:

### A. Generic semantic relation solver

`semanticRelationSolver.ts` is still consumed by many historical relation programs. It should become an implementation detail of a **typed compiler semantic engine**, not a scanner-owned generic authority.

Target architecture:

`generic relation API`
→ `closed RouteSemanticTerm ADT`
→ `typed relation vocabulary`
→ `candidate / judgment / witness / derivation facts`
→ `stratified fixed-point closure`
→ `rewrite/equality closure`
→ `canonical extraction`

### B. Resolver graph

The remaining resolver implementations should emit `resolver_graph` facts directly. Candidate, edge, witness, conflict, resolution and closure need one closed ADT rather than parallel procedural models.

### C. Resource binding

The traversal builder, origin resolver, path builder and provenance builder should progressively become relation producers. The new semantic adapter is the migration seam; it is deliberately not a duplicate authority.

### D. Analysis layer

Analysis should consume AST semantic facts and emit analysis facts. Dominance, dataflow, dependency and symbol relationships should be explicit relations with fixed-point semantics rather than hidden traversal state.

### E. Semantic type lowering

Semantic types should be a closed type-term algebra. Lowering should be a relation/rewrite projection from that algebra to target vocabulary, not a collection of ad-hoc type conversions.

### F. Scanner / lexer

The scanner remains an evidence producer. Its output should become typed syntax evidence and source provenance; it must not become the owner of resolver or target semantics.

## External architecture trace

The research pass reinforced several relevant patterns:

- **MLIR:** graph-based operations/values, regions, typed IR, traits and interfaces support explicit semantic invariants and transformation boundaries.
- **CodeQL:** data-flow is represented through explicit node/edge relations and predicates rather than hidden traversal state.
- **Soufflé / Datalog family:** semantic computation is naturally expressed as typed relations plus recursive closure.
- **egg / egglog:** equality saturation keeps discovered alternatives and performs extraction after rewrite closure; this is useful for RouteSync's future semantic rewrite/extraction stage.
- **K / Maude:** rewrite rules and executable semantics provide a model for making semantic transitions explicit.
- **Circular/reference attribute grammars:** recursive semantic equations can be evaluated through well-defined fixed points.
- **CompCert:** compiler stages are separated by typed intermediate representations and semantic-preservation reasoning; RouteSync can adopt the interface discipline without claiming formal equivalence proofs.
- **WebAssembly Component Model/WIT:** interfaces and worlds provide closed, composable contracts and explicit type resolution across package boundaries.
- **Laravel routing:** route groups, middleware, constraints, parameters, bindings and related route attributes confirm that source-side routing semantics need a rich source contract before target projection.

## Audit command

`npm run audit:phase658-ast-semantic-interface`

Audit script:

`scripts/audit-phase658-ast-semantic-interface-highest.cjs`

## Interpretation

Phase 658 is an **interface elevation**, not a cosmetic cleanup. The important change is that scanner, resolver, analysis, type lowering and target projection now have a common semantic contract anchored in the AST judgment SSOT.

The next phase should therefore cut over one of the remaining semantic authorities—preferably the resolver graph—rather than adding more AST fields.
