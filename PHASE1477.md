# Phase 1477 — PHP parameter type semantic authority

## Trace

`PhpParameterTypeAst` is already typed source evidence (`primitive | named | nullable`) from the lexer. Two runtime projection paths were independently interpreting that evidence:

- `packages/core/src/compiler/scanner/subscanners/resource/resourceUpstreamExpressionMappings.ts` had its own primitive constructor table and recursive nullable mapping.
- `packages/core/src/compiler/scanner/subscanners/resource/resourceUpstreamExpressionCanonical.ts` had a second recursive resolver with a different array mapping.

This duplication meant the same PHP type could produce different `TypeExpression` semantics depending on the consumer.

## Contract flow

`typed PhpParameterTypeAst → PhpParameterTypeEvidence → phpParameterTypeAlgebra.resolve → closed PhpParameterTypeJudgment → resource mapping projection → canonical upstream expression`

- `phpParameterTypeInterface.ts` defines the closed evidence and judgment union.
- `phpParameterTypeAlgebra.ts` owns primitive, named, and nullable type interpretation.
- `resourceUpstreamExpressionMappings.ts` adapts already-classified AST variants to evidence and projects the judgment to `TypeExpression`.
- `resourceUpstreamExpressionCanonical.ts` now reuses that one projection; its duplicate semantic resolver was removed.

Array's legacy projection was inconsistent (`unspecified` in one path, `json` in another). The shared algebra now uses `unspecified`, preserving the method/closure parameter mapping rather than making consumer choice change the meaning.

## Verification

- `node scripts/audits/audit-phase1477-php-parameter-type-algebra.cjs`: 6/6 passed.
- Strict TypeScript checking was attempted. The new interface/algebra produced no diagnostics, but the wider imported source graph has pre-existing TypeScript errors in unrelated domain, AST/dataflow, and scanner files. The scanner slice is therefore **not** claimed to typecheck cleanly.
- Vitest and package build were not run because dependencies (`node_modules`, including `vitest`/`tsdown`) are absent in this workspace.

## Boundary

The interface is a compile-time contract; it does not execute. `phpParameterTypeAlgebra` is the executable semantic authority. The scanner remains responsible for adapting typed AST evidence and projecting the judgment, not deciding primitive/named/nullable semantics again.
