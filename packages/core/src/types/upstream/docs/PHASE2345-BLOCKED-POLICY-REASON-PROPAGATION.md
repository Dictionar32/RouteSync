# Phase 2345 — Blocked policy reason propagation

## Root cause

`EffectiveControllerActionPolicy` already had a closed blocked variant whose reason union included `controller_policy_inventory_unavailable`. The existing `ControllerActionPolicyRelation` contract narrowed `controller_action_policy_blocked.reasons` back to `ControllerPolicyActionScopeBlockReason[]`. That downstream contract was weaker than the canonical upstream judgment and could not faithfully represent the inventory-completeness failure introduced in Phases 2342–2344.

## Change

- Evolved the existing `ControllerActionPolicyRelation` contract to consume `EffectiveControllerActionPolicyBlockReason[]`.
- Kept `controllerActionPolicyRelations` as the single canonical projection and preserved the exact `policy.judgment.reasons` payload.
- Added a regression case proving that an unavailable inherited controller inventory remains a blocked relation with its controller identity intact.
- No parallel interface, V2 type, foundation dependency, or new authority was introduced.

## Trace

`EffectiveControllerActionPolicyCatalogJudgment` → `EffectiveControllerActionPolicyRuntimeExecutorInterface.execute` → `EffectiveControllerActionPolicySemanticAuthorityInterface.judge` → `EffectiveControllerActionPolicy` blocked ADT → `controllerActionPolicyRelations` → `CompleteLaravelSourceModel` relation projection → manifest construction.

The manifest builder already preserves a blocked source-AST projection as `ManifestBuilderBlockedJudgment`; this phase corrects the relation contract so the policy reason is not narrowed or misclassified before that boundary.

## Validation

Run `node scripts/audits/audit-phase2345-blocked-policy-reason-propagation.cjs` for structural checks. The Vitest regression is added but requires the project's installed dependencies to execute. No claim is made that TypeScript type-check, Vitest, CLI end-to-end, or package build has run.

## Official references

Laravel controller middleware distinguishes class-level and method-specific scope. TypeScript discriminated unions support carrying domain-specific blocked variants through consumers without weakening them to unrelated reason types.
