# Phase 641 — Unused Surface Vacuum

Date: 2026-10-03

## Scope

Conservative unused-file vacuum after Phase 640.

## Action

`packages/react/tests/type-inference/type-audit.type-spec.ts` was verified as an isolated type-audit test artifact with no repository references outside itself. It was preserved in place and truncated to 0 bytes.

No file was deleted.

## Protected active surfaces

The following similarly named legacy surfaces remain non-empty because active exports/imports reference them:

- `packages/core/src/ir/domain/field-type/legacyConverter.ts`
- `packages/core/src/compiler/compatibility/boundary/legacyResolver.ts`

They are not dead files and therefore were not vacuumed.

## Semantic migration frontier

The remaining high-value work is semantic-authority migration rather than token-only deletion:

syntax evidence → upstream facts → semantic relations → constraints → recursive/SCC closure → witness/provenance → declarative rewrite → canonical Route IR → target dialect lowering.

The scanner/lexer is treated as evidence production; source-language vocabulary such as Laravel/PHP `null`, `??`, ternary, and route `any` is not deleted merely because the spelling matches a host-language prohibition.

## Research basis

MLIR canonicalization applies rewrite patterns iteratively toward a fixpoint and requires rewrite patterns to converge; MLIR also provides declarative rewrite rules and dialect conversion through conversion targets, rewrite patterns, and optional type conversion. These support moving semantic authority from handwritten control flow into declarative rule catalogs and rewrite engines.
