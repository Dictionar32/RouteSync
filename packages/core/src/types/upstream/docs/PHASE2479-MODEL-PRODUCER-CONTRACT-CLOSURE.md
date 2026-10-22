# Phase 2479 — Model Producer Contract Closure

## Trace result

The active model pipeline already has `LaravelModelScannerInterface`, upstream model facts authorities, `SourceAstSyntaxParserInterface`, and `ModelProducerInterface`. Phase 2478 correctly promoted the producer operation contract upstream without relocating the implementation. The trace found that `ModelProducerInterface` exposed two producer operations even though the canonical scanner consumes only `produceResult`; `produce` projected only the AST and duplicated the same operation boundary.

## Change

- Tightened the existing `ModelProducerInterface` to expose the single consumed operation, `produceResult`.
- Kept the producer implementation at `compiler/scanner/subscanners/modelProducer.ts`; no implementation file was moved.
- Kept the implementation as `export const modelProducer: ModelProducerInterface = Object.freeze(...)`.
- Did not add a second producer interface, wrapper, or relation/foundation dependency.
- Added `scripts/audits/audit-phase2479-model-producer-contract-closure.cjs` and the `audit:phase2479-model-producer-contract-closure` script.

## Explicitly unresolved root causes

This phase is a narrow contract correction, not a claim that the model scanner is fully interface-first or that legacy directories are retired:

1. `types/upstream/modelProducerInterface.ts` still imports `ModelDeclarationAst` and `PhpClassPropertyAst` from lexer-owned compiler files. The upstream operation contract therefore leaks lexer ownership.
2. `laravelModelScanner.ts` still imports the implementation from `subscanners/modelProducer.ts`.
3. That implementation still calls `subscanners/model/modelParser.ts` and `subscanners/model/modelCanonical.ts`.
4. The repository-wide scanner still has many `semantic/relations` and `semantic/foundation` imports. They cannot safely be deleted as a bulk operation; each production consumer must be traced to an existing upstream authority/ADT and rewired first.

The next architectural change must establish upstream ownership for the declaration/property evidence using existing contracts where possible, then wire the scanner to that closed evidence and retire the legacy implementation only after all production consumers are migrated. Simply moving the files is explicitly not the fix.

## Verification

Run `npm run audit:phase2479-model-producer-contract-closure`, `npm run audit:phase2478-model-producer-upstream-contract`, `npm run audit:phase2477-model-upstream-relation-independence`, and `npm run audit:phase2467-model-property-upstream-authority` from the repository root. This phase does not claim a full typecheck, package build, Vitest run, or end-to-end CLI verification.


## Superseded by Phase2480

The producer operation has since been integrated into `compiler/scanner/laravelModelScanner.ts` using the existing upstream `ModelProducerInterface`; the former `subscanners/modelProducer.ts` implementation has been retired. This does not yet retire the lower-level `subscanners/model/modelParser.ts` or `modelCanonical.ts` dependencies.
