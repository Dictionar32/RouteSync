# Phase 1936 — Controller Definition Payload Provenance, Interface First

## Trace finding

Phase 1935 validates the canonical source identity against invocation judgment, knowledge projection, and every statement payload. The PHP definition projection adapter nevertheless accepted a second source channel through `dependencies.invocationJudgment.sourceFile`. That duplicated source identity path weakened provenance ownership even though the values were expected to match.

## Contract-first change

- `ControllerDataflowDefinitionProjectionAuthorityInterface` now declares the source-binding rule for the matched payload.
- The PHP projection adapter takes `sourceFile` from `input.correspondence.payload.source.file`, the exact payload already selected by the upstream correspondence judgment.
- The adapter no longer receives an independent invocation judgment merely to obtain a file identity.
- `controllerDataflowAnalyzer` now supplies only typed parameter semantics to the projection-authority factory. It continues to collect evidence and forward the complete source-correlation package to the upstream semantic authority.
- The closed binding judgment continues to retain the matched correspondence (and therefore its exact payload source span) alongside the projected definition.

## Versioning

- Controller dataflow semantic judgment authority contract: v10.
- Controller invocation semantic model contract: v8.
- Laravel controller scanner boundary contract: v98.

## Validation

The Phase 1936 static audit checks the interface, projection adapter, wiring, and contract versions. This report does not claim a TypeScript build or full test suite was run.
