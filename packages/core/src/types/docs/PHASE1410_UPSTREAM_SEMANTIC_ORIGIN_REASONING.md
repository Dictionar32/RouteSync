# Phase 1410 — Upstream Semantic-Origin Reasoning

## Migration

Source-family classification for expression origin has moved out of `sourceAstSemanticProducer.ts` into `sourceAstSemanticOriginAuthority.ts`. The contract is declared in `types/upstream/sourceAstSemanticOriginInterface.ts`.

The evidence explicitly carries source family, owner, member, and field. The authority returns a frozen, closed `SourceAstSemanticOriginJudgment` with the originating evidence preserved. The producer now projects that judgment into expression AST production rather than maintaining its own source-family classification branch.

## Flow

`Laravel source -> SourceAstEvidenceAcquisitionInterface -> SourceAstSyntaxParserInterface -> SourceAstSemanticOriginInterface/Authority -> AST/ADT + dataflow judgment -> wiring -> runtime executor -> manifest/graph/IR/CLI/SDK/React`.

## Remaining boundary work

- Move model accessor eligibility into a closed source-method capability judgment instead of keeping the rule in the producer.
- Migrate remaining Laravel source families onto the same evidence/syntax/reasoning path.
- Run build and integration tests with the repository's exact dependency toolchain.

The package remains `routesync@1.0.49`, and `npm run build` remains `tsdown`.
