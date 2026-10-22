# Phase 2628 — Upstream Policy Identity Closure

## Scope
Follow the existing implementation from Laravel controller-action policy evidence through upstream semantic authority, identity binding, source-model ADT, manifest judgment, and CLI stop gates. This phase adds a repeatable structural regression audit; it does not claim runtime integration tests passed.

## Root-cause path
`controller/action policy evidence` → `effectiveControllerActionPolicySemanticAuthority` → `controllerActionBindingAuthority` → `sourceModelReferenceIndexBuilder` → `CompleteSourceModelBuildResult` → `ManifestBuilderJudgment` → CLI stop gate.

The root risk is not merely a missing error message: unresolved or ambiguous controller/action identity must not be converted into a successful policy binding or disappear before manifest publication. The existing source-model implementation now represents those conditions as blocked relations, wraps source-model completion in a closed complete-or-blocked ADT, and checks the blocked variant before dataflow projection. `scan`, `sync`, and drift audit exit non-zero on the upstream manifest blocker.

## Interface-first contract pattern
The canonical index builder and complete source-model builder are exported as typed operation values (`export const name: Interface = Object.freeze(...)`). Semantic judgment stays in upstream authorities; manifest wiring only passes the closed result along and gates projection.

## Verification
Run:

- `node scripts/audits/audit-phase2628-upstream-policy-identity-closure.cjs`
- `node scripts/audits/audit-phase2627-upstream-manifest-source-model-gate.cjs`
- `node scripts/audits/audit-phase2626-source-model-policy-inventory-closure.cjs`
- `node scripts/audits/audit-phase2625-controller-action-identity-ambiguity.cjs`

These are source-structure regression checks. They do not replace TypeScript typecheck, Vitest, package build, or CLI end-to-end tests against Laravel fixtures.
