# Phase 1627 — Semantic AST reasoning interface authority

## Trace and architectural decision

This phase evolves the existing `AstSemanticInterface` rather than creating a parallel semantic AST interface.

### Source of semantic authority

- `packages/core/src/types/upstream/astSemanticInterface.ts` owns canonical AST semantic facts, rule closure, closure certificate construction, and proof-ledger replay through `verifyClosure`.
- Before this phase, consumers could call `close` and `verifyClosure` separately and accidentally treat a merely closed result as accepted without using the verification result.
- The interface now declares its reasoning strategy through `reasoning: SemanticReasoningContract<'declarative_relation_rewrite_fixed_point'>` and exposes `closeVerified(request)`. This returns a closed discriminated assessment: `accepted` only when closure is closed and its proof replay verifies; otherwise `rejected`.
- `packages/core/src/types/upstream/astSemanticAuthorityPipeline.ts` now carries the same canonical reasoning contract instead of describing the strategy only as a string field (`closure` / `rewriteEngine`). Both constructors use `astSemanticInterface.reasoning`, preventing strategy metadata from becoming a separate authority.

### Scanner trace

The scanner currently imports AST semantic term helpers from `astSemanticInterface.ts` in `ResourceModelResolver.ts`, `semanticDataFlowAnalyzer.ts`, and `resourceSemanticMappingRelations.ts`. The scanner also has a distinct relational closure path under `compiler/frontend/php/routeAst/`, including `semanticClosureEngine.ts`, `semanticRelationTheory.ts`, `semanticRelationalBehaviorKernel.ts`, and `semanticRelationProgram.ts`.

This phase does **not** claim those scanner closure implementations have been migrated to `closeVerified`. That is a separate wiring migration requiring evidence that the rule vocabularies and proof invariants are equivalent. The architectural boundary is now explicit and testable; a subsequent phase should trace each scanner closure consumer and either wire it to the canonical AST authority or document why it belongs to a different semantic domain. Do not merge generic data-flow reachability and AST judgment merely because both use fixed-point closure.

### Runtime executor relationship

The request-type derivation executor remains a separate domain authority. Phase 1626 moved assessment integrity checks behind `RequestTypeDerivationSemanticPipelineInterface.validateAssessment`; its defensive runtime envelope guard and input-to-proof binding check remain executor boundary responsibilities. The AST closure contract should not be forced into that unrelated request-type assessment shape.

## Validation

- `node scripts/audits/audit-phase1627-semantic-ast-reasoning-interface.cjs` checks the canonical interface, verified-close invariant, cross-stage pipeline wiring, and tests for accepted/rejected closure.
- Focused TypeScript invocation reports pre-existing diagnostics in other upstream/domain modules. No diagnostics were emitted for `astSemanticInterface.ts` or `astSemanticAuthorityPipeline.ts` in the captured output, but a clean project typecheck, build, and Vitest run remain unverified because dependencies are not installed in this workspace.
