# Phase 2004 — Canonical Controller Return Semantic Product, Interface First

## Root cause found

Phase 2003 preserved which method produced each response-evidence item, but the response authority still unconditionally returned `response_contract_unresolved` for every source-binding-complete input. The canonical action already carries the stronger upstream `ControllerReturnSemantic` ADT at `action.semantic.returned`; the response authority was not consuming that model and was therefore discarding semantic knowledge already available upstream.

## Contract change

- The source-binding receipt now retains the complete canonical method-observation list in all three outcomes (complete, rejected, and empty), including methods that emitted no binding evidence. Per-item identity judgments remain one-per-evidence-item and continue to be owned by `LaravelSourceIdentitySemanticsInterface`.
- The existing response semantic product ADT gains `controller_method_return_semantics`, a non-empty, method-scoped collection that retains each exact `ControllerMethodEvidence`, `ControllerActionFlowContract`, method source, and existing `ControllerReturnSemantic` value.
- The existing response judgment authority consumes `observation.action.semantic.returned` directly. It does not parse PHP, classify expression syntax, infer a result from the descriptor candidate, or introduce a parallel return classifier.
- The existing runtime executor still delegates to the same authority; the controller scanner still forwards the resulting judgment to the existing AST projection authority.
- Source-binding rejection, empty evidence, and incomplete invocation outcomes remain blocked/rejected. A closed return-semantic product is emitted as the distinct `controller_response_return_semantics_complete` judgment only when invocation integration is complete and the non-empty evidence set is source-bound. It is deliberately not labelled `controller_response_complete`, because that would imply a concrete HTTP response product already exists.

## Scope boundary

This phase closes the method-level canonical return-semantic product. It does **not** claim that every `ControllerReturnSemantic` has already been mapped into a concrete `ResponseDefinition` / `ResponseResult` HTTP contract. That mapping remains a separate semantic projection obligation; the phase does not guess object/model/resource/void products where the existing ADT does not prove them.

No new `relation` or `foundation` subscanner is introduced. Existing subscanner references elsewhere in the repository are not claimed to be removed.

## Verification

The phase audit checks interface ownership, all-observation receipt retention, direct use of the existing ADT, closed outcome preservation, integrated runtime executor and AST projection, and absence of new relation/foundation subscanners. TypeScript transpile syntax checks are run on the changed TypeScript files. Full project typecheck/build is not treated as passing unless the project toolchain can run it successfully.
