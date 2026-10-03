# Phase 523 — Controller Error Relational Cutover

## Target

`packages/core/src/compiler/scanner/subscanners/controller/controllerErrorDetector.ts`

## Architecture

Controller error recognition is now modeled as a relation query over scanner token evidence:

`token evidence -> token lookup relation -> candidate error-code relation -> descriptor witness -> semantic absence`

The detector no longer owns imperative branch/loop traversal. Token navigation uses recursive relational primitives, and descriptor selection is a relation lookup over the HTTP error-code catalog.

### Recognized evidence

- `abort(code, ...)`
- `response()->json(..., code)`
- nested grouping while scanning JSON arguments
- HTTP error codes constrained to the 400–599 range
- known error-code descriptors resolved through a relation catalog

### Absence model

No language-level absence sentinel is used in the target surface. The public result uses `RelationMaybe<ErrorDescriptor>` and the semantic kernel's `RELATION_NONE` witness.

## Verification

`audit:scanner-lexer:phase523`:

- forbidden control/collection/absence/operator surface: all `0`
- `closedSurfaceClean = true`
- TypeScript `transpileModule` diagnostics: `0`

A full repository typecheck is not claimed; the environment has previously lacked the `node` and `vitest/globals` type-definition packages.
