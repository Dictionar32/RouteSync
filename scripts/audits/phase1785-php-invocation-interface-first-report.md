# RouteSync Phase 1785 — PHP Invocation Interface-First Closure

## Scope

This phase deliberately changes the upstream interface model before Laravel scanner wiring. No scanner runtime, subscanner, or authority implementation was migrated in this phase.

## Trace findings

- `phpFunctionNameResolutionInterface.ts` defines the resolution contract and `PhpFunctionNameResolutionAuthorityInterface`, but the production resolver implementation is still absent.
- `phpFunctionInvocationSemanticAuthorityInterface.ts` had a batch-closure contract that named source-file and judgment-correlation obligations without representing every mismatch as a typed rejection reason.
- `invocationSemanticPipelineInterface.ts` already carries the validated/rejected PHP batch closure result inside the integrated response. The current composition preserves that result, but the Laravel scanner still does not supply it.
- `resourceUpstreamExpressionCanonical.ts` still submits pre-resolution call evidence. It must not be migrated until the upstream resolver and batch closure authority exist.
- The legacy call authority no longer imports `semantic/relations` or `semantic/foundation`; this phase adds no dependency on either.

## Interface changes

`PhpFunctionInvocationSemanticJudgmentBatchContract` is version 3. It now has an explicit ordered closure-rule tuple covering:

1. Inventory and completeness-witness file identity.
2. Source evidence file identity.
3. Resolution-environment file identity.
4. Resolution-input and syntax-evidence file identity.
5. Judgment/source/resolution correspondence.
6. Argument correspondence.
7. Source occurrence uniqueness.
8. Total inventory-to-judgment correspondence.
9. Rejection whenever a closure obligation fails.

The closed violation union now explicitly represents completeness-witness file mismatch, resolution-environment file mismatch, resolution-source file mismatch, name-syntax source mismatch, and judgment-resolution mismatch. This makes the interface's failure vocabulary match the invariants it claims to enforce; it does not pretend that a type alone validates runtime values.

## Static audit

Command:

`node scripts/audits/audit-phase1785-php-invocation-closure-interface.cjs`

Result: **14/14 static interface checks passed**.

Still pending and intentionally reported:

- Production PHP function name-resolution authority implementation.
- Batch-closure authority implementation.
- Laravel scanner integration of a real PHP invocation closure result.
- Migration of `resourceUpstreamExpressionCanonical.ts` to resolved-name evidence.

No TypeScript build or `npm run build` was run. This audit is not a compile or end-to-end verification.

## Semantic references

- PHP namespace rules distinguish fully qualified, qualified, and unqualified names; unqualified function names in a namespace can involve a namespace-local candidate and global fallback: https://www.php.net/manual/en/language.namespaces.faq.php
- Function imports and aliases affect name resolution: https://www.php.net/language.namespaces.importing.php
- TypeScript discriminated unions can preserve distinct success/failure outcomes and support exhaustive handling: https://www.typescriptlang.org/docs/handbook/unions-and-intersections.html

## Next sequence

1. Implement resolver authority from the existing interface contract.
2. Implement closure authority against the typed violation ledger.
3. Produce a real validated/rejected PHP invocation batch from upstream source evidence.
4. Integrate it into the existing integrated-response composition.
5. Migrate all Laravel scanner consumers.
6. Remove subscanners only after reference and behavior audits show no consumers remain.
