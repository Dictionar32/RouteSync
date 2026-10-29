# RouteSync Phase 2486 — Resource Upstream Contract Connectivity

## Scope

This phase traces whether existing upstream Resource operation contracts are actually used by the production scanner path, rather than merely declared and exported.

## Findings and changes

1. `ResourceProducerInterface` already existed upstream, but `laravelResourceScanner.ts` imported the concrete `resourceProducer` object and called it directly. The scanner now binds the concrete PHP syntax types to `ResourceProducerInterface` using `LaravelResourceProducerOperations`, and calls `resourceProducerOperations.produceResult(...)`. The implementation is still the legacy subscanner; this phase does not pretend the implementation has been retired.
2. `ResourceModelKnowledgeDataFlowOperationsInterface` already existed upstream and typed `resourceModelKnowledgeDataFlowOperations`, but `twoPassRelationResolver.ts` bypassed that aggregate contract through compatibility aliases. The production resolver now calls `resourceModelKnowledgeDataFlowOperations.createResolutionFact`, `.createRelationFact`, and `.resolutionFor` directly.
3. `ResourceDefinitionBindingOperationInterface` is connected to `resourceBinder.ts`, but it is not the operation contract used by `laravelResourceScanner.ts`. It is therefore a separate/legacy binder path, not evidence that the canonical scanner's producer path is wired through it. It was not substituted for the producer because its input/output scope does not represent the complete production producer contract.

## Architecture guardrails

- Existing upstream contracts are reused; no parallel producer interface was introduced.
- Public scanner remains `export const laravelResourceScanner: LaravelResourceScannerInterface<...>`.
- No direct `semantic/foundation` import was introduced in the changed scanner or knowledge authority.
- The phase does not claim that `semantic/relations` or all subscanners have been retired.

## Known remaining work

- `resourceProducer.ts` remains under `scanner/subscanners` and still imports `semantic/relations`.
- `resourceFieldProducer.ts`, `resourceAstExpressionMapper.ts`, `resourceExpressionOperator.ts`, `twoPassRelationResolver.ts`, and `resourceBinder.ts` still use `semantic/relations`.
- `resourceSourceEvidence.ts` remains under `frontend/php` and still imports `semantic/relations`.
- `ResourceDefinitionBindingOperationInterface` remains a legacy binder path that is not used by the canonical scanner.
- Full typecheck, build, Vitest, and CLI end-to-end are not verified by this phase.

## Verification

Run:

```sh
node scripts/audits/audit-phase2486-resource-upstream-contract-connectivity.cjs
node scripts/audits/audit-phase2483-resource-operation-upstream-contracts.cjs
node scripts/audits/audit-phase2482-resource-evidence-single-inventory.cjs
node scripts/audits/audit-phase2475-resource-field-producer-interface-wiring.cjs
node scripts/audits/audit-phase1847-resource-model-fixed-point-interface.cjs
```

The connectivity audit checks contract-to-consumer wiring; it is not a substitute for typechecking or end-to-end execution.

## Technical references

- TypeScript Handbook, object types and interface contracts: https://www.typescriptlang.org/docs/handbook/2/objects.html
- Laravel Eloquent API Resources, transformation boundary between Eloquent models and JSON responses: https://laravel.com/docs/13.x/eloquent-resources
