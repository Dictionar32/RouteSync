# Phase 397 — Scanner/Resolver Relational Authority

## Objective

Move the model declaration scanner boundary from host-language traversal and sentinel absence into declarative relation traversal and typed option witnesses.

## Research synthesis

Phase 397 continues the architecture established by declarative rewrite and relation systems:

- MLIR PDLL separates pattern matching, constraints, and rewrites.
- MLIR DRR represents rewrites declaratively rather than as hand-written control-flow implementations.
- egglog combines equality saturation with Datalog-style relational inference.
- The RouteSync consequence is that scanner traversal should emit candidate facts and typed witnesses; canonical AST projection is downstream of relation resolution.

## Implemented

`packages/core/src/compiler/scanner/lexer/modelDeclarationParser.ts`

- `for` traversal replaced with recursive relation closure.
- `if` branches replaced with `relationGate`/relation selection.
- imperative member traversal replaced with recursive relation resolution.
- token absence is represented as `RelationOption<TokenDescriptor>`.
- class inheritance selection is relation-driven.
- method return discovery is recursive relation traversal.
- constant discovery is relation-driven.
- visibility discovery is relation candidate selection.
- trait discovery uses `relationSelect` + `relationProject`.
- `===`, `undefined`, `null`, `??`, `map`, `filter`, `reduce`, `flatMap`, and `as unknown` are absent from the migrated file.

## Boundary

```text
PHP token evidence
  -> candidate relation
  -> constraint selection
  -> RelationOption witness
  -> recursive closure
  -> canonical model declaration
```

The migration does not reinterpret PHP syntax. Source-language tokens remain evidence. The change is the semantic authority used to traverse and resolve that evidence.

## Audit

Using the same lexical audit over `packages/core/src/compiler/scanner/**/*.ts`:

- Phase 396: 5505 hits / 337 files
- Phase 397: 5439 hits / 336 files
- delta: -66 hits / -1 violating file
- `modelDeclarationParser.ts`: 66 -> 0

The audit is a lexical proxy, not a semantic proof. Source syntax names inside scanner evidence are not themselves semantic authority violations.

## Validation limitation

The extracted checkpoint lacks the `node` and `vitest/globals` type-definition packages required by the repository's normal TypeScript configuration. Isolated compilation also exposes pre-existing/incomplete errors in `astClassifierEvidence.ts`; these are not presented as resolved by this phase.
