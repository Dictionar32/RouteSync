# Phase 2054 — Controller resource static-call applicability judgment, interface first

## Trace finding

`controllerDataflowContract.ts::resourceBindingCandidate` previously inspected a PHP static-call method name and decided that only `collection` should become a resource-collection candidate. This meant the AST-side adapter was deciding semantic applicability before calling `controllerResourceBindingAuthority`.

## Change

- The existing `ControllerResourceBindingCandidate` ADT now carries a typed `static_call` candidate with `ResourceName`, `MethodName`, collection-argument evidence, and the canonical `ControllerResponse`.
- The existing `ControllerResourceBindingAuthorityInterface` was evolved to contract version 3. Its `staticCallRule` explicitly owns the applicability rule.
- The existing `controllerResourceBindingAuthority` now judges `MethodName` and emits the closed `not_applicable` judgment for non-`collection` methods. The response/model-origin closure for collection calls remains in the same authority.
- The scanner only projects AST structure to typed candidate evidence; it no longer checks whether the method is `collection`.
- The same response object and existing model-origin judgments are preserved. No invocation or integrated-response authority was added.

## Architectural boundary

This change does not add a relation/foundation subscanner, a parallel resource authority, or a new AST facade. It evolves the existing interface and authority. Relation helpers that remain inside the upstream implementation are not new scanner sublayers and were not broadly rewritten in this phase.

## Verification limits

The targeted Vitest case covers non-collection and collection-applicable outcomes. Static audits and parser-only checks are run separately. Full TypeScript typecheck, build, and Vitest execution are not claimed unless the environment can run the project toolchain.
