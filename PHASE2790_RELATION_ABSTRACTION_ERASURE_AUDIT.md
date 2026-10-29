# Phase 2790 — Relation Abstraction Erasure Audit

## Requested scope

Remove generic relation utility abstractions across the codebase, including sequence/option/fold/select/project helpers, relation membership/index helpers, and the `TypedRelation<T>` wrapper. Preserve domain-level relation facts and names (for example `depends_on`, `flows_to`, graph edges, and semantic rewrite rules); those represent program meaning rather than the utility abstraction being removed.

## Current inventory

- 342 TypeScript source/test files reference at least one of `relationalSequence`, `relationMembership`, `semanticRelations`, or `semanticTypedRelation`.
- 619 import declarations reference those abstraction modules.
- The highest-frequency utility symbols include `relationEqual` (2,126 textual occurrences), `relationGate` (1,275), `relationOptionFold` (1,159), `relationResolve` (677), and `relationProject` (587).
- `packages/core/src/semantic/relations/` currently has no implementation files for `relationalSequence.ts`, `relationMembership.ts`, or `semanticRelations.ts`, while kernel facades still re-export those missing modules.

## Safety decision

A blanket delete is not a safe migration: it would leave hundreds of unresolved imports and would erase semantic distinctions encoded by option/presence witnesses, folds, membership indexes, and fixed-point operators. The correct implementation is a staged call-site migration to native TypeScript operations and explicit tagged ADTs, followed by deleting each facade only when its imports reach zero.

## Migration gates

1. Replace `TypedRelation<T>` call sites with domain-specific tuple/array contracts; remove `semanticTypedRelation.ts` only after its import count reaches zero.
2. Migrate sequence operations (`relationProject`, `relationSelect`, `relationFold`, `relationExpand`, etc.) to direct local operations without introducing a generic replacement wrapper.
3. Migrate option/presence helpers (`relationResolve`, `relationOptionFold`, `relationSome`/`relationNone`, etc.) to explicit discriminated unions at each call site; preserve absent-vs-empty and complete-vs-blocked distinctions.
4. Replace membership/index utilities with native `Set`/`Map` or domain-specific structures where semantics match.
5. Remove utility modules and compatibility re-exports after `rg`/AST audits show zero references.
6. Run typecheck, build, and targeted tests; report any environment blockers separately.

## Validation status

This is an inventory and migration-gate report, not a claim that relation abstractions have been removed. Full migration and validation remain outstanding.
