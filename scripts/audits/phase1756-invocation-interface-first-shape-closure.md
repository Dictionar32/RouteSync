# Phase 1756 — Invocation Interface-First Shape Closure

## Trace finding

Phase 1755 validated the requested invocation's `KnowledgeId` and ordered positional argument evidence. That left an identity-aliasing hole: a caller could reuse an invocation `KnowledgeId` while changing its receiver, operation, argument sequence, or source provenance. Membership checks based only on `KnowledgeId` could then treat the altered request as the source-backed invocation. The same weakness existed when a `positional-evidence-unproven` obligation carried a same-ID but altered invocation.

## Interface-first change

- Evolved `InvocationSemanticContract` from version 36 to 37 before tightening the authority implementation.
- Declared `invocationShape` as a contract invariant: same identity requires equal receiver, operation, ordered arguments, and source provenance.
- Kept `InvocationSemanticAuthorityInterface` as the authority boundary. Validation rejects inconsistent input; it does not reinterpret it into a semantic outcome.
- Added structural invocation-shape comparison in `invocationSemanticJudgmentAuthority.ts`.
- For an identity present in knowledge, reject any requested invocation whose full semantic shape differs. If the identity is absent, preserve the existing missing-evidence judgment behavior.
- Require an unproven positional-evidence obligation to preserve the exact requested invocation shape.
- Added two regression tests for same-ID shape conflicts.
- Kept Laravel scanner flow as `integrate(knowledge)` → `project(response)`; no semantic classification was added to scanner runtime.

## Remaining scanner retirement blocker

`controllerDataflowAnalyzer.ts` still imports `mapResourcePhpAstToUpstream` from `compiler/scanner/subscanners/resource/resourceUpstreamExpressionCanonical.ts`. Other controller/model/provider/service/resource consumers also depend on it. This phase deliberately does not delete or merely relocate that subscanner: its syntax-to-upstream mapping dependencies need a separately traced typed boundary and migration of all consumers first.

## Validation boundary

The static audit script checks the contract declaration, authority enforcement, regression-test presence, and Laravel integrated-response wiring. Full Vitest/typecheck/build were not run because dependencies are not installed in this extracted workspace. ZIP integrity is checked separately after packaging.
