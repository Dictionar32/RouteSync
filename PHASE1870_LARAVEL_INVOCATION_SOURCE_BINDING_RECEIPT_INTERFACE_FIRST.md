# Phase 1870 — Laravel invocation source-binding receipt, interface first

## Trace

`PhpSourceInvocationSemanticSourceBindingJudgment` → `PhpSourceInvocationSemanticPipelineCompositionEvidence` → `PhpSourceInvocationSemanticPipelineIntegrationResult` → `LaravelControllerInvocationSemanticJudgmentInterface.response` → `LaravelControllerScanArtifact.invocationJudgment` → `LaravelControllerScanJudgment` → `LaravelResourceIntegratedResponse.controllerScan`.

The prior contract retained the source-binding rejection judgment, but successful source binding was converted into `php_source_invocation_pipeline_connected` with only `pipelineResult`. The integrated `complete` and `blocked` variants then retained the pipeline result but dropped the exact successful binding judgment. That weakened the integrated response's provenance even though the source-binding authority had already validated it.

## Interface/model correction

- Connected composition evidence now requires the exact closed source-binding judgment alongside the pipeline result.
- Integrated `complete` and `blocked` outcomes retain that exact judgment. The four outcomes remain discriminated and distinct: not connected, source binding rejected, complete, and blocked.
- The integration authority forwards the same `sourceBinding` object; it does not rebuild the judgment or infer identity from array position.
- The Laravel controller judgment contract and resource invocation integration model explicitly preserve this receipt.
- The legacy controller-dataflow entry point now accepts a closed source-binding judgment instead of accepting an unbound pipeline result as connected evidence.
- No new `semantic/foundation` dependency was introduced. This phase does not retire controller subscanners or empty `semantic/relations`; those require a separate full consumer trace.

## Validation

Run `node scripts/audits/audit-phase1870-laravel-invocation-source-binding-receipt-interface-first.cjs`. This is a source-contract audit, not a TypeScript compilation or full build.
