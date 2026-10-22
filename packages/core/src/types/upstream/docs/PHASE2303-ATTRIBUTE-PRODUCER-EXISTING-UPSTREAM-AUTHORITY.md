# Phase 2303 — Attribute Producer Uses the Existing Upstream Expression Authority

## Finding

The upstream contract needed to represent a PHP closure body already exists. `PhpAstExpressionSemanticAuthorityInterface<Evidence>` derives the closed `Expression` ADT, and `Expression` includes `closure` with `ClosureBody`. The gap was consumer bypass: the attribute producer called `resolveClosureBody` directly instead of submitting complete closure syntax evidence through the existing authority boundary.

## Changes

- Evolved the existing `AttributeProducerInterface` input contract to contract version 3 by injecting `PhpAstExpressionSemanticAuthorityInterface<PhpAstValue>`.
- The Laravel attribute scanner wires the existing `phpAstExpressionSemanticAuthority` into the producer.
- The producer now assembles parser-owned closure evidence from the constructor method and delegates its projection through `expressionAuthority.derive(...)`.
- Removed the producer's direct dependency on `resolveClosureBody` and on `subscanners/expressionProducer`.
- Did not introduce a second closure-body interface or duplicate the existing `Expression` / `ClosureBody` ADT.
- Kept `LaravelAttributeScannerInterface` contract version 18 unchanged; the scanner's public input/result contract did not change in this phase.

## Datum path after the change

`ControllerMethodAst` constructor evidence → canonical `PhpAstValue` closure evidence → injected `PhpAstExpressionSemanticAuthorityInterface` → closed `Expression` / `ClosureBody` → `AttributeAst` → `LaravelAttributeScanCompleteJudgment`.

The producer composes the attribute AST from the authority result. The closure-body mapping implementation remains within the existing PHP expression authority implementation, where its current helper is still used internally. This phase therefore closes the attribute producer's contract bypass; it does not claim that the entire expression authority implementation is free of `semantic/relations` or that all other consumers have migrated.

## Remaining boundaries

- `attributeProducer.produce` still selects `__construct` from the declaration's method evidence and returns the existing typed blocker when it is absent. Moving this selection to an upstream closed judgment requires tracing the existing constructor/declaration ownership contracts first; this phase intentionally does not add a duplicate selector interface.
- `providerAstCanonical.ts` still calls `resolveClosureBody` directly. It is a separate consumer and remains a follow-up migration.
- No full typecheck, build, or runtime test is claimed.

## Verification

The Phase 2303 audit script checks the producer contract version, dependency injection, use of the existing authority, and absence of direct `resolveClosureBody` / `expressionFromPhpAst` imports in the attribute producer. Archive integrity and structural checks are run when packaging the phase.
