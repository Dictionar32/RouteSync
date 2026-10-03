# Phase 667 — AST Interface Highest: Scanner/Lexical Evidence Frontier

Phase 667 continues the Phase 666 closed AST semantic interface algebra by lifting lexical token access itself into a closed evidence interface.

## Model elevation

The scanner no longer treats token lookup as host-language optional property access at the migrated frontier. `tokenEvidence.ts` now exposes:

- `TokenEvidence`
- `TokenEvidenceJudgment`
  - `token_present`
  - `token_absent`
  - `token_value`
  - `token_kind`
- `TokenEvidenceInterface`
- relational `tokenValueEquals` / `tokenKindEquals`
- `tokenEvidenceInterfaceAt`

This makes lexical absence and token interpretation explicit semantic judgments instead of `?.`/non-null assertion mechanics.

## Migrated frontier

The closed evidence interface is now used by:

- `phpMethodParser.ts`
- `controllerMethodParser.ts`
- `arrayParser.ts`
- `controllerDataflowAnalyzer.ts`
- `resourceSemanticMappingRelations.ts`

The controller data-flow conditional branch no longer depends on an `as Extract` runtime cast; it is refined through the relational algebra.

## Architecture target

```text
Laravel/PHP source
  -> lexical evidence judgment interface
  -> closed source AST ADT
  -> upstream semantic mapping interface
  -> resolver/scope graph interface
  -> analysis/control-dataflow interface
  -> semantic type lowering interface
  -> Next.js/TypeScript target interface
```

The semantic authority remains:

```text
closed ADT
+ relations
+ solver
+ rewrite engine
+ fixed-point closure
+ derivation witnesses
+ preservation
+ cross-stage proof obligations
+ stage interfaces
```

## Verification

- Phase 667 audit: PASS.
- Phase 666 audit: PASS.
- Phase 525 inactive-file vacuum: PASS; no non-test inactive candidates remain.
- Targeted TypeScript transpilation: PASS for all changed TypeScript files.
- Full `tsc --noEmit`: still environment-blocked by missing `node` and `vitest/globals` type definitions; this is not claimed as a successful full typecheck.

## Remaining frontier

The next elevation remains in scanner/lexer and resolver graph surfaces, especially:

- `astClassifierEvidence.ts`
- `resourceUpstreamExpressionCanonical.ts`
- `resourceUpstreamExpressionMappings.ts`
- `resourceAstExpressionMapper.ts`
- `semanticRouteSyntaxRelations.ts`
- `phpAstExpressionSyntaxEvidenceRegistry.ts`
- `RouteDomainResolver.ts`
- `Presence` optionality adapters

These should be migrated to closed ADT/evidence interfaces and relational eliminators rather than merely patched.
