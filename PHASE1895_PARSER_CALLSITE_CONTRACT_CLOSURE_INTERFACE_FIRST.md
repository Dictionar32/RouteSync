# Phase 1895 — Parser Call-Site Contract Closure (Interface First)

## Trace finding

The canonical production controller scan path calls `parseControllerDeclarationFromInvocationJudgment`, which accepts the existing `LaravelControllerInvocationSemanticJudgmentInterface`. The underlying parser helper still accepts `filePath` and `InvocationPhpSourceIntegratedResponse` separately and defaults the latter to `not_connected`. Other structural subscanners call the legacy helper without invocation judgments. These are distinct call-site roles and must not be conflated.

## Interface correction

The existing `LaravelControllerInvocationSemanticBoundaryContract` advances to v62 and now states:

- the judgment-taking parser is the canonical semantic boundary;
- the legacy helper is structural-only and its default is not canonical invocation evidence;
- source identity and the exact integrated response are projected from one judgment at the canonical boundary;
- legacy signature retirement is gated on a traced contract for every remaining structural consumer.

No new judgment model, response union, or inventory model is introduced. The scanner and parser implementation files are unchanged. No runtime migration is performed in this phase.

## Verification scope

The new audit checks the contract version, the canonical judgment input, actual legacy structural call sites, unchanged parser/scanner hashes, absence of parallel V2 models, and package-script registration. It is a static audit, not TypeScript compilation or a full build.
