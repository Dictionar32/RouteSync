# Phase 1774 — Invocation Semantic Judgment Interface First

## Trace

The upstream name-resolution judgment already owns the resolved target (`resolved_builtin_function`, `resolved_declared_function`, or `resolved_external_function`). The invocation judgment previously duplicated that decision by also carrying an independently constructible `Expression` (`builtin` or `call`). This allowed the interface shape to represent an expression that did not correspond to the retained resolution target.

## Interface evolution

- Evolved the existing `PhpFunctionInvocationSemanticJudgment` instead of adding a parallel interface.
- Both resolved and unresolved invocation outcomes now preserve the resolution judgment, typed arguments, and invocation source.
- Removed expression construction from `phpFunctionInvocationSemanticAuthority`; it now closes the outcome only. AST/expression construction is reserved for a later projection boundary that consumes the completed judgment.
- Kept unresolved, ambiguous, and deferred name outcomes explicit; none is silently projected as an ordinary call.

## Remaining boundaries

- `phpFunctionNameResolutionAuthorityInterface` still lacks a production authority implementation.
- `phpFunctionCallSemanticAuthority` still classifies raw short names through a builtin catalog.
- The resource subscanner still calls that legacy raw-name authority. This phase intentionally does not claim that scanner wiring or subscanner retirement is complete.
- `semantic/foundation` is not introduced.

## Validation

Static contract audits only. No TypeScript typecheck, Vitest, or full build was run.
