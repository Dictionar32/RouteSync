# Phase 1687 — Invocation Rule Meaning Model

## Intent

Elevate invocation semantics from a collection of descriptive rule names and separately maintained trace policies into a closed, typed domain meaning catalog. This phase is interface/model-first: it does not migrate scanner wiring or change runtime execution.

## Model changes

- Added `InvocationSemanticRuleMeaningSignature`, a discriminated union with a distinct signature for each semantic rule, including judgment closure.
- Each signature explicitly models the semantic question, admissible evidence, established meaning, non-conclusion, obligation ownership, and proof-witness meaning.
- Added `InvocationSemanticRuleMeaningCatalog`, a mapped type indexed by the complete `InvocationSemanticRuleId` union. Every rule id must have its corresponding signature; missing catalog entries become type errors.
- Added `INVOCATION_SEMANTIC_RULE_MEANING_SIGNATURES` to `InvocationSemanticModel.ruleMeanings`, making the catalog part of the canonical model rather than a detached helper.
- Result-emission and exception-emission meanings have distinct rule signatures and witness kinds.
- Exported the meaning catalog and its types from the public package API.
- Invocation semantic model version: 17 → 18.
- Invocation semantic contract version: 31 → 32.
- Invocation semantic pipeline contract version: 8 → 9.

## Architecture boundary preserved

No scanner, authority, algebra implementation, or runtime executor wiring was changed in this phase. The current scanner still delegates whole-knowledge analysis to `invocationSemanticRuntimeExecutor.executeAll(...)`; the executor remains a delegation boundary. This phase makes the model more complete before wiring migration, but does not claim the whole scanner path is already migrated to the pipeline interface.

No `any`, generic callable boundary, or `core/src/semantic/foundation` dependency was introduced.

## Verification

- Phase 1680 audit: 13/13.
- Phase 1681 audit: 12/12.
- Phase 1682 audit: 17/17.
- Phase 1683 audit: 15/15.
- Phase 1684 audit: 12/12.
- Phase 1685 audit: 10/10.
- Phase 1686 audit: 10/10.
- Phase 1687 audit: 11/11.
- Version-sensitive Phase 1674 audit: 9/9.
- Version-sensitive Phase 1675 audit: 12/12.
- Phase 1677 algebra implementation audit: 21/21.
- Focused TypeScript strict check for the invocation interface modules passed.
- A broader check through the package public entrypoint reports existing unrelated repository errors (including unavailable `axios` typings and errors in other compiler/type modules); it is not a clean full-repository typecheck.
- Full repository build was not run.
