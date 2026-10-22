# Phase 2227 — Interface-First Invocation Integration Closure

## Scope

This phase starts upstream, before Laravel scanner wiring. It evolves the existing PHP invocation integration interface and its existing implementation. It adds no semantic authority, relation/foundation layer, or subscanner.

## Trace

1. `LaravelControllerInvocationSemanticJudgmentAuthorityInterface` consumes a closed invocation input ADT.
2. The authority binds a supplied whole-file pipeline result through `PhpSourceInvocationSemanticSourceBindingAuthorityInterface`.
3. `phpSourceInvocationPipelineEvidenceFromSourceBinding` converts that binding judgment into an explicit composition-evidence variant.
4. `PhpSourceInvocationSemanticPipelineIntegrationInterface.project` owns the mapping from composition evidence to integrated invocation outcome.
5. `LaravelControllerResponseSemanticPipelineInterface.judgeIntegratedResponse` accepts the exact generic invocation judgment and returns `LaravelControllerIntegratedResponseJudgment<InvocationJudgment>`.
6. The production Laravel scanner forwards that same invocation judgment to integrated-response judgment and AST projection. This phase does not change that wiring.

## Defect closed

Before this phase, the integration interface exposed one broad `project(evidence)` signature. Its return type allowed `php_source_invocation_integration_not_connected` even when the input evidence was a connected pipeline or an explicit source-binding rejection. The runtime switch preserved the distinction, but the type contract did not express it.

The existing interface now has outcome-indexed overloads:

- not-connected evidence → not-connected result only;
- connected or source-binding-rejected evidence → result excluding not-connected;
- a broad overload remains for callers whose evidence is not narrowed yet.

The existing source-binding projection helper now returns the evidence subset that excludes not-connected. Thus the provided-pipeline path reaches the integration authority with a narrower contract. The integration contract version is 11 and explicitly records the input/outcome closure rule.

## Ownership boundaries retained

- Source binding owns source identity validation, not invocation classification.
- Invocation judgment authority owns invocation integration outcome and retains `not_connected`, `source_binding_rejected`, `complete`, and `blocked` as distinct outcomes.
- `LaravelControllerResponseSemanticPipelineInterface.judgeIntegratedResponse` owns the correlated HTTP response judgment; its generic result remains indexed by the exact invocation judgment type.
- AST projection consumes the invocation/response pair without reconstructing either judgment.
- The Laravel scanner remains a caller/composer; this phase does not move semantic rules into scanner control flow.

## Remaining migration debt

The legacy path `scanControllerAction` → `resolveControllerActionContract` → `resolveResponse` / `resolveResponseAttributeAst` still exists. This phase does not claim that legacy action-response derivation has been retired. The next step is to audit the existing compatibility projection contract and route consumers to canonical response products only after their required data is represented upstream.

## Validation

- `packages/core/scripts/audits/audit-phase2227-interface-outcome-closure.cjs`: 7/7 structural checks passed.
- ZIP integrity checked separately.
- No full TypeScript typecheck, Vitest run, or build was performed.
