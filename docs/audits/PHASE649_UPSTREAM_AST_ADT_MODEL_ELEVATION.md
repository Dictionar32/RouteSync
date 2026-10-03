# Phase 649 — Upstream AST ADT Model Elevation

## Scope

Workspace: `/mnt/data/RouteSync-main`

This phase continues the upstream frontier only: PHP AST → upstream AST/ADT → relational semantic mapping → solver/rewrite boundary. Target projection is deliberately out of scope.

## Trace

```text
PHP syntax ADT
  ↓
PHP AST evidence
  ↓
relation candidate / requirement
  ↓
relation witness / rewrite
  ↓
proof-carrying upstream AST node
  ├─ identity
  ├─ semantic
  ├─ evidence
  ├─ provenance
  └─ derivation
  ↓
semantic analysis / fixed point
```

## Interface elevation

`packages/core/src/types/upstream/ast.ts` now defines a reusable canonical node algebra:

- `AstNodeKind` — closed vocabulary for upstream AST node identity.
- `AstNodeIdentity<K>` — source-derived identity usable as a relational key.
- `AstEvidence<S>` — source-language observation, kept separate from semantic meaning.
- `AstProvenance<O>` — semantic origin plus exact `SourceSpan`.
- `AstRuleName` / `AstWitnessName` — typed derivation names instead of free-form semantic control state.
- `AstDerivation` — relation/rewrite derivation attached to the node.
- `CanonicalAstNode<K,S,E,O>` — proof-carrying attributed AST contract.
- `ExpressionAst` now instantiates that contract.

The important architectural change is not a field rename. The interface now models an AST node as an attributed semantic term whose source evidence and derivation are first-class data.

## Expression producer

`packages/core/src/compiler/scanner/subscanners/expressionAstCanonical.ts` now emits:

- source-derived `AstNodeIdentity`;
- canonical upstream `semantic`;
- PHP `evidence`;
- `provenance`;
- relation/rewrite `derivation` with typed ADT names.

The source surface remains intact. PHP `ternary`, `coalesce`, nullsafe operations, constructors, etc. remain evidence rather than being erased lexically.

## Closure statement boundary

`packages/core/src/types/upstream/expression.ts` gained an explicit `ClosureStatement` unsupported branch with typed reasons:

- `while_statement`
- `switch_statement`
- `unset_statement`
- `include_statement`

`resourceUpstreamExpressionClosure.ts` no longer turns those four source constructs into host-language exceptions. They cross the upstream boundary as explicit semantic ADT evidence with `SourceSpan`. This preserves information for diagnostics, later legalization, and rewrite/solver stages.

## Inactive-file vacuum

Preserved paths were **not deleted**. Confirmed unused backup artifacts were truncated to zero bytes:

- `packages/core/src/types/upstream/ast.ts.bak-interface-property`
- `packages/core/src/types/upstream/property.ts.bak-interface-property`

No active implementation file was vacuumed speculatively.

## External design trace

The elevation follows several convergent compiler/semantic-system principles:

1. MLIR canonicalization applies rewrite patterns iteratively toward a fixpoint and treats unstable/cyclic rewrites as correctness bugs; its pattern infrastructure separates pattern definition from application.
2. MLIR DRR/PDLL makes rewrite intent declarative rather than encoding the transformation in host-language control flow.
3. K models executable semantics as configurations plus rewrite rules, keeping semantic transitions in the rewrite system.
4. SeaHorn lowers program reasoning into constrained Horn clauses before solver/model-checking backends.

RouteSync's corresponding model is therefore:

`source evidence → relation facts → constraints → witness → rewrite → attributed AST/IR → fixed-point analysis`.

## Frontier audit

Existing audit scripts were rerun after the changes:

- `audit:phase587-upstream-scanner` — exits successfully, but the upstream lexical surface is not yet closed. `expression.ts` remains the largest upstream optionality frontier.
- `audit:phase511` and `audit:phase513` — execute successfully but remain broad lexical frontier detectors and report unrelated residuals; they are not proof of semantic leakage by themselves.
- `audit:phase591-scanner-frontier` — identifies `resourceRouteGroupDescriptor.ts` as a concrete remaining scanner construction frontier.
- `audit:phase589-semantic-type-relational` — identifies semantic type lowering as another concrete frontier.
- `audit:phase595-analysis-relational` — remains substantially wider than the upstream boundary and should be handled through relation/fixed-point migration rather than lexical substitution.

## Remaining highest-value migrations

### A. Upstream optionality

`packages/core/src/types/upstream/expression.ts` still contains 17 textual `undefined` occurrences after the closure migration, concentrated in query/iteration operation fields. These should become explicit `Option<T>` algebra, with scanner adapters producing `none/some` witnesses through relation lookup rather than sentinel absence.

### B. Scanner construction frontier

`resourceRouteGroupDescriptor.ts` still uses host `Map`, `new`, `if`, array `.find/.filter`, `undefined`, nullish selection, and assertions as construction authority. The next migration should introduce a route-group relation catalog and a closed `RouteGroupClassification` ADT, then select a descriptor through a solver/rewrite witness.

### C. Resolver graph

Graph resolution is structurally closer to the desired model, but remaining compatibility/procedural constructors must be moved behind relation facts and witnessed resolution results.

### D. AST/upstream mapping

Continue replacing exception-based unresolved mappings with explicit `unsupported/unresolved` ADTs carrying source provenance and rule identity.

### E. Semantic type lowering

The type-expression relation catalog exists, but several lowering functions still use exception fallbacks and host assertions. The next model should return an explicit lowering witness/result ADT and let the solver determine the legal projection.

## Verification limitation

Global `tsc --noEmit` was attempted with the system TypeScript binary. The workspace currently lacks `@types/node` and `vitest/globals`, so the compiler stops at missing ambient type definitions before reporting source-level diagnostics. No full typecheck success is claimed.
