# Phase 1713 — Static Rule-to-Obligation Interface Contract

## Scope

This phase is interface/model-first. It defines a closed rule-to-obligation relation for static invocation and attaches it to the authority-validation contract. It does not implement static invocation algebra, authority validation, runtime execution, or Laravel scanner wiring.

## Contract changes

- Added `InvocationStaticSemanticRuleObligationRelation`, a discriminated union assigning each obligation kind to exactly one semantic rule.
- Added `InvocationStaticSemanticRuleObligationContract` and `INVOCATION_STATIC_SEMANTIC_RULE_OBLIGATION_CONTRACT` with canonical rule order, ownership, applicability, and closure laws.
- Attached the rule/obligation contract to `InvocationStaticSemanticAuthorityValidationContract` (version 2).
- Advanced static model and coverage contracts to version 8, pipeline contract to version 21, and Laravel controller semantic boundary to version 6.
- Exported the new contract and types from `packages/core/src/index.ts`.
- No production wiring, scanner implementation, semantic algebra, or runtime authority implementation was changed.

## Verification

Run `npm run audit:phase1713-static-rule-obligation-contract`.

The audit checks the relation's closed variants, ownership of target/binding/effect obligations, canonical ordering, contract version synchronization, public exports, and continued honesty that static invocation algebra/authority are not yet implemented.

Build/typecheck status must be reported separately; an audit pass is not a build pass.
