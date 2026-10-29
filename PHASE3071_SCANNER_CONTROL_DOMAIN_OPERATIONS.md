# Phase 3071 — Scanner Control Domain Operations

## Scope

This phase continues the real upstream runtime path after Phase 3070. It targets `packages/core/src/types/upstream/scannerStatementControlAlgebra.ts`, where token-presence and keyword-recognition judgments used generic `continueWith<Result>` callbacks and a `Map` side channel.

## Model change

- Replaced generic `TokenEvidenceJudgment<Token>` continuation with the closed `TokenHeadJudgment<Token>` and the domain operation `toScannerStatementControlJudgment`.
- Replaced generic `ControlKeywordJudgment` continuation with outcome-specific `recognized` / `unrecognized` cases that expose `toScannerStatementControlJudgment(evidence)`.
- Replaced the `Map` index with a named `controlKeywordCatalog` and `recognizeControlKeyword` operation. PHP spellings remain source evidence; `ScannerStatementControlKind` remains the typed semantic knowledge.
- Kept the exported runtime boundary interface-first: `export const scannerStatementControlContractAlgebra: ScannerStatementControlInterface = Object.freeze(...)`.
- Preserved the existing public `ScannerStatementControlJudgment<Token>` outcomes and `ScannerStatementControlInterface` so consumers do not need a parallel semantic model.

## Runtime trace

`CLI/runtime token stream → ScannerStatementControlInterface.resolve → TokenHeadJudgment → recognizeControlKeyword → typed ScannerStatementControlJudgment → existing scanner consumers → downstream AST/manifest path`.

The phase changes the upstream scanner algebra boundary, not the CLI manifest builder. It does not assert that the whole PHP-to-manifest path has passed an end-to-end fixture.

## Verification limits

The audit script verifies the focused structural contract, TypeScript syntax transpilation, the Phase 3070/3069/3068 regression audits, the one-byte `collections.ts` invariant, and the absence of the deleted relation foundation files. Whole-program strict TypeScript, Vitest runtime, and PHP → CLI → manifest/IR end-to-end tests are not claimed.

## Explicit remaining debt

- Keyword recognition still needs an explicit catalog search and token presence still needs a presence boundary. These are isolated lexical mechanics; this phase does not claim global elimination of `if`, `===`, `undefined`, or all primitive operations.
- `scannerStatementBoundaryAlgebra.ts` and `sourceProjectIdentity.ts` still expose generic continuation operations and should be handled as separate domain-owned migrations after tracing their real consumers.
- No deleted relation foundation was restored, and no kernel re-export to those modules was introduced.
