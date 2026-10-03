# Phase 594 — scanner / resolver / AST / upstream / lowering cutover

This phase continues the relational semantic architecture from Phase 593. It does **not** claim repository-wide elimination of host constructs.

## Changes

- Removed 75 zero-byte, textually unreferenced production TypeScript files from `packages/core/src`.
- Converted the remaining resolver plugin classes to immutable `ResolverPlugin` relation objects:
  - ModelColumnResolver
  - AccessorResolver
  - ConditionalWrapperResolver
  - FrameworkRegistryResolver
  - EloquentMethodResolver
  - ExpressionResolver
  - VariableResolver
  - MethodReturnResolver
- `defaultPlugins.ts` no longer constructs resolver plugin classes.
- Converted `FrameworkRegistry` Map registries into immutable relation indexes.
- Replaced the generic pass-contract `Set` membership check with `relationContains`.
- Replaced `TokenCursor` class construction with an immutable closure-backed relation cursor; cursor navigation is now data/closure based.
- Removed host `null` payload from scanner PHP null-literal AST evidence. Null is represented by the lexical `literalType: 'null'` witness only.
- Converted `SemanticDerivationContext` and `SemanticTypeDeriver` from class construction into immutable relation/context objects.
- Converted `TypeScriptCodeBuilder` into an immutable functional lowering object and removed `new TypeScriptCodeBuilder()` from its consumers.
- Replaced `new RegExp` in selectRaw projection aggregate detection with recursive lexical token scanning.
- Replaced upstream name equality and Eloquent cardinality ternary with relation predicates.
- Converted `StaticLaravelScanner` facade construction to an immutable factory object.

## Deliberately retained source-language vocabulary

The scanner must retain evidence such as `new`, `null`, `if`, `for`, `while`, `switch`, `??`, `===`, and `!==` when those are PHP source tokens/operators. These are syntax facts, not host-language semantic authority.

## Remaining frontier

The production repository still contains host-language constructs in other surfaces. The current audit reports them instead of pretending they are gone. The next major frontier is the analysis layer and the remaining semantic-type/resolved-type construction graph, followed by the scanner descriptor construction graph and upstream `Option` migration.

## Verification

- `scripts/audit-phase594-scanner-resolver-ast-lowering.cjs` performs a production-source lexical audit after stripping comments and string literals.
- Global `tsc --noEmit --skipLibCheck` remains blocked by missing `node` and `vitest/globals` type definitions in the supplied workspace.
- Targeted `tsc --noEmit --noResolve` checks were used on changed files; no remaining syntax/type diagnostics were found beyond expected unresolved-module and library-target diagnostics.
