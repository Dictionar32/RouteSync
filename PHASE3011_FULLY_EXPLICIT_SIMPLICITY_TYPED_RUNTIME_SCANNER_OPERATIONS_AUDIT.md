# Phase 3011 — Fully Explicit Simplicity Typed Runtime Scanner Operations

## Objective

Make the runtime path that builds the CLI invocation manifest preserve provenance through named, typed operation inputs instead of relying on positional parameter ordering. Keep the ADT/domain-continuation direction from Phases 3009–3010.

## Implemented change

File changed:

- `packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts`

Four internal runtime operations now accept one named input object through an explicit interface:

- `InventoryClosureOperationInput`
- `CanonicalProjectCompositionOperationInput`
- `DiscoveredSourcesContinuationOperationInput`
- `CompleteDocumentsContinuationOperationInput`

This replaces multi-argument calls whose positional order could obscure the distinction between `discoverySourceProject` and `sourceProject`, or make `routeSelection` easy to omit/reorder. Each continuation call constructs a frozen named object, making the field lineage visible at the call site.

## Field provenance trace

| Field | Origin / meaning | Runtime handoff | Final use |
|---|---|---|---|
| `sourceProject` | Canonical project identity from the request's canonicalization ADT | `CanonicalProjectCompositionOperationInput` → `DiscoveredSourcesContinuationOperationInput` → `CompleteDocumentsContinuationOperationInput` | Passed as `requestedSourceProject` to invocation judgment preparation |
| `discoverySourceProject` | Project identity attached to the successful source-discovery result | Discovery continuation → source-read continuation → complete-document continuation | Passed as `discoverySourceProject` to invocation judgment preparation; not substituted with the requested/canonical identity |
| `discoveredSources` | Source inventory returned by successful Laravel controller discovery | `DiscoveredSourcesContinuationOperationInput` → `discoveredSourceReadSettlementOperation.readAll` | Read results are identity-bound and closed into source documents |
| `documents` | Completed PHP source documents from the read/identity-binding batch | `CompleteDocumentsContinuationOperationInput` | Input to `laravelControllerInvocationSemanticJudgmentPreparationFactory.prepare` |
| `routeSelection` | Route-selection intent created by CLI from the selected route file | Composition input ADT continuation → canonical project operation → discovered-source continuation → complete-document continuation → inventory closure | Preserved in `manifest_builder_input` alongside the validated `invocationInventoryReceipt` |
| `invocationInventoryReceipt` | Receipt emitted only by the inventory authority's `onValidated` continuation | `InventoryClosureOperationInput` → `manifestBuilderPreparation.prepare` | Manifest builder's evidence that invocation inventory was validated |
| Terminal judgment | Complete or blocked judgment from manifest builder | `judgment.continueWith(...)` → terminal operation factory | CLI consumers use `continueForDriftAudit`, not a second kind-based dispatch |

## Runtime path

1. CLI `scan` / `sync` / drift audit create a `ControllerInvocationManifestCompositionInput` using the canonical factory.
2. The input ADT's `continueToCanonicalization` operation preserves the route-selection intent while the project identity is canonicalized.
3. The canonical project operation discovers Laravel controller sources.
4. Discovery's own source-project identity and the requested/canonical source-project identity are carried as separate named fields.
5. Source files are read, identity-bound, and converted to completed PHP source documents.
6. Invocation preparation consumes both source-project identities and the documents.
7. The inventory authority validates source inventory and semantic judgments.
8. Only the validated branch contributes `validatedInventory.receipt` to the manifest-builder input; the route-selection intent accompanies it unchanged.
9. The manifest-builder judgment is converted through its domain continuation to the CLI terminal ADT.

## Why this is a model improvement

The change raises the internal continuation boundary from positional argument convention to a named typed input model. It does not claim that every primitive condition in the repository has disappeared. Platform-level filesystem predicates and error-code decoding remain at the Node adapter boundary; domain consumers receive typed discovery/read/terminal ADTs.

The change also does not assert that `routeSelection` is the same thing as controller discovery. Route selection is a CLI request intent; controller discovery is evidence about source files in a Laravel project.

## Verification

- Structural audit: `PHASE3011_AUDIT.json` — 10/10 checks passed.
- TypeScript syntax transpilation: `PHASE3011_SYNTAX_CHECK.json` — scoped composition file only, zero syntax diagnostics.
- Full project typecheck: not established by this phase.
- Unit tests and real Laravel CLI end-to-end: not run by this phase.

The structural audit is a source-shape/provenance check, not a proof of runtime behavior or full TypeScript type correctness.

## Preserved constraints

- `packages/core/src/types/upstream/collections.ts` remains whitespace-only.
- Deleted relation foundation files remain absent; no kernel re-exports to those files were restored.
- No repository-wide mass replacement of `export function`, `if`, `switch`, `===`, `??`, or ternaries was attempted. Such changes require a reachable-call-graph audit and a domain model for each affected branch.

## PHP / Laravel reference relevance

Laravel route parameters, dependency injection, controller actions, and route-model binding carry distinct semantics. RouteSync should preserve these source facts through upstream judgments and manifest inputs instead of guessing them again downstream. PHP type declarations likewise illustrate why typed boundaries matter, though TypeScript interface annotations alone do not guarantee that runtime data is valid.

Official references:

- Laravel Routing: https://laravel.com/framework/docs/routing
- PHP Type Declarations: https://www.php.net/manual/en/language.types.declarations.php
