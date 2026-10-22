# Phase2478 — Model Producer Upstream Contract

## Audit finding

`LaravelModelScannerInterface` already owned the scanner boundary, and model facts authorities already had typed interfaces. The missing ownership boundary was the composite `ModelProducerInterface`: it was declared inside `compiler/scanner/subscanners/modelProducer.ts`, despite being consumed by the canonical Laravel model scanner. This made the active path depend on a subscanner-owned producer contract.

## Change

- Promoted `ModelProducerInput`, `ModelProducerResult`, and `ModelProducerInterface` into `types/upstream/modelProducerInterface.ts`.
- Exported that contract through the upstream barrel and public core type exports.
- Kept the producer implementation at its existing path, `compiler/scanner/subscanners/modelProducer.ts`; only the operation contract is owned by `types/upstream`.
- Kept `laravelModelScanner.ts` wired to that existing implementation. No producer implementation file is relocated in the corrected phase artifact.
- Updated phase audits that asserted the old path.

## Remaining ownership debt (explicit)

The producer's input currently includes `ModelDeclarationAst` and `PhpClassPropertyAst`, whose declarations still live under `compiler/scanner/lexer`. The new upstream contract currently imports those types from that legacy owner. Therefore this phase closes the subscanner-owned producer boundary but does **not** claim the lexer is retired or that the upstream dependency direction is fully closed. The next required change is to establish a canonical upstream syntax-evidence type contract and migrate lexer consumers before removing lexer implementation files. The producer also delegates semantic model construction to `subscanners/model/modelParser.ts` and `modelCanonical.ts`; those remain on the follow-up migration list.

## Relation/foundation

The canonical scanner and producer modules have no direct `semantic/relations` or `semantic/foundation` imports. This is a direct-import assertion only, not a claim that the transitive model parser dependency graph is clean.

## Verification boundary

The phase audit checks ownership, wiring, exports, direct forbidden imports, and removal of the old producer path. Full typecheck, package build, tests, and CLI end-to-end are separate checks and must not be inferred from static audit success.


### Correction after review

The first Phase2478 artifact incorrectly relocated the producer implementation. The corrected artifact restores the implementation to its original path. The intended change here is contract ownership, not file movement. This does not claim that the subscanner implementation has been retired; its semantic dependencies must be migrated and validated before removal.


## Superseded by Phase2480

The producer operation has since been integrated into `compiler/scanner/laravelModelScanner.ts` using the existing upstream `ModelProducerInterface`; the former `subscanners/modelProducer.ts` implementation has been retired. This does not yet retire the lower-level `subscanners/model/modelParser.ts` or `modelCanonical.ts` dependencies.
