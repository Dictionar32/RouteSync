# Phase 1481 — Contextual PHP Type Evidence

## Semantic boundary

PHP `self` and `parent` are not ordinary named types. Their interpretation depends on class declaration evidence. The upstream atom contract now accepts optional `PhpTypeClassContext` containing `enclosingClass` and `parentClass` facts supplied by an upstream declaration analysis.

- `self` resolves only when `enclosingClass` is supplied.
- `parent` resolves only when `parentClass` is supplied.
- `static` remains `unsupported/context_required` because the current target `TypeExpression` vocabulary does not faithfully represent PHP late-static binding.
- Invalid class-context names return a malformed judgment rather than being silently accepted.

The context is propagated through the PHP type-expression grammar and through nested nullable parameter evidence. No scanner-side lookup or semantic fallback was introduced. Existing consumers that do not possess class context keep the safe `unsupported` result.

## Changed files

- `packages/core/src/types/upstream/phpTypeAtomInterface.ts`
- `packages/core/src/types/upstream/phpTypeAtomAlgebra.ts`
- `packages/core/src/types/upstream/phpTypeExpressionInterface.ts`
- `packages/core/src/types/upstream/phpTypeExpressionAlgebra.ts`
- `packages/core/src/types/upstream/phpParameterTypeInterface.ts`
- `packages/core/src/types/upstream/phpParameterTypeAlgebra.ts`
- `packages/core/src/types/upstream/index.ts`
- `packages/core/src/types/upstream/__test__/php-type-atom-judgment.phase1480.test.ts`
- `scripts/audits/audit-phase1481-contextual-php-type-evidence.cjs`
- `package.json`

## Verification

- Phase 1481 source audit: 8/8 checks passed.
- Phase 1480 judgment audit: 10/10 checks passed.
- Vitest and package build were not run in this workspace because local project dependencies are unavailable. The audit is static and does not substitute for TypeScript compilation or runtime tests.
