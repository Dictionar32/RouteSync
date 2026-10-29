# Phase 3022 — Upstream → CLI → Manifest primitive-source trace

## Scope and honesty boundary

This phase fixes one confirmed upstream text-factory source defect and records the remaining conversion frontier. It is not a claim that all primitive types have been removed or that the entire repository now satisfies the requested interface-first policy.

## Confirmed source defect and change

`packages/core/src/types/upstream/names.ts` imported the interface-backed factory as `createStringValue`, but separately declared another exported `stringValue(value: string): StringValue` constructor. This created a second owner for the same upstream value and made imports from `names.ts` inconsistent with callers that use `stringValue.create(...)`.

Change:
- `names.ts` now exposes the canonical `StringValueFactoryInterface` object as `stringValue`.
- The duplicate function constructor was removed.
- `routeDataFlow.ts` no longer passes the factory object as if it were a callable function. Prefix projection now explicitly calls `stringValue.create` at the source-text ingestion boundary.

This is a source-of-truth correction, not a claim that `string` has disappeared from the system. PHP source text and parser-produced lexemes necessarily enter as text; the unresolved work is to convert each *domain-owned* value into its own typed model at the right boundary, instead of allowing raw text to flow through semantic reasoning.

## Runtime path trace

1. CLI runtime uses `routeSyncCliManifestScanOperationFactory.create(authority).scan(input)` in `packages/cli/src/manifestScanOperationInterface.ts`.
2. The CLI operation delegates to `ControllerInvocationManifestCompositionAuthorityInterface.compose`.
3. `ControllerInvocationManifestCompositionInput.continueToCanonicalization` forwards the source project identity to the upstream canonicalization authority and retains route-selection intent.
4. Composition continues through source discovery, source-document reading/identity binding, invocation semantic pipeline, invocation judgment authority, inventory validation, and manifest preparation.
5. `ManifestBuilderJudgment` is adapted to the CLI terminal ADT, whose `continueForDriftAudit` distinguishes complete and blocked/rejected outcomes.
6. The manifest boundary already has named contracts and terminal domain operations. The remaining issue is earlier: source values and some exported domain constructors still accept raw primitives and exported helpers still use untyped callable forms.

## Required next conversion frontier

- `packages/core/src/types/upstream/names.ts`: exported constructors such as `createModelName`, `createClassName`, `createColumnName`, `createRouteName`, `createControllerName`, `createActionName`, and `createSourceFile` still accept raw `string`. Convert these to domain-specific factory interfaces and migrate consumers, rather than introducing a generic `string` alias.
- `packages/core/src/types/upstream/valueObjects.ts`: `numberValue(value: number)` and `truthValue(value: boolean)` remain function exports. Do not blindly wrap them: trace consumers first and distinguish source offsets, statement positions, HTTP status codes, and actual truth judgments.
- Other semantic vocabularies and reference helpers also accept primitive text. Each must be assigned to its real domain owner before migration.
- `queryEvidenceProducer.ts` still contains local dispatch/control flow and references relation foundation imports. This phase did not rewrite those semantics; a separate ownership trace is needed to migrate each operation to the existing upstream ADT without recreating deleted generic relation foundations.

## Laravel evidence and modeling rule

Laravel routing describes route parameters as inputs to route/controller actions, and controller dependency injection resolves typed dependencies. RouteSync should therefore retain route parameter identity, controller/action identity, source location, and resolution/blocker evidence as typed domain facts—not flatten them into an unqualified string and attempt to recover meaning downstream. See the official [Laravel controllers documentation](https://laravel.com/framework/docs/12.x/controllers) and [Laravel requests documentation](https://laravel.com/framework/docs/requests).

## Verification

- Source defect correction: applied.
- `collections.ts` invariant: must remain exactly one newline byte.
- Full TypeScript typecheck, build, and tests: not claimed as passed in this phase.
- Primitive elimination: not complete; the remaining frontier is explicitly listed above.
