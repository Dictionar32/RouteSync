# Phase 2065 — Single Class-Name Judgment, Interface First

## Trace finding

`controllerStaticCallOriginAuthority` resolved a static-call class reference to `classReferenceJudgment` for rule applicability. The model-origin path then called `classReferenceResolutionRule.judge(input)` again from `modelClassIdentityRule`. This repeated semantic resolution inside one authority invocation, so the model catalog could be queried against a second derivation rather than the exact judgment already used for rule matching.

## Contract change

- `ControllerStaticCallModelClassIdentityRuleInterface.judge` now receives the existing `ControllerStaticCallClassReferenceResolutionJudgment`.
- `ControllerStaticCallOriginRuleInterface.judge` receives that same judgment.
- The authority resolves once, then passes the same closed ADT through rule selection and model identity matching.
- `ControllerStaticCallOriginAuthorityInterface.contractVersion` advances from 8 to 9.
- `ControllerStaticCallModelClassIdentityRuleInterface.contractVersion` is aligned at version 2.
- No new resolver, relation/foundation subscanner, invocation authority, response authority, or AST authority is introduced.

## Invariants

1. A resolved class identity is not recomputed after rule matching.
2. A blocked class-name judgment remains blocked when passed to model identity matching.
3. Model catalog matching uses the exact qualified identity in the supplied judgment.
4. Invocation semantic judgment, integrated response, AST/ADT projection, and runtime executor retain their existing ownership boundaries.
5. Runtime executor remains a delegator; it does not infer class names or model identity.

## Verification

The Phase 2065 structural audit checks the interface signatures, the absence of a second resolver call inside model identity, exact judgment forwarding, versioned contract, and existing invocation/response/runtime boundaries. The regression test deliberately supplies a class-name judgment that differs from the input's lexical context; the model rule must honor the supplied judgment rather than resolving the input again.

Full TypeScript typecheck, build, and Vitest are not asserted by this phase.
