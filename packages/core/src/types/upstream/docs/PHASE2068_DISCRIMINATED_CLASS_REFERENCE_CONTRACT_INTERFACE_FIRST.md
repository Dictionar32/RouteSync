# Phase 2068 — Discriminated Class Reference Contract, Interface First

## Trace finding

`ControllerStaticCallOriginInput` carried two representations of the same PHP source class spelling: `className` and the discriminated `classReference`. The authority resolved from `classReference`, so `className` was a second, unused source of truth. The context field also accepted either explicit context evidence or a raw `PhpClassNameResolutionContext`, weakening the available/unavailable ADT boundary.

## Changes

- Removed the duplicate `className` member from `ControllerStaticCallOriginInput`. `classReference` is now the single discriminated representation of source spelling.
- Restricted `classNameResolutionContext` to `ControllerStaticCallClassNameResolutionContextEvidence`, closing the union around `available` and `unavailable`.
- Rewrote the resolver boundary as an exhaustive `switch` over the context discriminant. No synthetic empty context and no duplicate `if` branch remain.
- Advanced `ControllerStaticCallOriginAuthorityInterface.contractVersion` to 11.
- Updated existing tests and historical audits to consume the current contract.

## Scope boundaries

No relation/foundation subscanner was added. No duplicate model, invocation, integrated-response, AST, or runtime authority was introduced. The Laravel scanner remains responsible for structural evidence projection; upstream authorities own semantic judgments.

## Verification boundary

This phase's structural audit and parser checks are recorded in `PHASE2068_VERIFICATION.md`. Full project build, typecheck, and Vitest are not claimed unless explicitly run.
