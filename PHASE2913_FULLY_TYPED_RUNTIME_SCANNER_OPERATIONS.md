# RouteSync Phase2913 — Fully Typed Runtime Scanner Operations

## Objective

Audit and refine the source-read failure path that feeds the upstream CLI manifest composition. Preserve existing upstream contracts, give the read-failure judgment an explicit continuation operation, and avoid silently collapsing unrecognized platform errors into the same table entry as an ordinary unreadable failure.

## Trace

1. `controllerSourceDiscovery` discovers controller source files.
2. `sourceDocumentReader.read` calls `fs.readFile` for each discovered source.
3. `phpSourceDocumentReadFailureCodeJudgmentFactory.from(error)` classifies known filesystem codes into named judgments.
4. Each judgment owns `continueWith`; unrecognized codes retain their observed code as `StringValue` evidence.
5. The CLI adapter maps recognized missing/path-not-file/permission judgments to existing `phpSourceDocumentReadBlockerFactory` constructors.
6. The unrecognized judgment is conservatively mapped to the existing `php_source_document_file_unreadable` blocker because the public upstream blocker ADT does not yet define an unclassified-error variant.
7. `phpSourceDocumentReadResultFactory.blocked` creates the existing source-read result ADT, which continues through source identity binding and manifest composition.

## Change

`packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts` now defines `php_source_document_failure_code_unrecognized` as a distinct operation-owning judgment carrying a `StringValue` code. The synthetic `UNKNOWN` record was removed; the factory no longer aliases unknown codes to that known-record entry. Permission codes `EACCES` and `EPERM` map to the existing unreadable judgment explicitly.

No new upstream ADT was added because the existing upstream blocker already owns the domain outcomes and continuation operations. This phase keeps the error-code judgment private to the CLI platform adapter, where Node filesystem codes are interpreted.

## Constraints preserved

- No `export function` declaration was added to the traced CLI runtime module.
- Existing upstream blocker factory and result factory are reused.
- No generic collection/relation abstraction was added.
- `packages/core/src/types/upstream/collections.ts` remains empty (0 bytes).
- Runtime operations remain interface-first where exported; the new adapter judgment remains private and local to its platform boundary.

## Validation

- Phase2913 structural audit: 13/13 checks passed.
- Prior related structural audits Phase2906–Phase2912: 82/82 checks passed.
- Combined related structural audit checks: 95/95 passed.
- TypeScript `transpileModule` syntax diagnostics for the changed CLI composition module: 0.
- ZIP integrity: checked before delivery.

Full project typecheck, build, unit tests, and CLI end-to-end tests were not run; no claim is made that they pass.

## Remaining gap

The CLI boundary still reads `error.code` through `Reflect.get`, normalizes it to a string for lookup, and conservatively maps unrecognized codes to the existing unreadable blocker. This phase makes the unknown case explicit and preserves its code evidence in the intermediate judgment, but does not claim that all primitive interpretation has been eliminated. If downstream diagnostics need to distinguish unclassified failures from known unreadable failures, review and evolve the existing upstream blocker contract first rather than creating a parallel contract.

## Technical reference

The TypeScript Handbook describes discriminated unions and how variant-specific operations can be represented with explicit tagged types: https://www.typescriptlang.org/docs/handbook/unions-and-intersections.html
