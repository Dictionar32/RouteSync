# Phase 2208 — Authority Interface-First Model

## Purpose

Clarify authority ownership across the existing invocation, integrated-response, Laravel HTTP-response, and runtime-executor contracts. This phase evolves existing upstream contracts; it does not add a `relation`, `foundation`, or replacement-subscanner layer.

## Canonical ownership chain

1. `InvocationSemanticAuthorityInterface.analyze` owns one PHP invocation semantic judgment, including evidence provenance, proof/rule trace, obligations, and closure status.
2. `InvocationSemanticRuntimeExecutorInterface.execute` delegates to that authority and forwards the judgment unchanged. `executeAll` is a distinct whole-knowledge operation delegated to the existing batch authority.
3. `InvocationSemanticIntegratedResponseCompositionInterface.integrate` composes invocation and semantic-knowledge products. This is not the Laravel HTTP response authority.
4. `LaravelControllerResponseSemanticPipelineInterface.judgeIntegratedResponse` owns the Laravel controller HTTP-response judgment for the exact invocation outcome, including source correlation, evidence binding, DTO response projection, and closed rejected outcomes.
5. `LaravelControllerScannerInterface` carries source-correlated controller artifacts and the response pipeline; the source-AST projection preserves the canonical invocation inventory and per-method response projection judgments.
6. Runtime projection and CLI publication forward these products; they must not reconstruct invocation or response semantics from AST shapes.

## Contract changes

- Evolved the existing `LaravelControllerSubscannerInterfaceFirstContract` with explicit owner fields distinguishing invocation authority, invocation runtime executor, PHP integrated-response composition, and Laravel HTTP-response judgment.
- Incremented `LaravelSubscannerRetirementInterface.version` from 14 to 15 and clarified the end-to-end authority boundary.
- Evolved the existing `LaravelChannelScannerMigrationContract` from version 2 to 3. It now explicitly states that the legacy channel scanner still classifies public/private/presence from the channel pattern without client subscription evidence. Its cutover requires source-backed client subscription evidence and preservation of resolved, unresolved, and ambiguous judgments.
- Added a focused Vitest test for the invocation executor boundary and the explicit channel migration gate.

## Trace findings and remaining gaps

- The source-AST pipeline already accepts explicit upstream dependencies for model, FormRequest, route, controller, resource, response, migration, attribute, DTO inventory, query, service, middleware, and provider producers.
- The composition root still adapts several legacy `subscanners` implementations. Dependency injection does not mean those implementations have been retired.
- `ChannelScanner.scanCanonicalAsts` remains a direct call from the source-AST pipeline. The existing `LaravelChannelScannerInterface` requires client subscription evidence and a `BroadcastChannelKindJudgmentAuthority`, but the current Laravel source project boundary does not provide a proven client-subscription evidence inventory. Wiring an empty inventory would silently erase existing channels; preserving pattern inference would violate the authority contract. This phase deliberately does neither and marks this as an open boundary.
- `semantic/relations` helpers remain in the source-AST pipeline for sequence/collection shaping and selection. They have not been moved or renamed to disguise the dependency.
- No new `semantic/foundation`, `semantic/relations`, or subscanner directory/module was introduced.

## Verification boundary

The added test is a regression guard, not proof of full semantic closure. Full TypeScript typecheck, Vitest execution, and package build were not run in this environment. No `npm run build` was run.
