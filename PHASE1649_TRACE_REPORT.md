# Phase 1649 — Trace Report

## Scope traced

- `packages/core/src/types/upstream`
- `packages/core/src/compiler/scanner`
- `packages/core/src/semantic/kernel`
- `packages/core/src/semantic/foundation`
- `packages/core/src/semantic/relations`
- Invocation semantic contract → derivation compiler → invocation algebra → authority → runtime executor → scanner facade

## Findings and changes

1. The previous implementation had 721 TypeScript import/export lines pointing into the `semantic/foundation` owner, spread across 378 source files.
2. The relation engine was moved to `packages/core/src/semantic/relations/` and all TypeScript source import paths were rewired to that owner.
3. Nine former implementation files under `packages/core/src/semantic/foundation/` were emptied in place. Their paths remain, but they contain no implementation.
4. Four compatibility re-export modules under `packages/core/src/semantic/kernel/` were also rewired; these paths did not contain the literal `semantic/foundation` substring and required a separate audit.
5. A source-wide TypeScript scan now reports zero `foundation/` imports or re-exports.
6. The invocation semantic interface, generic declarative derivation compiler, authority, executor, and scanner facade remain connected. The scanner facade does not execute the relation engine or invoke the semantic algebra directly.

## Ownership boundary

- `types/upstream`: typed semantic contracts, derivation program, judgment, proof trace, and authority interfaces.
- `semantic/relations`: relation engine operations and fixed-point rewrite implementation.
- `invocationSemanticJudgmentAlgebra`: domain-specific invocation analysis using the declared derivation program and relation engine.
- `invocationSemanticJudgmentAuthority`: public semantic authority boundary.
- `invocationSemanticRuntimeExecutor`: delegates to authority only.
- `compiler/scanner`: calls the executor/facade and does not own semantic reasoning.

## Verification

- Phase 1637 and Phase 1639–1649 audits: 94/94 static checks passed.
- Strict TypeScript check of the invocation contract/compiler/algebra/authority/executor/scanner slice: passed.
- Source-wide TypeScript check: still fails due absent dependencies (`axios`, Node type declarations) and numerous pre-existing errors outside this migration; it no longer reports legacy foundation files as missing modules.
- `npm run build`: unavailable because `tsdown` is not installed in the workspace.
- ZIP integrity: verified separately before delivery.
