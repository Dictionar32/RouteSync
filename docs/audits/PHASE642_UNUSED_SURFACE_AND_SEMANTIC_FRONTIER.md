# Phase 642 — Unused Surface Proof + Semantic Frontier Audit

## Scope

This phase continues the conservative unused-file vacuum from Phase 641 and re-audits the active compiler frontier:

- scanner / lexer
- upstream AST mapping
- graph resolver
- analysis / recursive closure
- semantic type lowering
- parser / adapter / generic / solver / syntax-error / core / ternary surfaces

The repository rule is preservation-first: an unused file is **truncated to 0 bytes**, never deleted.

## Unused-surface result

No additional non-empty production `.ts` file was sufficiently proven unused by repository-reference inspection in this pass.

Therefore **no additional active file was truncated** in Phase 642.

The existing zero-byte surfaces remain preserved, including the previously proven backup/test/generation remnants.

## Explicitly retained active surfaces

The following were inspected and were not vacuumed because they remain reachable through active exports/imports:

- `packages/cli/src/resolvers/intent/cartGroupDetector.ts`
- `packages/cli/src/resolvers/intent/cartModelResolver.ts`
- `packages/core/src/semantic/plugins/ResourceGraphResolver.ts`
- `packages/core/src/ir/domain/field-type/legacyConverter.ts`
- `packages/core/src/compiler/compatibility/boundary/legacyResolver.ts`

A filename containing `legacy` is not sufficient evidence of dead code.

## Semantic-frontier observation

`ResourceGraphResolver` already expresses resource classification as a relation-backed rule catalog and witnesses rules through the relational sequence layer. Its remaining host-language constructs are implementation mechanics around relation evaluation, not an excuse to erase the resolver.

The next migration should therefore move semantic authority further downward:

```text
syntax evidence
  -> upstream facts
  -> semantic relations
  -> constraints
  -> SCC / recursive fixed point
  -> witness + provenance
  -> declarative rewrite
  -> canonical Route IR
  -> target dialect lowering
```

The TypeScript target lowering layer remains a projection boundary. Target vocabulary such as TypeScript type tokens must not be confused with semantic authority in the source model.

Likewise, Laravel/PHP source vocabulary such as `null`, `??`, ternary, and route `any` is retained as source evidence where it is part of the parsed language rather than treated as dead TypeScript control vocabulary.

## Research basis

MLIR canonicalization applies registered rewrite patterns iteratively until a fixpoint or configured rewrite bound and requires repeated patterns to converge. Declarative Rewrite Rules express source patterns, constraints, and result patterns separately from host-language rewrite boilerplate. PDLL provides a declarative pattern language for compiler rewrites. Soufflé organizes recursive relation dependencies into SCCs and evaluates mutually recursive relations to a fixpoint.

These principles support treating RouteSync as a domain-specific compiler whose semantic middle-end is relation/fixpoint/rewrite driven rather than host-control-flow driven.

## Verification

- No files were deleted.
- No additional non-empty file was vacuumed without sufficient reachability evidence.
- Existing zero-byte files remain path-compatible.
- Workspace remains build-source compatible with the preceding phase.
