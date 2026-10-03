# Phase 605 — Scanner / AST-Upstream Relation Environment

Phase 605 moves two remaining scanner/upstream mapping surfaces from host `Map`/mutable environment authority to immutable relation-backed environments.

## Frontier

- `compiler/scanner/subscanners/serviceSourceStatements.ts`
- `compiler/scanner/subscanners/serviceAstCanonical.ts`

## Model

```text
PHP method evidence
  -> upstream expression/statement relations
  -> persistent binding relation
  -> semantic resolution
  -> Service AST
```

`Map`/`new Map` environments are replaced with `RelationIndex<K,V>`. Assignment and loop bindings return a new environment rather than mutating host state. Statement processing threads the resulting environment through the relation fold, while branch/loop bodies receive scoped relation environments.

`serviceAstCanonical` likewise represents parameter-type/model associations as `RelationIndex` facts and derives model dependencies through relation lookup and recursive expression traversal.

## Research basis

MLIR PDLL/PDL treats matching and rewriting as declarative pattern infrastructure; MLIR DRR emphasizes expressing the source pattern, constraints, and result pattern rather than hand-written host-language boilerplate. WebAssembly's current specification likewise defines validation declaratively as constraints/typing judgements and separately sketches an implementation algorithm. These principles motivate keeping RouteSync semantic authority in relations and solver/rewrite layers rather than mutable host collections.

## Validation

- Production TypeScript files: see audit JSON.
- Modified frontier files transpile with zero TypeScript syntax diagnostics.
- Zero-byte production files are checked by the audit; no file is emptied without evidence that it is unused.
- Full `tsc --noEmit --skipLibCheck` remains blocked by the existing environment/type-definition errors for `node` and `vitest/globals`.

## Next leak surfaces

The remaining high-value frontier is the resolver/analysis boundary: resolver graph candidate construction, AST/upstream mappings outside the service scanner, CFG/SSA/dataflow analysis, and the remaining semantic type/target lowering adapters. Source-language tokens such as PHP `new`, `null`, `if`, and emitted TypeScript `undefined`/`null` remain data vocabulary where they describe the source or target language; the ban targets host implementation authority.
