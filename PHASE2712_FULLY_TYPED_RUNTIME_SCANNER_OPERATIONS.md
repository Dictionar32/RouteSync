# Phase 2712 — Upstream Syntax Ownership and Runtime Operation Audit

## Scope and result

This phase follows the existing upstream syntax contract before changing implementation. It does **not** claim that the scanner lexer directory is removable yet. It makes two source-level changes on the existing runtime path:

1. `SourceAstSyntaxParserInterface.parseProperties` now accepts source text rather than caller-tokenized input. The existing `sourceAstSyntaxParser` owns tokenization behind this operation and uses the same operation when building the whole-file parse result.
2. The active PHP method parser no longer exports `parsePhpMethod` / `parsePhpMethodOrThrow` as free functions. It exports the interface-typed object `phpMethodParser: PhpMethodParserInterface`, with `parse` and `parseOrReject` operations. Runtime consumers were migrated to this object.

This is a boundary correction, not a full replacement of the legacy scanner parser.

## Trace: CLI → upstream manifest

The audited high-level runtime trace is:

```text
CLI scan/sync command
  → routeSyncCliUpstreamCompositionFactory
  → routeSyncCliManifestScanOperationFactory
  → controllerInvocationManifestCompositionAuthority
  → source-project identity + route selection
  → controller/source discovery and source-document acquisition
  → invocation inventory + semantic judgments
  → manifestBuilderOperationPreparation.prepare(receipt).build()
  → source/model/request/resource scanner contributions
  → request-type semantic pipeline + source evidence inventory
  → occurrence verification + proof verifier + semantic authority
  → manifest_builder_complete OR manifest_builder_blocked
  → CLI projection only when upstream authorities permit it
```

The relevant syntax-owned subpath is:

```text
sourceAstSemanticProducer.produce(sourceProject)
  → sourceAstEvidenceAcquisition.acquire(sourceProject)
  → sourceAstSyntaxParser.parse(evidence.files)
  → sourceAstSyntaxParser.parseProperties(sourceText) [for model properties]
  → phpMethodParser.parse(sourceText, tokens, functionIndex)
  → source/model semantic producers
  → semantic judgments / proof authorities
  → manifest builder
```

Other scanner consumers use the same upstream property operation:

- `laravelModelScanner.ts`
- `lexer/resourceSourceEvidence.ts`
- `laravelFormRequestScanner.ts`
- `subscanners/FormRequestScanner.ts`

They now pass source text to `parseProperties`, rather than exposing `TokenDescriptor[]` as the public argument of that operation.

## Existing upstream parser research

The repository already has:

- `packages/core/src/types/upstream/sourceAstSyntaxParserInterface.ts`
- `packages/core/src/compiler/semantic/sourceAstSyntaxParser.ts`
- `packages/cli/src/parsers/php/sourceFrontendAstAdapter.ts`
- `php-parser` dependency in `packages/cli/package.json`

The CLI adapter uses `php-parser` to produce an AST for invocation/name-resolution evidence. However, that adapter does not yet replace every legacy scanner consumer or produce all existing `PhpMethodAst`, `PhpArrayEntry`, controller, route, resource, and model contracts. The core package does not currently declare `php-parser` as a dependency, and core scanners directly consume `LaravelSourceLexer` / legacy token-based parsers.

Therefore deleting `packages/core/src/compiler/frontend/php` in this phase would break active consumers or require an unproven AST migration. The correct long-term direction is to extend and wire the existing upstream AST frontend contract into these consumers, preserve source locations and syntax evidence, migrate all AST consumers, and only then retire the legacy lexer/parser path.

Related upstream documentation:

- Glayzzle `php-parser` parses PHP source to AST and supports source positions: https://github.com/glayzzle/php-parser
- TypeScript interfaces provide named structural contracts: https://www.typescriptlang.org/docs/handbook/2/objects.html
- TypeScript discriminated unions model variants via tagged union members: https://www.typescriptlang.org/docs/handbook/unions-and-intersections.html

## Source changes

- `packages/core/src/types/upstream/sourceAstSyntaxParserInterface.ts`
  - `parseProperties(source: string)` is now a source-text operation.
  - `parse` is represented as a readonly function property in the contract.
- `packages/core/src/compiler/semantic/sourceAstSyntaxParser.ts`
  - Retains ownership of the property parser operation.
  - Calls the same `parseProperties(evidence.text)` operation when collecting model properties.
  - Uses `phpMethodParser.parse(...)` instead of importing a free parser function.
- `packages/core/src/compiler/frontend/php/phpMethodParser.ts`
  - Replaced exported free functions with private implementations and an interface-typed frozen operation object:

```ts
export interface PhpMethodParserInterface {
  readonly parse: (source: string, tokens: readonly TokenDescriptor[], functionIndex: number) => RelationOption<PhpMethodAst>;
  readonly parseOrReject: (source: string, tokens: readonly TokenDescriptor[], functionIndex: number) => PhpMethodAst;
}

export const phpMethodParser: PhpMethodParserInterface = Object.freeze({
  parse: parsePhpMethodImplementation,
  parseOrReject: parsePhpMethodOrThrowImplementation,
});
```

- Updated consumers: `serviceAstCanonical.ts`, `migrationAstCanonical.ts`, `FormRequestScanner.ts`, `laravelFormRequestScanner.ts`, `resourceSourceEvidence.ts`, `astClassifierRuntime.ts`, and `modelDeclarationParser.ts`.
- Updated the explicit lexer barrel to export the object and interface rather than the free parser functions.
- Updated the historical Phase 2476 ownership audit to reflect the new source-text contract.

## Validation

| Check | Result |
|---|---:|
| Phase 2712 source audit | 13/13 passed |
| Existing Phase 2703 interface-runtime audit | 9/9 passed |
| Updated Phase 2476 syntax ownership audit | 11/11 passed |
| TypeScript syntax transpilation, 12 changed TS files | 0 syntax diagnostics |
| Targeted `tsc` command | Failed with 552 diagnostics across the ad-hoc dependency graph; includes missing Node type declarations and numerous pre-existing type errors in unrelated scanner modules |
| Vitest / package build / CLI end-to-end | Not run; workspace dependencies are not installed in this extracted workspace |

The targeted typecheck output did not identify errors in `phpMethodParser.ts` or `sourceAstSyntaxParserInterface.ts`; however, this does not establish a clean project typecheck. No runtime integration success is claimed.

## Remaining gaps

- `packages/core/src/compiler/frontend/php` remains active and cannot safely be deleted yet.
- 167 `export function` declarations remain in 69 of 386 non-test TypeScript files under `packages/core/src/compiler/scanner`.
- Many scanner consumers still parse from `TokenDescriptor[]`; only the upstream property parsing boundary and method parser exports were corrected in this phase.
- The CLI `php-parser` AST adapter and core scanner pipeline are not yet one unified AST source of truth.
- ADT dispatch cleanup, structural occurrence identity, complete proof-law verification, full typecheck, tests, and CLI scan/sync E2E remain open.

## Conclusion

Phase 2712 reuses the existing upstream syntax parser contract, moves the property-parser tokenization boundary behind that owner, and converts the method parser's exported runtime surface to an interface-typed operation object. It **does not** claim that a lexer is unnecessary throughout the repository. The lexer can only be retired after the existing `php-parser` AST path is integrated into all active scanner consumers and validated end-to-end.
