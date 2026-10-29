# Phase2913 — Explicit Source Read Failure Judgment

## Scope

This phase continues the CLI manifest source-read trace from Phase2912. It fixes a semantic loss in the CLI filesystem adapter: every unrecognized error code previously collapsed into the synthetic `UNKNOWN` record, which was indistinguishable from a recognized error category.

## Trace

`sourceDocumentReader.read` catches the platform read failure → `phpSourceDocumentReadFailureCodeJudgmentFactory.from(error)` produces an operation-owning judgment → `continueWith` maps recognized missing/path-not-file/permission cases to the existing upstream `phpSourceDocumentReadBlockerFactory` → unrecognized codes retain `StringValue` evidence in a distinct judgment and are conservatively mapped to the existing unreadable blocker → `phpSourceDocumentReadResultFactory.blocked` creates the existing source-read result ADT.

## Contract ownership

The upstream `PhpSourceDocumentReadBlocker` contract from `phpSourceFrontendInterface.ts` is reused. Its variants already expose `continueWith`; no duplicate blocker contract or generic collection abstraction is introduced. `packages/core/src/types/upstream/collections.ts` remains empty.

The code judgment remains private to the CLI filesystem adapter because it interprets Node filesystem error codes. The adapter's domain result uses the existing upstream blocker factory. The platform boundary still interprets unknown error codes; this is an explicit boundary decision, not a claim that platform error interpretation has disappeared.

## Remaining limitation

`Reflect.get(Object(error), 'code')`, string normalization, and lookup of platform codes are still primitive operations at the filesystem boundary. An unrecognized code is now represented explicitly as `php_source_document_failure_code_unrecognized` and retains its code as `StringValue`; because the public upstream blocker ADT has no separate unknown-error variant, the adapter maps it to `php_source_document_file_unreadable`. That mapping is conservative but remains a domain policy worth reviewing if the public blocker contract is extended.

## Validation

The Phase2913 structural audit checks the explicit unrecognized judgment, operation ownership, known error categories, reuse of upstream blocker operations, absence of `export function` in the traced CLI module, and the empty collections invariant. This audit does not establish whole-project typecheck/build/test/E2E success.
