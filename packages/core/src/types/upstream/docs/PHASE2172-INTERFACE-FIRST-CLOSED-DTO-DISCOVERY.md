# Phase 2172 — Interface-first closed DTO discovery and executor contract

## Scope of this phase

This phase changes upstream contracts only. It intentionally does not wire the new inventory into `scanDtoAsts`, `LaravelControllerScanner`, or the integrated response implementation. Those implementation changes must follow the contract review rather than invent the contract after the fact.

## Trace findings

1. `packages/core/src/compiler/scanner/subscanners/dtoAstCanonical.ts` still returns `readonly DtoAst[]`.
2. It scans only `app/Http/DTOs`; that is a scoped inventory, not proof of project-wide DTO completeness.
3. `collectPhpFiles` currently represents a missing directory as an empty result, so a future producer must distinguish a valid empty directory from a missing scan root.
4. The scanner still imports `relation*` helpers. This phase does not add a relation/foundation layer or another subscanner, and does not claim that those existing dependencies have been retired.
5. `LaravelControllerResponseIntegratedJudgmentInput` still accepts `dtoInventory: readonly DtoAst[]`; the new declaration judgment has not yet been propagated to that interface or its implementation.
6. `responseAttributeScanner.ts` still contains legacy filesystem/name-based DTO resolution. It must not be removed until the new evidence path has coverage and parity tests.
7. Invocation meaning remains owned by the existing invocation semantic judgment authority. The response executor remains a delegate to the existing response authority; this phase adds no duplicate invocation or response authority.

## Contract corrections

- Added `LaravelDtoDeclarationDiscoveryBlocker` as a closed ADT with source operands.
- Changed incomplete inventory blockers to a non-empty tuple. `inventory_incomplete` can no longer be typed with an empty blocker list.
- Made the existing PHP class-name authority the explicit owner of qualified identity resolution.
- Explicitly forbade short-name and filename fallback as a substitute for qualified identity.
- Made the DTO declaration runtime executor's delegation and closed-result obligations explicit.
- Kept declaration resolution separate from `ResponseContract` production; the existing integrated response authority remains the composition owner.

## Required implementation order

1. Implement a producer for `LaravelProjectDtoDeclarationInventoryInterface` that distinguishes missing root, unreadable files, parse failures, and a genuinely completed scan of the declared scope.
2. Supply PHP namespace/import context to the existing `PhpClassNameResolutionRuleInterface`; if the context is unavailable, retain an unresolved class identity rather than guessing.
3. Implement the declaration authority against the closed inventory and qualified class identity.
4. Evolve the existing integrated response input to consume the declaration judgment; do not create a parallel response authority or a new subscanner.
5. Produce the existing response evidence from that judgment and preserve unresolved/ambiguous outcomes as blockers.
6. Only after parity/coverage tests, retire the legacy filesystem/name fallback path.

## Verification status

No build, typecheck, or test suite was run in this phase. The scanner producer and downstream wiring remain unchanged and are not claimed to satisfy the new contract yet.
