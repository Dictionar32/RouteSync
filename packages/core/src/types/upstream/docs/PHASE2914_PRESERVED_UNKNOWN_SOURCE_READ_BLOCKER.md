# Phase2914 — Preserve Unrecognized Source-Read Failure as an Upstream Blocker

## Scope

Phase2913 preserved an unrecognized Node filesystem error code in a CLI-local judgment, but then mapped it to `php_source_document_file_unreadable`. That erased the distinction at the public upstream result boundary. Phase2914 evolves the existing `PhpSourceDocumentReadBlocker` contract instead of creating a parallel ADT.

## Contract change

`PhpSourceDocumentReadBlockerEvidence` now includes `php_source_document_failure_code_unrecognized`, carrying the requested `SourceFile` and the observed `StringValue` code. `PhpSourceDocumentReadBlockerHandlers` exposes `onFailureCodeUnrecognized`; `PhpSourceDocumentReadBlockerOperations.continueWith` routes this variant to that handler. `phpSourceDocumentReadBlockerFactory.failureCodeUnrecognized(sourceFile, code)` is the interface-first runtime constructor.

## Runtime trace

`sourceDocumentReader.read` catches the filesystem read failure → `phpSourceDocumentReadFailureCodeJudgmentFactory.from(error)` classifies known codes or preserves an unrecognized code → the judgment's `continueWith` selects `phpSourceDocumentReadBlockerFactory.failureCodeUnrecognized` for the unrecognized case → `phpSourceDocumentReadResultFactory.blocked` retains the distinct blocker in the existing source-read result ADT.

## Why this is a root-contract fix

The public source-read blocker now preserves the distinction that the adapter already knew. Consumers can act through `blocker.continueWith({ onFileMissing, onPathNotFile, onFileUnreadable, onFailureCodeUnrecognized })`; they do not need to reinterpret a raw code or mistake an unrecognized failure for a known unreadable category. The existing upstream blocker contract was extended in place; no generic ADT or duplicate authority was added.

## Remaining platform boundary

Node's thrown error is still `unknown` at the filesystem boundary, so extracting `error.code` and normalizing it remains platform adaptation. The change does not claim to eliminate every primitive operation; it ensures that the unknown classification survives into the domain result.

## Invariants and validation scope

`packages/core/src/types/upstream/collections.ts` remains empty. The new audit checks the upstream variant, its operation, factory construction, CLI routing, the example consumer, absence of `export function` in the traced CLI module, and audit registration. Structural audits and syntax diagnostics do not prove whole-project typecheck, build, unit-test, or CLI end-to-end success.
