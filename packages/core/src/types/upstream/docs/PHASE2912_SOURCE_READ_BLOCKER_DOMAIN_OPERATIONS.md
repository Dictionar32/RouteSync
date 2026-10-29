# Phase2912 — Source Read Blocker Domain Operations

## Audit finding

`PhpSourceDocumentReadBlocker` in `phpSourceFrontendInterface.ts` was a discriminated union carrying only `kind` and `sourceFile`. Its consumer had to interpret blocker variants separately, while the enclosing `PhpSourceDocumentReadResult` already owned `continueWith`.

## Change

The existing blocker contract now has `PhpSourceDocumentReadBlockerOperations.continueWith`, variant-specific handlers, and `phpSourceDocumentReadBlockerFactory` constructors (`fileMissing`, `pathNotFile`, `fileUnreadable`). The CLI reader uses that existing upstream contract and its constructors rather than constructing blocker-shaped object literals. Its local filesystem adapter first creates a `PhpSourceDocumentReadFailureCodeJudgment` with `continueWith`, then maps each judgment operation to the existing upstream blocker factory.

The source read result still owns complete/blocked continuation. Blockers additionally own follow-up behavior for their specific domain meaning. No generic ADT or collection abstraction was introduced; `packages/core/src/types/upstream/collections.ts` remains empty.

## Runtime trace

`sourceDocumentReader.read` → filesystem read → error-code adapter → `phpSourceDocumentReadBlockerFactory` → `PhpSourceDocumentReadBlocker.continueWith` → `phpSourceDocumentReadResultFactory.blocked`.

## Boundary that remains

Node filesystem errors still enter as `unknown`, and `Reflect.get` plus string error codes are used to recognize platform error codes. Unknown codes still map to the existing unreadable blocker. This phase does not claim that primitive interpretation has been eliminated from the filesystem boundary.

## Validation scope

The phase audit checks contract wiring and source structure. It does not substitute for full project typecheck, build, unit tests, or CLI end-to-end validation.
