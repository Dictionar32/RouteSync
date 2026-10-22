# Phase 2076 — Interface-first authority-gap trace

## Scope

Trace `packages/core/src/types/upstream` and the production Laravel controller path in `packages/core/src/compiler/scanner`, with explicit attention to `relation/foundation`, controller subscanners, `function`/`const`/`class`, AST/ADT, invocation judgment, integrated response, and runtime execution.

This phase is a trace and remediation specification. It does **not** claim the production runtime has been migrated; no production source was changed in this phase.

## Canonical path observed

`LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt`
→ `LaravelControllerScannerInterface.scan`
→ `ControllerDeclarationSemanticJudgment.selections`
→ `scanControllerAction` / `resolveControllerActionContract`
→ `ControllerProducer.produce`
→ `LaravelControllerResponseSemanticPipelineInterface.judgeIntegratedResponse`
→ `LaravelControllerAstProjectionSemanticAuthorityInterface.judge`
→ `LaravelControllerScanArtifact` outcome-indexed ADT
→ downstream AST/resource/response consumers.

The invocation judgment is already a discriminated union indexed by four `response.kind` outcomes. `LaravelControllerScanArtifact` also correlates the exact invocation subtype with a compatible response judgment and projection judgment. These are strong existing contracts and should be evolved, not duplicated.

## Confirmed authority gaps

1. `packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts` is still a large runtime coordinator. It derives declaration candidates, invokes `scanControllerAction`, constructs method/declaration evidence, invokes the producer, then composes response and AST projection.
2. The scanner imports `RelationMembership`, `Sequence`, and multiple `relation*` operations directly from `semantic/relations`. It therefore is not free of the relation layer.
3. It imports action parsing through `../subscanners/controller` and calls `scanControllerAction`; action-contract derivation remains reachable through `resolveControllerActionContract`.
4. The runtime uses a `LaravelControllerScannerExecutor` class. Removing a factory alone did not make this executor small or remove the class.
5. `controllerDeclarationSemanticJudgmentAuthority.ts` has semantic decisions in helper functions (`sameClassIdentity`, `isHasMiddleware`, `selectActions`, `ancestryFor`, nested `walk`). The authority is upstream, but its decision rules are still imperative implementation rather than fully expressed as a closed judgment contract/ADT.
6. `laravelControllerResponseSemanticPipeline.ts` is itself a substantial implementation containing many helper functions and a runtime executor. Its contract describes ownership and ordering, but does not mean all implementation logic has been eliminated.
7. `packages/core/src/types/upstream/collections.ts` re-exports `Sequence` from `semantic/relations/relationalSequence` and imports relation helpers. Renaming imports or switching only the scanner import would not remove the architectural dependency.

## Existing strengths to preserve

- `LaravelControllerInvocationSemanticJudgmentInterface` is an outcome-indexed ADT, not a callable boundary.
- The inventory closure receipt is the scanner's source authority.
- `LaravelControllerResponseSemanticPipelineInterface` owns integrated response composition and AST projection composition.
- `LaravelControllerScanArtifact` carries correlated invocation, response, and projection judgments.
- The response pipeline contract already states that scanner/runtime must forward closed judgments and must not reconstruct invocation provenance.

## Interface-first remediation order

### A. Upstream contracts before wiring

1. Evolve the existing controller-action semantic contract so it accepts typed declaration/method evidence and returns a closed `ControllerActionSemanticJudgment` ADT. Do not add a parallel `ActionScannerInterface` that merely wraps `scanControllerAction`.
2. Evolve the existing declaration authority contract to encode selection outcomes, inheritance traversal termination, and selected action membership as typed judgment data. Its implementation should interpret this contract; scanner should consume only the result.
3. Make the sequence/collection contract independent of `semantic/relations`. This requires changing the canonical upstream collection algebra and its consumers, not just changing one import.
4. Keep response integration and projection as the existing owners. Do not add a second invocation or response authority.

### B. Scanner contract

The scanner should receive one closed input containing the inventory receipt and source facts, then consume already-closed declaration/action judgments. Its output remains the current correlated scan ADT. It must not derive semantic action meaning, reclassify AST evidence, or decide invocation/response outcomes.

### C. Runtime executor

Only after A and B are complete should the runtime be reduced to deterministic orchestration: consume closed judgments, preserve source correlation, pass the same judgment values through the response pipeline, and publish the scan ADT. Removing `class`, `function`, or `const` syntax before moving semantic ownership would be cosmetic, not architectural progress.

## Static audit verdict

- Interface-first contract presence: **PASS** (existing contracts are present).
- Invocation discriminated union: **PASS**.
- Invocation/response/projection correlation in output ADT: **PASS** at type-shape level.
- Scanner free of relation/foundation dependencies: **FAIL**.
- Scanner free of controller subscanner calls: **FAIL**.
- Runtime reduced to executor-only orchestration: **FAIL**.
- No semantic reasoning helpers in declaration authority: **FAIL**.
- Production source migrated in this phase: **NO**.
- Build/typecheck/Vitest: **NOT RUN**.

## Decision

Do not describe Phase 2076 as a runtime repair. It establishes the exact authority gaps and the correct order of repair. The next code-changing phase must start with the existing upstream action/declaration/collection contracts and then simplify the scanner; deleting helpers or relocating them without changing ownership is explicitly insufficient.
