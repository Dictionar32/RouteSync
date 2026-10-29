# Phase 3005 — Fully Explicit Source Binding Operational ADT Runtime Trace

## Scope

This phase advances one reachable upstream runtime boundary in the controller invocation semantic judgment path. It does not claim to migrate every exported helper across the repository.

## Runtime trace

```text
CLI scan/sync
  → RouteSyncCliManifestScanOperationInterface.scan(input)
  → ControllerInvocationManifestCompositionAuthorityInterface.compose(input)
  → source invocation pipeline result + controller source identity
  → phpSourceInvocationSemanticSourceBindingAuthority.bind(input)
  → source-binding ADT
       ├─ closed: continueWith({ onClosed, onRejected })
       └─ rejected: continueWith({ onClosed, onRejected })
  → phpSourceInvocationPipelineEvidenceFromSourceBinding.project(binding)
  → PhpSourceInvocationSemanticPipelineCompositionEvidence
  → integration.project(evidence)
  → LaravelControllerInvocationSemanticJudgment
  → manifest builder / CLI manifest terminal ADT
```

## Before

The projection was a free exported arrow helper and selected the output with a `switch` on the source-binding judgment:

```ts
export const phpSourceInvocationPipelineEvidenceFromSourceBinding = (judgment) => {
  switch (judgment.kind) {
    // closed / rejected projection
  }
};
```

## After

The public runtime projection is an interface-first operation object:

```ts
export const phpSourceInvocationPipelineEvidenceFromSourceBinding: PhpSourceInvocationPipelineEvidenceFromSourceBindingInterface = Object.freeze({
  project: (judgment: PhpSourceInvocationSemanticSourceBindingJudgment) =>
    judgment.continueWith({
      onClosed: sourceBinding => Object.freeze({ kind: 'php_source_invocation_pipeline_connected', sourceBinding }),
      onRejected: rejected => Object.freeze({ kind: 'php_source_invocation_pipeline_source_binding_rejected', judgment: rejected }),
    }),
});
```

The invocation authority consumes it as:

```ts
phpSourceInvocationPipelineEvidenceFromSourceBinding.project(binding)
```

Each source-binding ADT arm owns `continueWith`, so the projection no longer reconstructs outcome dispatch from `kind`. Both branches retain the exact binding judgment and its original pipeline result.

## Data provenance and loss controls

- Controller source identity and pipeline-document identity are compared by the existing `LaravelSourceIdentitySemanticsInterface`.
- The identity judgment remains the single owner of both compared endpoints.
- Closed and rejected outcomes retain the exact original pipeline result.
- The projection does not reparse source, duplicate source aliases, infer an outcome from a string, or collapse blocked pipeline results into a rejected source-binding outcome.
- The source-binding contract runtime/type version is now 6.

## Laravel/PHP modeling implication

Laravel route callbacks and controller actions carry meaningful distinctions: callback dependencies can be injected by the service container, route parameters are ordered after dependencies, and implicit route-model binding depends on typed model parameters and route-segment naming. These facts should be represented as source-derived typed evidence upstream, not reconstructed by CLI string heuristics. PHP type declarations similarly carry parameter/return-type contracts and should remain typed evidence when scanned.

Official references:
- Laravel Routing: https://laravel.com/framework/docs/routing
- PHP Type Declarations: https://www.php.net/manual/en/language.types.declarations.php

## Audit status

- Structural checks: 14/14 passed.
- Syntax transpileModule check: 3 changed TypeScript files, 0 syntax diagnostics.
- Full project typecheck: not claimed.
- Unit tests / CLI E2E / Laravel fixture E2E: not run in this phase.
- CLI manifest field-by-field schema provenance remains an open end-to-end audit item.
- Other exported functions and arrow helpers outside this exact reachable source-binding slice remain candidates for call-graph-based audit; no repository-wide mechanical migration is claimed.
- `packages/core/src/types/upstream/collections.ts` remains empty.
- Forbidden relation foundation modules remain absent.
