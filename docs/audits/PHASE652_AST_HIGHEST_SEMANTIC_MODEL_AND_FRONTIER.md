# Phase 652 — AST highest semantic model + semantic authority frontier

## Objective

Raise the upstream AST interface from a syntax/provenance record into a semantic attributed term that can carry identity, source evidence, provenance, and relation/rewrite derivation without making TypeScript host control flow the semantic authority.

## Model elevation

The upstream AST contract is now layered as:

```text
SemanticAstNode
├── kind
├── identity
├── semantic
├── evidence
├── provenance
└── derivation
    └── AstDerivationTrace
        ├── empty
        └── cons(step, tail)
```

`CanonicalAstNode` remains the stable public alias, while `SemanticAstNode` is the architectural name.

The four semantic dimensions are deliberately separate:

```text
semantic   != source evidence
semantic   != provenance
provenance != derivation
```

This is stronger than a flat `{ semantic, source }` wrapper because later relation/fixed-point/rewrite stages have a typed place to retain derivation evidence.

## Expression boundary

`ExpressionAst` is now:

```text
CanonicalAstNode<
  expression_ast,
  Expression,
  ExpressionSurface,
  ExpressionOrigin
>
```

The PHP surface vocabulary remains evidence. PHP constructs such as ternary, coalesce, nullsafe access, `for`, `while`, and `switch` are not removed from the source ADT merely to satisfy a lexical detector.

## Trace audit

The existing phase audits were rerun. Important results:

- Phase 585 graph: `closedSurfaceClean=true`.
- Phase 586 scanner/resolver cutover: relational frontier remains clean for its declared scope; one `null` remains in `ResourceScanner`.
- Phase 587 upstream scanner: aggregate semantic frontier is small: `if=2`, `for=9`, `while=1`, `undefined=24`, `any=4`, with no `map/filter/reduce/flatMap/nullish/strict-equality/as-unknown/Set/Map/new` in its declared scope.
- Phase 589 semantic type relational cutover reports the upstream canonical mapping surface clean for its declared scope.
- Phase 593 resolver/solver cutover reports `changedSurfaceClosed=true`.
- Phase 594 confirms the established inactive-file vacuum. Files are preserved at their original paths and emptied rather than deleted.

A broader Phase 652 trace across scanner, graph, analysis, and semantic type lowering identifies the next actual authority leaks. The highest-risk files are:

1. `packages/core/src/compiler/scanner/subscanners/controller/actionVariableTracker.ts`
2. `packages/core/src/compiler/scanner/descriptors/request/controllerExpressionContract.ts`
3. `packages/core/src/compiler/scanner/descriptors/manifest/resourceRouteGroupDescriptor.ts`
4. `packages/core/src/compiler/scanner/lexer/routeAst/routeDeclarationParserHelpers.ts`
5. `packages/core/src/compiler/scanner/subscanners/resource/resourceBindingTraversalBuilder.ts`
6. `packages/core/src/compiler/scanner/subscanners/resource/resourceBindingOriginResolver.ts`
7. `packages/core/src/compiler/scanner/subscanners/request-deriver/rawTypeConverter.ts`
8. `packages/core/src/compiler/scanner/subscanners/controller/controllerErrorDetector.ts`

These are not to be fixed by blind token replacement. Each must move from host branching/collection operations to a semantic relation catalog, candidate constraints, solver selection, and explicit witness-bearing ADTs.

## Highest next transformations

### A. Controller variable binding

Current shape still contains procedural environment lookup, mutable `Map`, host `undefined`, conditional dispatch, and source-kind branching.

Target:

```text
PHP token/AST evidence
  -> binding facts
  -> candidate binding relations
  -> alias closure
  -> model/table/parameter witness
  -> BoundControllerReference ADT
```

Alias resolution should become a recursive relation/fixed point, not recursive semantic dispatch hidden behind a host `switch`.

### B. Resource route-group classification

`resourceRouteGroupDescriptor.ts` is currently the clearest scanner-side semantic authority leak. It directly performs grouping, searches, filtering, optional checks, and CRUD classification.

Target:

```text
route facts
  -> resource-group candidate relations
  -> capability predicates
  -> group-kind rewrite rules
  -> ResourceGroupClassification witness
  -> downstream descriptor projection
```

The descriptor class may remain a projection boundary; it must not remain the source of semantic classification.

### C. Resource binding traversal/origin

`resourceBindingTraversalBuilder.ts` and `resourceBindingOriginResolver.ts` need a shared relation ontology:

```text
binding_requirement
binding_target
binding_path
binding_cardinality
binding_origin
binding_type
```

Then recursive relation closure derives traversal and provenance.

### D. Route parser helpers

`routeDeclarationParserHelpers.ts` should become a syntax-evidence compiler. Parsing decisions should be represented as candidate relations and syntax-error facts. Syntax error must be a first-class ADT result, not a host exception/control path.

### E. Semantic type lowering

The semantic type layer should lower only from solved semantic types:

```text
SemanticType
  -> TypeLoweringCandidate
  -> target-surface relation
  -> rewrite/fixed point
  -> TargetTypeWitness
  -> TypeScript projection
```

The target token surface is not the semantic source of truth.

## Optionality frontier

`packages/core/src/types/upstream/expression.ts` still contains `Expression | undefined` fields. The upstream model already has `Option<T>`. The correct migration is therefore:

```text
T | undefined
   ↓
Option<T>
   ↓
relationSome / relationNone
   ↓
solver-visible optionality
```

Do not replace `undefined` with another host sentinel. Do not collapse absence into `null`.

## Unused-file policy

No files were deleted. Existing inactive production surfaces remain zero-byte files. The audit found two empty files inside the scoped scanner/graph/analysis/lowering surface; no additional file was emptied solely from a lexical guess. Reference-bearing files remain preserved until their semantic ownership is proven migrated.

## External design basis

Tree-sitter deliberately produces a concrete syntax tree and separates syntax-tree parsing from the later abstract semantic model. citeturn0search1turn0search8

MLIR's canonicalization infrastructure repeatedly applies rewrite patterns to a fixpoint, and its declarative rewrite facilities separate pattern specification from host implementation. citeturn0search10turn0search16turn0search3

K treats executable semantics as configurations plus rewrite rules, making semantic transitions explicit rather than hidden in a procedural dispatcher. citeturn0search5turn0search9

Circular/reference attribute grammars provide a close theoretical analogue for RouteSync's direction: non-local references plus circular equations can express compiler analyses through declarative fixed-point evaluation. citeturn0search2turn0search0turn0search11

Laravel's current routing model explicitly includes route groups, middleware, controller association, route model binding, fallbacks, and resource-style routing; these are source-domain facts that belong in RouteSync's Laravel evidence/semantic ontology before Next.js projection. citeturn0search7

## Architectural conclusion

The highest useful AST model for RouteSync is not a bigger syntax tree. It is:

```text
Laravel Source AST
      ↓
Source Evidence ADT
      ↓
Semantic Relation Program
      ↓
Candidate / Constraint Space
      ↓
Fixed-Point / Rewrite Solver
      ↓
Witness + Provenance + Derivation
      ↓
SemanticAttributedAst
      ↓
Semantic IR
      ↓
Next.js Projection
```

CFG/SSA, concrete parser trees, target syntax, and descriptor classes remain derived projections. The canonical source of truth is the relation-backed semantic AST/IR with provenance and derivation.
