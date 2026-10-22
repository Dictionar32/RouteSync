# Phase 2067 — Controller Dataflow Context Contract, Interface First

## Trace finding

The Phase 2066 lexical-context ADT existed upstream, but `controllerDataflowContract.ts` still propagated the context as an optional positional argument through its resource/model evidence projection helpers. That meant the explicit available/unavailable distinction was only materialized late in `staticCallOriginInput`, after several helper boundaries had already accepted an ambiguous optional value.

The same constructor accepted unused positional parameters (`ControllerParameterAst` and a source-file string), and supplied defaults for model classes while requiring a later context parameter. That shape was not a closed contract and obscured the actual evidence dependency.

## Change

- Added the named `ControllerDataflowContractInput` contract.
- Changed `createControllerDataflowContract` to consume one input value containing the AST evidence, return set, canonical response, model-class catalog, and explicit class-name-context evidence.
- Removed unused positional parameters and defaults from that boundary.
- Changed every nested resource/model-origin evidence helper to require `ControllerStaticCallClassNameResolutionContextEvidence`; no helper accepts an optional lexical context.
- At the descriptor boundary, an available lexical context is wrapped as `available`; a missing context becomes the explicit `unavailable` ADT exactly once.
- At the canonical AST projection path, missing lexical context is supplied explicitly as `unavailable` rather than synthesized as an empty namespace/import inventory.
- Reused the existing class-name resolution and resource-binding authorities. No duplicate invocation/response/AST authority and no relation/foundation subscanner were added.

## Function/const inventory boundary

This phase does **not** claim that all `function` or `const` declarations have been removed. It removes a loose positional API and optional-context propagation from one high-priority Laravel scanner dataflow path. Remaining AST traversal/evidence projection functions are still present and should be audited individually: a pure syntax projection is not the same as semantic judgment, and blindly moving every helper would only relocate runtime logic.

## Verification scope

The phase audit verifies the named input contract, explicit context ADT propagation, reuse of the existing upstream authority, and preserved invocation/integrated-response/runtime boundaries. It is a structural audit only; full TypeScript typecheck, build, and Vitest are not claimed.
