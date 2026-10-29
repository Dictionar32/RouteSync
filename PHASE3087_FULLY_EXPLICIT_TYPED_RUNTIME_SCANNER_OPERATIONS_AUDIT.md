# Phase 3087 — Fully Explicit Typed Runtime Scanner Operations

## Status

**Runtime trace confirmed structurally; repository-wide export migration remains incomplete.** This phase records the actual CLI → upstream → manifest → generator route and the next safe migration boundary. It does not label the 855 remaining export declarations as converted.

## Runtime path observed

```text
CLI scan / sync
  → routeSyncCliManifestScanOperationFactory.scan(...)
  → ControllerInvocationManifestCompositionAuthority.compose(...)
  → source-project identity canonicalization
  → LaravelControllerSourceDiscoveryInterface.discover(...)
  → discovered source inventory
  → discoveredSourceReadSettlementOperation.readAll(...)
  → phpSourceDocumentReadOperationBatchFactory.fromSettlements(...)
  → source identity binding batch
  → phpSourceDocumentReadBatchFactory.fromResults(...)
  → controller invocation semantic pipeline
  → semantic judgment inventory / manifest-builder preparation
  → ManifestBuilderJudgment
  → manifest projection and validation
  → canonical manifest output
  → CLI generator output / persistence
```

The path is grounded in `packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts`, `packages/cli/src/manifestScanOperationInterface.ts`, `packages/core/src/types/upstream/phpSourceFrontendInterface.ts`, and the Phase 3073/3079 audit scripts. This is a structural trace, not proof of a full end-to-end runtime run.

## Interface-first example on the runtime path

```ts
export interface PhpSourceDocumentReadOperationSettlementFactoryInterface {
  readonly kind: 'php_source_document_read_operation_settlement_factory';
  readonly fulfilled: (
    requestedSourceFile: SourceFile,
    result: PhpSourceDocumentReadResult,
  ) => PhpSourceDocumentReadOperationFulfilledEvidence;
  readonly rejected: (
    sourceFile: SourceFile,
    failure: PhpSourceDocumentReadFailureEvidence,
  ) => PhpSourceDocumentReadOperationRejectedEvidence;
}

export const phpSourceDocumentReadOperationSettlementFactory:
  PhpSourceDocumentReadOperationSettlementFactoryInterface = Object.freeze({
    kind: 'php_source_document_read_operation_settlement_factory',
    fulfilled: (requestedSourceFile, result) => /* preserve read identity + result evidence */,
    rejected: (sourceFile, failure) => /* preserve source identity + normalized failure evidence */,
  });
```

The excerpt is schematic, not a replacement implementation. The checked-in factory and its concrete return types remain authoritative. It illustrates the target form: named domain contract, typed object export, domain-owned operations, immutable result evidence.

## Upstream ADT rule

An upstream ADT must not merely expose `kind` and payload. It should own the operation that interprets its evidence for the next domain step. The next candidate is `PhpSourceDocumentReadOperationBatchJudgment` in `packages/core/src/types/upstream/phpSourceFrontendInterface.ts`: its `continueWith<Result>` remains generic and is consumed at the CLI composition boundary. Replace it only after defining a source-read-owned, manifest-neutral continuation/outcome contract and migrating all consumers together; do not import CLI manifest terminal types into core and do not rename a generic visitor while leaving its abstraction unchanged.

## Current export migration inventory

The Phase 3086 inventory scans 2,382 TypeScript/TSX files under `packages/` and reports **855 declarations remaining** in the requested syntactic categories:

- `export function`: 520 (`core` 470, `react` 30, `sdk` 20)
- `export const name = (...) => ...`: 335 (`core` 319, `react` 16, `sdk` 0)
- candidate files: 334

The existing `phpQualifiedClassNameFactory` conversion is verified by the Phase 3086 audit and has 53 `.create(...)` consumer call sites. A syntax-only global rewrite is not safe: recursive calls, direct imports, callbacks, overloads, re-exports, `Parameters<typeof ...>`, and public package API consumers must migrate in the same domain-owned wave. Therefore this phase does **not** claim all 855 have been converted.

## Control-flow and primitive audit policy

Do not mechanically delete `string`, `number`, `boolean`, `undefined`, `null`, arrays, `if`, `===`, ternaries, `map`, loops, visitors, `as`, or `void` without replacing the information/operation they currently represent. For each reachable runtime occurrence, classify whether it is:

1. domain knowledge that belongs in an upstream typed ADT operation;
2. syntax recognition / parser mechanics that must remain at the syntax boundary;
3. a serialization or platform boundary representation;
4. an actual information-loss fallback or duplicated authority that should be removed.

The goal is to eliminate primitive/control-flow reasoning where it encodes domain meaning, not to erase TypeScript or parser mechanics and lose source evidence. Preserve source identity, provenance, rejection details, blocker outcomes, ordering, and canonical manifest data.

## Audit results from this workspace

- Phase 3086 repository-wide export inventory audit: **9/9 checks passed**, 855 declarations still outstanding.
- Phase 3079 runtime scanner trace: **11/11 structural checks passed with open migration frontiers**.
- Phase 3085 interface-first read-result projection: **9/9 structural checks passed**.
- Phase 3073 source-project/manifest trace: **13/14 checks passed**; failures are `canonicalizationRetainsUnknownFailurePayload` and the legacy expectation around canonicalization continuation. The report also flags a generic canonicalization continuation. These must be reconciled before claiming the full path is clean.
- Full workspace strict typecheck, full test suite, and PHP fixture → CLI → canonical manifest → generator end-to-end execution: **not verified** in this extracted workspace.

## Invariants

- Keep `packages/core/src/types/upstream/collections.ts` exactly one newline byte.
- Do not restore `packages/core/src/semantic/relations/relationMembership.ts`, `relationalSequence.ts`, or `semanticRelations.ts`.
- Do not create a generic replacement relation foundation or kernel re-exports to the deleted modules.
- Migrate exports in dependency-aware waves: identify domain owner → define explicit interface/object operation → migrate every consumer → audit data/provenance/blocker preservation → run focused checks → typecheck/tests/E2E.

## External references

- TypeScript interface contracts: https://www.typescriptlang.org/docs/handbook/2/objects.html
- PHP object interfaces: https://www.php.net/manual/en/language.oop5.interfaces.php
- PHP type declarations: https://www.php.net/manual/en/language.types.declarations.php
- Laravel controllers and route-to-controller dispatch: https://laravel.com/framework/docs/12.x/controllers
