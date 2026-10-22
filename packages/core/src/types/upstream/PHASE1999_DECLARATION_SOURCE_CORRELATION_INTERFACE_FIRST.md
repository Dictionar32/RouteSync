# Phase 1999 — Declaration Source Correlation Interface First

## Trace

Phase 1998 carried declaration-source correlation rejection through the response and artifact ADTs, but the composed response pipeline exposed only `sourceIdentitySemantics`. The scanner therefore had no declared pipeline operation for turning the existing identity relation into the exact correlation ADT consumed by evidence production. Doing that wrapping in scanner wiring would leave a semantic projection decision in the runtime edge.

## Change

- Added `LaravelControllerResponseDeclarationSourceCorrelationInput`, which carries the exact invocation judgment, declaration evidence, and existing `SourceFileIdentityRelationJudgment`.
- Evolved the existing `LaravelControllerResponseSemanticPipelineInterface` with `correlateDeclarationSource`, which wraps the already-produced identity judgment into the existing success/rejection correlation ADT.
- Advanced the existing pipeline interface and contract versions to 4.
- Added a contract rule that this operation binds the exact operands and must not recompute source identity. `LaravelSourceIdentitySemanticsInterface` remains the sole identity owner.
- Exported the input type from the public core entrypoint.

## Explicit boundary

This phase changes the contract only. It does not claim that `laravelControllerScanner.ts` is wired to the operation, that response authorities have concrete runtime implementations, or that `responseJudgment` is populated. Those are the next integration target after the pipeline's correlation operation is implemented and injected. No `relation/foundation` subscanner was added.

## External model reference

TypeScript's discriminated-union guidance supports keeping correlation success and rejection as separate literal-discriminated variants: https://www.typescriptlang.org/docs/handbook/2/narrowing.html
