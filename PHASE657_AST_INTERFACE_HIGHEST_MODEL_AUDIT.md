# Phase 657 — AST Interface Highest Model / Audit Trace

## Objective

Raise RouteSync's AST interface from a closed schema into a closed **AST judgment algebra**: one SSOT universe, typed constructor contract, typed eliminator, semantic/proof facets, and target projections that do not depend on the scanner's generic relation solver.

RouteSync remains a compiler-style semantic transformation:

`Laravel source ecosystem -> source evidence -> semantic AST judgment -> relational analysis/closure -> target projection -> Next.js ecosystem`

The target is not machine code. The compiler discipline is applied to the semantic contract and projection boundary.

## Trace from Phase 656

Phase 656 already established:

- closed `AstJudgment` union;
- canonical constructor;
- 15 canonical AST producers;
- typed syntax terms;
- syntax-error relation core;
- inactive legacy vacuum.

The Phase 656 frontier explicitly identified five remaining surfaces:

1. `semanticRelationSolver.ts` generic relation solver;
2. resource binding traversal/origin/path procedural compatibility surfaces;
3. resource route grouping procedural descriptor;
4. resolver graph judgment/candidate/closure interface;
5. TypeScript target-surface lowering still coupled to the generic solver.

## Changes in Phase 657

### 1. AST algebra elevation

`packages/core/src/types/upstream/ast.ts` now exposes:

- `AstJudgmentConstructor<Kind>` — closed constructor contract tied to `AstNodeSchema`;
- `AstJudgmentAlgebra` — common construct/project interface;
- `AstJudgmentVisitor<R>` — closed elimination contract;
- `matchAstJudgment` — canonical eliminator;
- existing evidence, provenance, constraints, dependencies, relations, derivation, status, and diagnostics remain facets of the same judgment.

The important change is architectural: AST construction and elimination are now described as one algebra over the same closed universe rather than a bag of unrelated object types.

### 2. Canonical producer typing

The 15 canonical producers no longer assert `as ModelAst`, `as RouteAst`, `as ResourceAst`, etc. after `createDomainAstJudgment`. The generic constructor now preserves the concrete discriminant at the type boundary.

### 3. Target lowering cutover

`typeScriptTargetSurfaceRelations.ts` was replaced with a closed `TypeScriptSurfaceFact` algebra and declarative fact catalog. It no longer imports or invokes `semanticRelationSolver.ts`.

This makes the target layer a projection algebra rather than a consumer of the scanner's generic semantic execution substrate.

### 4. Existing syntax-error frontier retained

`s​​yntaxErrorRelationCore.ts` remains a closed term algebra with relation-based fixed-point closure and no dependency on the generic semantic relation solver.

## Audit result

Phase 657 audit reports:

- closed AST schema: PASS
- closed AST judgment: PASS
- constructor contract: PASS
- algebra interface: PASS
- closed eliminator: PASS
- all proof/semantic facets present: PASS
- open generic AST payload: absent
- canonical producer constructor assertions removed: PASS
- TypeScript target projection generic-solver dependency: absent
- target projection forbidden constructs (`if`, `while`, `for`, `switch`, `map`, `filter`, `reduce`, `flatMap`, `undefined`, `??`, `===`, `as unknown`, `any`, `new Set`, `new Map`): 0
- syntax-error generic-solver dependency: absent
- inactive zero-byte vacuum: 100 files in the workspace; these remain empty as inactive/legacy surfaces rather than being resurrected.

## Research trace and architectural implications

The external comparison was used as architecture guidance, not as a claim that RouteSync should copy another implementation.

### Tree-sitter

Tree-sitter deliberately exposes a concrete syntax tree and distinguishes that from an AST that removes syntax details. RouteSync should therefore keep scanner syntax evidence separate from the semantic AST judgment rather than making the scanner tree the semantic SSOT. citeturn0search2turn0search10

### CodeQL / Soufflé

CodeQL models data as relations and its QL language uses stratified Datalog semantics; CodeQL data-flow paths explicitly model source, sink, and flow steps. Soufflé similarly treats relations as declared tuple sets with typed attributes. This supports the direction of making resolver graphs, dependencies, and analysis facts explicit relations rather than hidden traversal state. citeturn1search13turn1search14turn1search12

### MLIR

MLIR uses an IR graph of operations and values, nested blocks/regions, typed values, traits/interfaces, and declarative dialect extension. The relevant lesson for RouteSync is the separation of semantic IR structure from textual syntax and the use of explicit interfaces/invariants at transformation boundaries. citeturn2search0turn2search1

### E-graphs / egglog / rewriting

E-graphs represent equivalence classes and equality saturation accumulates equivalent expressions before extraction; egglog combines equality saturation with Datalog. This is a strong architectural analogue for the next RouteSync step: replace destructive procedural resolver decisions with monotone candidate/derivation facts plus rewrite closure, then extract a canonical target projection. citeturn0search21turn0search15

### K Framework / Maude

K is explicitly configuration- and rewrite-based, while Maude is grounded in reflective rewriting logic. This supports elevating resolver behavior into explicit semantic states and rewrite rules rather than encoding semantic authority in control-flow-heavy resolver implementations. citeturn2search7turn1search5

### Attribute grammars + circular fixed points

Circular/reference attribute grammar research shows that recursive semantic equations can be well-founded and evaluated through fixed points and demand-driven evaluation. This directly supports RouteSync's direction for resolver closure, dependency propagation, and semantic type derivation. citeturn0search1turn0search5turn0search18

### CompCert

CompCert demonstrates the stronger compiler principle: source AST, typed/elaborated intermediate representations, multiple lowering passes, and explicit semantic-preservation reasoning. RouteSync should apply the same separation-of-concerns discipline at its routing-contract level, without pretending that RouteSync has CompCert's formal proof guarantees. citeturn1search1turn1search4

### Spoofax

Spoofax separates declarative syntax, static semantics/name binding, and term transformations. This maps well to RouteSync's intended scanner -> semantic judgment -> resolver/closure -> target projection pipeline. citeturn1search0

### WebAssembly Component Model

WIT treats interfaces as collections of type definitions and function declarations and emphasizes composable, typechecked contracts. The useful RouteSync analogue is to make each compiler boundary expose a closed, typed contract rather than leaking implementation-specific payloads. citeturn0search0turn0search14

### Laravel source ecosystem

Laravel's current routing model includes route parameters, route groups, middleware, controllers, bindings, constraints, and fallback/rate-limiting surfaces. RouteSync's source-side AST therefore needs to preserve these as semantic source facts before projection rather than flattening them prematurely. citeturn0search4turn0search9

## Next highest frontier

The next work should not be another local syntax cleanup. The next elevation should be:

`generic SemanticRelation<R>`
→ `closed SemanticTerm ADT`
→ `typed relation facts`
→ `candidate / judgment / witness / derivation relations`
→ `fixed-point + rewrite closure`
→ `canonical extraction`

The concrete order is:

1. resolver graph: candidate/edge/judgment/closure ADT;
2. resource binding: path/origin/traversal as derived relations;
3. resource grouping: group classification as relation facts plus typed extraction;
4. semantic type lowering: closed target-type term algebra;
5. scanner/lexer: retain only source evidence and typed syntax judgments;
6. vacuum remaining compatibility files only when the dependency audit proves they are inactive.

The forbidden-construct audit should remain a **model-boundary invariant**, not a global blind source rewrite. Tests and compatibility evidence can contain ordinary host-language control flow where it is not semantic authority; production semantic boundaries should progressively move to declarative relations, ADTs, and fixed-point/rewrite closure.
