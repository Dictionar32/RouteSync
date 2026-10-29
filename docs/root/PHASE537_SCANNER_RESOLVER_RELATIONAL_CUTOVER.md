# Phase 537 — Scanner / Resolver Relational Cutover

Phase 537 continues the active frontend/php/resolver frontier. No inactive production path was vacuumed; the remaining paths are treated as live semantic authority and converted to declarative relation programs.

## Targets

- `compiler/scanner/descriptors/model/entity/modelDescriptorClass.ts`
- `compiler/scanner/subscanners/model/memberAccessorsParser.ts`
- `compiler/scanner/subscanners/model/modelAccessorExpressionMapper.ts`
- `compiler/frontend/php/routeAst/syntaxRelationProgram.ts`

## Architecture

`scanner evidence → relation candidates → witnesses/options → recursive relation execution → canonical semantic result`

`syntaxRelationProgram` now represents matcher/open/close presence explicitly as `RelationOption`, eliminating host-language absence sentinels from the syntax relation executor. Accessor and conditional-wrapper resolution use relation predicates, candidate witnesses, recursive projection and option folding.

## Verification

- Phase 537 forbidden-surface audit: all target counts zero.
- `transpileModule` diagnostics: zero for all targets.
- Repository-wide TypeScript typecheck remains environment-limited by missing `node` and `vitest/globals` type definitions; no full-repository typecheck claim is made.
