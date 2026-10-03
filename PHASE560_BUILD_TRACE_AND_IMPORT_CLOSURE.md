# Phase 560 — Build Trace / Import Closure

## Scope

This phase repairs the build failures present in the supplied build log. No semantic redesign is introduced here; the changes restore the canonical module graph and remove duplicate declarations created during the relational cutover.

## Traced failures

1. `packages/core/src/index.ts:755` imported `./compiler` while `packages/core/src/compiler.ts` was an empty zero-byte shadow module. The canonical compiler surface is `packages/core/src/compiler/index.ts`.
2. The build log contained repeated unresolved imports for the canonical relational substrate:
   - `semantic/kernel/relationalSequence`
   - `semantic/kernel/semanticRelations`
   - `semantic/kernel/requirementSolver`
   - `compiler/scanner/lexer/phpAstStatementKinds`
   The affected compiler/scanner files had stale relative paths after the semantic kernel relocation.
3. `semanticRouteSyntaxRelations.ts` contained two declarations of `arrayArgumentValues`.
4. `queryEvidenceProducer.ts` contained duplicate declarations of the query-column sequence helpers from an incomplete relational migration merge.

## Repair strategy

- Keep `./compiler` as a compatibility boundary and explicitly re-export the canonical `./compiler/index` surface.
- Normalize stale relative imports to the actual `src/semantic/kernel` and scanner lexer locations.
- Retain one canonical `arrayArgumentValues` relation implementation, including whitespace normalization.
- Retain one coherent set of query-column sequence helpers; remove duplicated migration copies.
- Do not introduce casts or scalar semantic fallbacks.

## Verification

The exact unresolved module paths extracted from the supplied build log were re-resolved against the repaired source tree and no longer point at missing files. The duplicated declarations named by the build log are reduced to one declaration each.

A full `npm run build` could not be executed in the isolated workspace because dependency installation (`npm ci`) exceeds the execution transport timeout and `tsup` is not available locally. Therefore this phase does **not** claim a successful full bundler/DTS build; it claims closure of the traced source-level failures.
