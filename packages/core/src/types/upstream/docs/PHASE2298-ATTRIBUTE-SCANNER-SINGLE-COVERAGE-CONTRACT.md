# Phase 2298 — Attribute Scanner Single-Coverage Contract

## Purpose

This phase corrects a structural weakness in the existing upstream `LaravelAttributeScannerInterface`; it does not treat the `subscanners` directory as the target architecture.

## Trace

The active CLI path currently remains:

`packages/cli/src/commands/scan.ts` → `packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts` → `packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts` → `packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts` → injected `LaravelAttributeScannerInterface.scan(...)`.

The current composition root still imports `scanAttributeAsts` from `compiler/scanner/subscanners/attributeAstCanonical.ts`. That import is migration debt, not the desired ownership boundary. The producer implementation still has the previous return shape, and the pipeline still reads `attributeScan.attributes`; neither is claimed migrated in this phase.

## Contract correction

The prior v14 receipt held `enumeratedSourceFiles` and `scannedFiles` as two independently assembled recursive sequences. Their correspondence was described in comments, not bound by the data structure. A consumer could receive two sequences that differed while both satisfied their individual types.

The existing interface is evolved in place to v15:

- `LaravelAttributeScanDiscoveryReceipt.files` is now the single source-ordered coverage sequence.
- Each sequence entry binds one `sourceFile` to that file's `LaravelAttributeScannedFileEvidence`.
- Per-file evidence contains the `AttributeAst` and the closed contextuality judgment, while the enclosing sequence node owns the source path. This avoids duplicating the path inside the evidence.
- The separate `enumeratedSourceFiles` and `scannedFiles` fields are removed from the complete receipt. No second sequence needs to be compared to establish correspondence.
- The separate `LaravelAttributeSourceFileSequence` remains for partial discovery in the blocked judgment; it is not a second complete receipt sequence.
- Directory enumeration evidence still binds project root, directory, scope, and deterministic ordering. A missing or unreadable directory must not be converted into a successful empty sequence.
- Existing `LaravelAttributeScannerInterface` is evolved in place. No parallel V2/legacy interface is added.

## Migration boundary

This phase is interface-first only. It does not claim to retire `subscanners` or make the implementation type-compatible with v15. The next implementation cutover must:

1. make the upstream scanner contract the sole public scan boundary;
2. migrate the active scanner authority and producer to the v15 complete/blocked outcomes without treating the subscanner as the target owner;
3. make the pipeline consume `discoveryReceipt.files` and the contextual inventory, not `attributeScan.attributes`;
4. connect the migrated scanner through the existing pipeline dependency injection to CLI;
5. only then empty/retire old subscanner entry points after proving no active consumers remain;
6. remove `semantic/relations` from the migrated path and never add `semantic/foundation`.

## Validation limits

The audit checks the contract shape and records the remaining active import. It does not prove TypeScript compatibility. No typecheck or `npm run build` was run.

## Official references

- TypeScript interfaces as named structural contracts: https://www.typescriptlang.org/docs/handbook/interfaces
- TypeScript discriminated unions: https://www.typescriptlang.org/docs/handbook/2/narrowing.html
- PHP-Parser AST and name-resolution capabilities: https://github.com/nikic/PHP-Parser/blob/master/doc/2_Usage_of_basic_components.markdown
- PHP directory enumeration failure semantics: https://www.php.net/manual/en/function.scandir.php
- PHP source-read failure semantics: https://www.php.net/manual/en/function.file-get-contents.php
