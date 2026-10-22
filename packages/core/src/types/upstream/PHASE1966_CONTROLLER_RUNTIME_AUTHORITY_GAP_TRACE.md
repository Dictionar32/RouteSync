# Phase 1966 — Controller Runtime vs Interface Authority Gap

## Verdict

The invocation judgment itself is already a good source-correlated ADT. The next root-level defect is the mismatch between the declared `LaravelControllerInvocationSemanticBoundaryContract` and the actual `laravelControllerScanner.ts` implementation. Do not add a `relation` or `foundation` subscanner, and do not create a second invocation authority.

## Trace evidence

### Upstream contract already promises

`packages/core/src/types/upstream/laravelControllerScannerInterface.ts` declares `LaravelControllerInvocationSemanticBoundaryContract` and describes `scannerRuntime` as `source-artifact-collection-only-no-semantic-judgment-construction`. It also declares forbidden scanner responsibilities, including semantic fallback/reclassification, and says source facts should not be used to resolve static invocation candidates.

### Runtime still decides controller semantics

`packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts` currently:

1. Builds a `declarationByName` map from parsed declarations.
2. Implements `inheritedAttributes` with a recursive `visit` and `seen` set.
3. Selects action methods using `relationSelect`, `relationAll`, `relationGate`, and method-name/static/interface predicates.
4. Builds constructor parameter state and folds action methods.
5. Calls `scanControllerAction` and derives response/dependency/descriptor values.
6. Recursively derives `inheritedControllerNames` at runtime.
7. Constructs `ControllerDeclarationEvidence` and resource-binding evidence before calling `controllerProducer.produce`.

These are not merely syntax collection: method eligibility, inheritance closure, and derived action/resource facts are semantic decisions. The implementation is therefore stronger than a thin executor and weaker than its own declared boundary contract.

### Source pipeline amplifies the mismatch

`packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts` directly calls concrete producers/scanners for migration, schema, model, request, query, attributes, controller, response, service, middleware, DTO, provider, resource, route, and channel stages. It returns a success-shaped `SourceAsts` aggregate. The closed invocation receipt is preserved correctly, but it does not certify that every other stage has a complete closed semantic judgment.

`LaravelSourceAstPipelineInterface.execute` has one input (the closed invocation inventory receipt) and returns `Promise<SourceAsts>`. Its boundary does not yet express a full source-semantic projection judgment.

## Interface-first correction (do not implement by relocating functions)

Evolve the existing upstream controller contract in `laravelControllerScannerInterface.ts` rather than creating another subscanner. The missing semantic object is a **controller declaration projection judgment** derived from typed declaration evidence and explicit semantic dependencies, with separate outcomes for:

- a source-correlated declaration projection that is complete;
- an explicit unresolved/ambiguous inheritance or declaration relation;
- an unsupported declaration form, if an existing domain-owned unsupported-form ADT already models it.

The judgment must carry the canonical controller/source identity and the evidence that justified the outcome. It must not store a prose rule label instead of a domain result, and must not use `string`, `unknown`, `Record`, or a fabricated generic error list for unresolved states.

Only after tracing existing inheritance and action-selection result types should the interface declare this judgment. Then `laravelControllerScanner.ts` can consume it and project ASTs. Do not move `visit`, `actionMethods`, or `inheritedControllerNames` into a new file and call that interface-first: the upstream judgment must own the selection/closure semantics, not just host the old implementation.

The source-AST pipeline needs a second evolution after the controller contract: an outcome-indexed source projection judgment based on existing per-domain producer judgments. Do not define a `blocked` branch until its payload can use existing typed producer outcomes. Do not wrap `SourceAsts` in a cosmetic `complete` case and claim closure.

## Invocation and integrated response

Preserve the existing four invocation integration outcomes exactly: `not_connected`, `source_binding_rejected`, `complete`, and `blocked`. The scanner must pass through the same `invocationJudgment` from the inventory receipt to `controllerProducer`; it must not recreate or normalize the response.

## Constraints and verification

- No `relation` or `foundation` subscanner added.
- No second invocation authority added.
- No build or TypeScript compile claimed.
- This phase is a trace/audit artifact, not a source-code migration. It explicitly identifies the authority contract mismatch that must be corrected before runtime wiring is changed.
