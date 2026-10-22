# Phase 2445 — Upstream Runtime Forwarder Removal

## Root cause

The semantic rewrite runtime executor had no independent execution responsibility. It accepted operation arguments and forwarded them to `semanticRewriteAuthority`; production consumers had already been moved to direct authority calls in the preceding phase. Keeping the executor added a second API surface and preserved parameterized forwarding methods without adding an upstream contract or semantic judgment.

## Changes

- Removed `semanticRewriteRuntimeExecutor.ts` and its factory/singleton exports.
- Removed `SemanticRewriteRuntimeExecutorInterface`, `SemanticRelationExecutionRuntimeCapability`, and `SemanticConstraintRuntimeCapability`, which existed only to model the forwarding executor.
- Updated the existing rewrite and constraint regression tests to call `semanticRewriteAuthority.resolve(...)` and `semanticRewriteAuthority.resolveConstraints(...)` directly.
- Kept the existing upstream authority and its closed/incomplete judgments as the owner of semantic decisions.
- Redesigned the active manifest builder as a prepared, typed operation: `ManifestBuilderInput` is an explicit `input` field, and the executor's `build()` method has no parameters. The CLI prepares the operation and then executes it without passing arguments into runtime.
- Removed the dependency factory and parameterized construction helper from the manifest executor module. Dependencies remain explicit fields on the operation object rather than hidden closure captures.

## Explicitly unresolved

- `semanticRewriteAuthority.ts`, `semanticRewriteInterface.ts`, and related semantic calculus still import pre-existing types/operations from `semantic/relations`. This phase does not satisfy the broader no-relations-dependency requirement.
- The operation preparation boundary `prepareManifestBuilderOperation(input)` still accepts the upstream input to construct the explicit operation object. This is an operation-preparation boundary, not the parameterless runtime executor. The scanner input acquisition itself necessarily has source evidence and selection intent.
- Full typecheck, package build, Vitest, and CLI end-to-end validation were not run in this environment.

## Validation

The Phase 2445 audit is a structural audit only. Passing assertions establish that the forwarding module and its contract are removed and that existing regression tests now call the upstream authority directly. They do not establish full type correctness or completion of the manifest redesign.
