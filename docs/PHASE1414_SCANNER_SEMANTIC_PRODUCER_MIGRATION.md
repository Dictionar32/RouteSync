# Phase 1414 — Scanner / semantic producer boundary

## Migration

- `AstClassifierEvidenceInterface` is now syntax-only: value, token, and block classification remain scanner capabilities.
- Removed semantic-stage judgment construction from `astClassifierRuntime.ts`; scanner runtime no longer imports the upstream semantic stage authority or creates scanner evidence ports.
- Added `astSemanticEvidenceProducer.ts` under `types/upstream`. It accepts a closed observation (`node`, `source`, `syntaxKind`) and owns conversion into the upstream semantic-stage port.
- Kept the scanner-facing semantic helper as compatibility wiring: it obtains the syntax kind from the AST classifier and forwards that observation to the upstream producer. It does not construct semantic facts or judgments itself.

## Architecture constraint

This phase does not move PHP grammar recognition out of the scanner. Parsing and syntax classification belong to the scanner. The migration separates that syntax responsibility from semantic-stage judgment production. AST syntax nodes and semantic/data-flow graph judgments remain distinct representations.

## Validation

The phase audit checks that the syntax request/result ADT has no semantic branch, scanner runtime has no semantic stage authority imports, and upstream producer owns stage-port construction. Full TypeScript build must be run in an environment with the configured build dependency installed.
