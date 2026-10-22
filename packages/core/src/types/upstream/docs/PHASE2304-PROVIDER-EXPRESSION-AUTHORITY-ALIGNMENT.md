# Phase 2304 — Provider Expression Authority Alignment

## Trace

`scanProviderBundle` parses a provider method into `ControllerMethodAst`, then publishes each method as `ProviderMethodEvidence`. Before this phase, method-body construction bypassed the existing upstream expression authority and called `resolveClosureBody(...)` directly.

## Change

Provider method bodies are now supplied to the existing `phpAstExpressionSemanticAuthority.derive(...)` as complete `PhpAstValue` closure evidence. The authority returns the existing closed `Expression` ADT, whose `closure` variant already contains the canonical `ClosureBody`.

No second closure-body interface or parallel expression ADT was added. The existing upstream authority remains the owner of expression/closure projection. The provider consumer no longer imports or calls `resolveClosureBody` directly.

## Boundaries retained

- `PhpAstValue` remains PHP frontend evidence owned by the compiler scanner; the upstream interface remains generic over evidence to avoid reversing dependencies.
- The Laravel attribute scanner continues to use `LaravelAttributeScannerInterface` v18 and the existing expression authority.
- This phase does not claim that the authority implementation's transitive `semantic/relations` dependencies have been removed.
- Attribute producer still selects `__construct` from declaration method evidence. That selection is a separate open contract question; this phase does not disguise it as solved.

## Verification

The structural audit checks that provider method body projection uses the existing authority and no longer imports/calls `resolveClosureBody`. It does not replace TypeScript typecheck, integration tests, or runtime tests.
