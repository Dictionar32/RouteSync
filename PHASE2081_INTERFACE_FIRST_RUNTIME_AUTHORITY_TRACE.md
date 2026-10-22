# Phase 2081 — Interface-first runtime authority trace

## Scope

This phase performs a reproducible static trace against Phase 2080. It does not pretend that a source audit is a production migration. No production TypeScript was changed in this phase; the new audit script checks the actual architectural boundary and reports the remaining blockers explicitly.

## Trace

`Laravel source evidence → invocation judgment → declaration selection ADT → action contract derivation → integrated response judgment → AST projection judgment → correlated scan artifact → downstream consumers`.

## Findings verified by the audit

1. Invocation judgment is modeled as a discriminated union.
2. Declaration selection already distinguishes complete and blocked ancestry outcomes.
3. Integrated response judgment is present.
4. The Laravel scanner still imports/uses `semantic/relations` operations.
5. The Laravel scanner still calls `scanControllerAction`.
6. Declaration authority still contains semantic helpers (`sameClassIdentity`, `selectActions`, `ancestryFor`) and nested ancestry traversal.
7. The action subscanner still calls `resolveControllerActionContract`.
8. The action contract implementation still imports relation operations and delegates derivation to controller subscanner modules.

## Interface-first decision

Do not introduce a new folder, `foundation` layer, or parallel authority. Evolve the existing action contract and declaration authority in place. The action boundary must eventually return a closed semantic judgment, not a directly derived contract; callers must consume that judgment without rebuilding its semantics. Declaration and ancestry outcomes must remain closed and source-correlated. Preserve the existing invocation → integrated response → AST projection correlation.

Do not remove relation operations before every active consumer has been migrated. A one-file import cleanup would conceal rather than solve the dependency. Do not relocate helper functions: the goal is upstream ownership of decisions, not merely moving implementation.

## Why this phase stops short of production migration

The current action resolver returns `ControllerActionContract` directly and has no established domain-specific rejection/blocker evidence at its public boundary. Adding a union without first identifying valid domain rejection and blocker types would invent semantics and break consumers. Therefore the next production change must first reconcile existing upstream evidence and outcome types, then evolve the contract and migrate its callers together.

## Verification

Run `node scripts/audits/audit-phase2081-interface-first-runtime-authority.cjs` from the repository root. The 8 checks pass when the current architectural facts are found, including unresolved relation/subscanner dependencies. This audit is not a build, typecheck, test suite, or proof of executor-only runtime. No build/typecheck/Vitest was run in this phase.
