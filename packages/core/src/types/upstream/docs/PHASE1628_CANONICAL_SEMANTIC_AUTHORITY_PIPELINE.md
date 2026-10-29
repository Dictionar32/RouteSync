# Phase 1628 — Canonical Semantic Authority Pipeline

## Error-driven architectural finding

The AST authority pipeline previously exposed `astSemanticInterface.reasoning` as a strategy/proof descriptor. That told consumers *which* reasoning strategy was declared, but did not expose the canonical operations that own closure, proof verification, and accepted/rejected closure assessment.

## Contract evolution

`AstSemanticAuthorityPipeline.semanticAuthority` now exposes the existing `AstSemanticInterface` contract itself. Pipeline consumers can depend on the one canonical authority for:

- fact and judgment construction;
- fixed-point closure;
- closure-to-request and derivation-ledger verification;
- atomic close-and-verify assessment;
- downstream fact projection.

This is an evolution of the existing pipeline contract, not a new executor or a parallel semantic interface. Both pipeline constructors bind the same `astSemanticInterface` authority. Stage interfaces remain the stage-specific evidence/proof transport.

## Ownership findings

- `semantic/foundation` is not safe to delete as a folder: it owns generic relation algebra, collection, membership, rewrite, and execution-plan machinery. It has direct scanner consumers and consumers outside the scanner.
- `compiler/frontend/php/routeAst/semanticRewriteEngine.ts` is a compatibility facade to the foundation-owned generic solver.
- `compiler/frontend/php/routeAst/semanticClosureEngine.ts` delegates to the upstream semantic closure model.
- `compiler/frontend/php/routeAst/semanticRelationProgram.ts` delegates to the upstream program contract.
- Domain-specific relation catalogs and evidence adapters may remain in scanner while generic reasoning mechanics remain in their canonical owners. They should not implement another generic solver.

## Error policy

When an error indicates missing closure evidence or a failed invariant, change the semantic judgment/authority contract first. When it indicates a type mismatch across stages, repair the interface or wiring. Do not add a new runtime executor to conceal either class of error.

## Verification boundary

The Phase 1628 static audit checks authority exposure and ownership direction. It does not claim full TypeScript build or test success; those must be run in an environment with project dependencies installed.
