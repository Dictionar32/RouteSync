# Phase 3097 — Source-Read Batch Continuation Boundary Audit

## Result

This phase audits the next real continuation boundary after Phase 3096. It deliberately does **not** claim a runtime migration: a type-safe replacement must preserve package ownership before changing the public ADT contract.

## Runtime trace

`CLI scan/sync` → `controllerInvocationManifestComposition` → `discoveredSourcesContinuationOperation` → `phpSourceDocumentReadOperationBatchFactory.fromSettlements(...)` → `bindIdentityBatch(...)` → `identityBatch.toSourceReadBatch(phpSourceDocumentReadBatchFactory)` → `PhpSourceDocumentReadBatchJudgment.continueWith(...)` → blocked-source terminal or complete-document semantic pipeline → manifest composition → generator.

## Concrete frontier

`packages/core/src/types/upstream/phpSourceFrontendInterface.ts` still defines `PhpSourceDocumentReadBatchHandlers<Result>` and `continueWith<Result>`. The concrete runtime consumer is in `packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts`.

The two outcomes carry different evidence:

- complete: the ordered complete document inventory;
- blocked: partial documents and the non-empty blocker inventory.

The consumer maps these outcomes to `ControllerInvocationManifest` terminals, which are owned by the CLI package. Directly importing that CLI contract into core would reverse the package dependency direction. Merely renaming `continueWith`, adding a generic wrapper, or converting the caller back to `kind`/`if` dispatch would not satisfy the explicit-domain goal.

## Safe next step

Introduce a named, shared terminal-outcome contract at the correct ownership boundary, or design a CLI-owned adapter that consumes variant-specific core operations while keeping core independent from CLI. Then replace the generic continuation and test both complete and blocked paths, including the preservation of partial documents and every blocker.

## Audit command

`npm run audit:phase3097-read-batch-continuation-boundary`

The script verifies the targeted contract and dependency boundary. It is not a TypeScript typecheck or runtime test.

## Explicit non-claims

- No runtime source code was changed in this phase.
- Repository-wide conversion of `export function` and exported arrow constants to `export const name: Interface = ...` is not complete.
- Global removal of `string`, `number`, `undefined`, `null`, `boolean`, `reduce`, `[]`, `??`, ternary, `if`, `:`, `===`, `is`, `as`, `lookup`, `void`, `visitor`, `switch`, `for`, and `map` is not complete.
- Full typecheck, test suite, and PHP → CLI → manifest → generator E2E remain unverified.
- Deleted relation-foundation modules remain deleted and are not re-exported.
