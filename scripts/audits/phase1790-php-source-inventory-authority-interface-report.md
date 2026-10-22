# Phase 1790 — PHP source inventory authority interface first

## Trace finding

Phase 1789 established namespace-region inventory output types, but did not define the authority boundary that accepts whole-file parser coverage and publishes a complete/incomplete inventory judgment. That left a semantic gap: an output contract existed without a first-class upstream interface for validating the evidence that authorizes completeness.

## Interface changes

- Evolved `PhpFunctionResolutionSourceInventoryContract` to version 2 and added ordered authority rules.
- Added `PhpFunctionResolutionSourceInventoryCoverage`, a closed complete/incomplete parser-coverage judgment.
- Added `PhpFunctionResolutionSourceInventoryInput`, carrying source-file identity, whole-file span, namespace-region inventory candidates, and explicit parser coverage evidence.
- Added `PhpFunctionResolutionSourceInventoryAuthorityInterface.inspect`, which owns validation/publication of the source-wide inventory result and does not own function-name resolution.
- Extended the invocation integration pending blockers to explicitly record that the source-wide inventory authority is not yet connected to name resolution and the namespace inventory is not yet bound to the invocation batch.

## Ownership boundaries preserved

- `PhpFunctionNameResolutionAuthorityInterface` remains the owner of PHP function-name resolution.
- `PhpFunctionInvocationSemanticAuthorityInterface` remains the owner of invocation judgment derivation from a completed resolution judgment.
- The existing invocation batch closure authority remains the owner of batch closure.
- The existing integrated response retains its `phpFunctionInvocations` field; no parallel response layer was introduced.
- Scanner wiring was intentionally not changed in this interface-first phase. It must not fabricate a complete source inventory or an empty invocation batch.
- No `semantic/foundation` or `semantic/relations` dependency was introduced.

## Remaining work

1. Implement the source inventory authority against the new interface and test source-file/region/span bindings.
2. Extend invocation source inventory so each invocation environment is proven to reference a region from the same complete source inventory.
3. Build whole-file PHP namespace/import/function declaration evidence from parser output.
4. Derive name-resolution inputs and invocation judgments from that evidence, close the batch, then connect the validated/rejected result to the existing integrated response.
5. Only after all consumers migrate, audit and remove obsolete subscanners.

## Audit limits

The Phase 1790 audit is static contract-shape validation. No TypeScript build or end-to-end parser integration test was run. The scanner still supplies the explicit pending integration state.

## Official references

- PHP namespace declaration and scope rules: https://www.php.net/namespaces.definition
- PHP namespace/function fallback FAQ: https://www.php.net/namespaces.faq
- TypeScript discriminated unions and exhaustiveness: https://www.typescriptlang.org/docs/handbook/2/narrowing.html
