# Phase 601 — Scanner / Resolver / AST Frontier

RouteSync is treated as a domain-specific compiler: Laravel route contracts are source evidence, the routing semantic model is the canonical IR, and Next.js is a target projection.

## Research basis

The frontier follows declarative compiler designs: Soufflé/Datalog relation facts and rules, MLIR PDLL/DRR match→rewrite patterns, WebAssembly declarative validation judgements, egglog equality saturation + Datalog, Statix scope-graph constraints, and CompCert semantic-preservation-oriented intermediate transformations.

## Cutover

- `PhpAstFactory` is now an immutable structural factory object instead of a class with constructor/static authority.
- The legacy `ContractInputBoundary` adapter is now a relation-oriented immutable boundary object; recursive conversion dispatches through its witness rather than class instances.
- Removed the unused duplicate scanner `modelDescriptorClass.ts` whose `ConditionalWrapperResolver` had no production imports.
- Removed the unused `MapperCodeBuilder.ts`; no production consumer referenced it after the relational mapper cutover.
- Scanner/lexer and resolver frontier was audited together with upstream mappings, compatibility boundary, semantic IR, and semantic type domain.

## Audit

The audit is AST-based rather than grep-only. It distinguishes actual TypeScript syntax (`new`, loops, conditional expressions, method calls, strict equality, etc.) from source-language vocabulary strings such as PHP `null` or AST kinds.

All production TypeScript files were transpile-validated. Full repository `tsc` remains environment-blocked where the required Node/Vitest type definitions are absent.

## Next frontier

Continue ownership migration in scanner cursor/token construction, route-AST evidence adapters, upstream relation construction, and remaining semantic-type lowerers. The desired boundary remains:

`lexical evidence → syntax relations → provenance/upstream relations → scope/resolver constraints → fixed-point closure → equality/rewrite saturation → canonical Route IR → analysis → Next.js lowering`.
