# Phase 2291 — Attribute Declaration-to-Resolution Lineage (Interface First)

## Scope

This phase changes only the upstream Laravel attribute scanner contract, its contract documentation, and an audit. It does not change the producer, scanner, pipeline wiring, CLI, or runtime executor.

## Gap found after Phase 2290

Phase 2290 introduced a closed inventory of resolved interfaces, but the contract did not preserve a first-class inventory of the source-level `implements` names. Therefore, a resolved entry did not carry an explicit typed link to the exact source declaration that generated it, and the interface did not describe source-order one-to-one coverage between declarations and resolutions.

## Contract changes

`LaravelAttributeScannerInterface` is evolved in place to contract version 9. The upstream contract now distinguishes:

- `LaravelAttributeDeclaredInterfaceEvidence`: source spelling and source span for each declared interface;
- `LaravelAttributeResolvedInterfaceEvidence`: one successful resolution explicitly linked to the corresponding source declaration;
- `LaravelAttributeResolvedInterfaceInventory`: one closed, source-ordered collection of declaration/resolution pairs, avoiding two arrays whose lengths and order could disagree.

The contextual implementation proof references its `LaravelAttributeDeclaredInterfaceEvidence` rather than maintaining a separate `interfaceSource` field. This avoids two independently supplied source locations for the same proof. The resolved inventory uses one paired collection rather than separate declaration and resolution arrays; completeness remains an upstream contract invariant, and blocked resolutions must be represented by the blocked scan judgment.

Both positive and negative contextuality judgments continue to require the same closed resolved inventory. An unresolved declaration cannot be represented as a successful resolution; it belongs in the blocked scan outcome.

## Trace

The known CLI path remains:

`packages/cli/src/commands/scan.ts` → `controllerInvocationManifestComposition.ts` → `laravelSourceAstPipeline.ts` → `LaravelAttributeScannerInterface.scan(...)` → `attributeAstCanonical.ts` → contextuality judgment → complete inventory → controller scanner.

## Explicit integration boundary

The producer still emits the older Phase 2289/2290 shape (`resolvedInterfaces`) and still advertises scan contract version 7; pipeline wiring also still uses the older shape. This mismatch is intentionally not hidden or patched in this interface-only phase. The producer and pipeline must be migrated in a later phase after this contract is accepted.

`attributeProducer.ts` still has a `semantic/relations` dependency. This phase does not claim the full scanner path is free of that dependency. No `semantic/foundation` import is added.

## Validation

The Phase 2291 audit checks the declared/resolved lineage contract and confirms the implementation mismatch remains explicit. It is a structural contract audit, not a TypeScript typecheck or build.
