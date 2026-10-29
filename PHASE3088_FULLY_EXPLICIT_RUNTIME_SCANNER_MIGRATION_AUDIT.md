# Phase 3088 — Fully Explicit Simplicity Typed Runtime Scanner Operations

## Status

**Audit passed with migration frontiers open.** This phase continues from the Phase 3087 archive and records the actual runtime path, the current export inventory, and the next domain-owned migrations. It does not falsely claim the 855 export candidates are converted.

## Runtime path

```text
CLI scan / sync
  → RouteSyncCliManifestScanOperationInterface.scan
  → ControllerInvocationManifestCompositionAuthority.compose
  → source-project identity canonicalization
  → Laravel controller source discovery
  → source-read settlement ADT
  → source identity binding batch
  → PHP source document read batch ADT
  → invocation semantic pipeline and judgment inventory
  → ManifestBuilderJudgment
  → manifest projection and validation
  → canonical manifest / CLI generator output
```

This trace follows the reachable `scan`/`sync` composition path, not a hypothetical compiler-pass graph.

## Interface-first runtime example

The established runtime boundary uses the requested shape:

```ts
export interface RouteSyncCliManifestScanOperationInterface {
  readonly scan: (input: ControllerInvocationManifestCompositionInput) => Promise<ControllerInvocationManifest>;
}

export const routeSyncCliManifestScanOperationFactory: RouteSyncCliManifestScanOperationFactoryInterface = Object.freeze({
  create: authority => Object.freeze({
    scan: input => authority.compose(input),
  }),
});
```

This is an illustrative shape for the existing contract; the checked-in implementation remains authoritative. The next interface migration must improve domain ownership, not merely wrap an existing function.

## Upstream ADT frontier

### 1. Source-project canonicalization

The current path preserves the requested identity, canonical identity, query-policy intent and normalized filesystem evidence. However, `ControllerInvocationManifestCompositionInput` still delegates through a continuation bundle, and its implementation switches over the closed result. The next operation should be owned by the source-project identity domain and remain manifest-neutral. The core layer must not import CLI terminal types.

### 2. Source-read operation batch

`PhpSourceDocumentReadOperationBatchJudgment` still exposes generic `continueWith<Result>` handlers. Do not rename this to another generic visitor. First define the next domain operation owned by source-read semantics, then migrate the CLI consumer and tests together while preserving read order, requested source identity and complete rejection evidence.

### 3. Source-discovery failure evidence

`laravelControllerInvocationSemanticJudgmentInventoryInterface.ts` still contains blocker variants with `failure: unknown`. Normalize the operating-system rejection at the CLI filesystem adapter boundary and pass closed typed evidence upstream; do not silently discard the original failure name/message or collapse a blocked scan into an empty manifest.

## Repository-wide export migration inventory

The Phase 3086 inventory scans 2,382 TypeScript/TSX files and identifies 855 declarations in 334 candidate files: 520 `export function` declarations and 335 exported arrow constants. This is an inventory, not a completed conversion.

A syntax-only codemod is not safe across the whole repository: consumers may depend on recursion, overloads, call signatures, callback compatibility, re-exports, `Parameters<typeof ...>`, and public package exports. Continue in dependency-aware waves: identify domain owner → define explicit interface/object operation → migrate all consumers → verify type/provenance/blocker preservation → run focused tests.

## Primitive/control-flow policy

The requested goal is to remove primitive reasoning where it encodes domain knowledge. It is not safe to delete every `string`, `number`, `boolean`, `undefined`, `null`, array, `if`, `===`, `as`, `void`, loop or map mechanically. These may be required at type, serialization, filesystem, or syntax-recognition boundaries. Replace semantic decisions with closed ADTs and domain operations; preserve parser mechanics where they are mechanics rather than hidden domain truth.

## Verification snapshot

- Phase 3079 runtime trace: **11/11 structural checks passed**, with open migration frontiers.
- Phase 3086 interface factory wave: **9/9 checks passed**.
- Phase 3073 canonicalization trace: **13/14**; one assertion remains failed and the generic continuation is still open.
- Whole-workspace strict TypeScript: **not run** because dependencies are absent in this extracted workspace.
- Full test suite and PHP fixture → CLI → canonical manifest → generator E2E: **not run**.

## Invariants

- Do not restore `relationMembership`, `relationalSequence`, or `semanticRelations` under `packages/core/src/semantic/relations/`.
- Do not create a generic replacement relation foundation.
- Preserve source identity, provenance, order, blocker and rejection evidence.
- Keep `packages/core/src/types/upstream/collections.ts` exactly one newline byte.

## Official references

- PHP interfaces: https://www.php.net/manual/en/language.oop5.interfaces.php
- PHP type declarations: https://www.php.net/manual/en/language.types.declarations.php
- Laravel controllers: https://laravel.com/docs/12.x/controllers
- TypeScript interfaces and object types: https://www.typescriptlang.org/docs/handbook/2/objects.html
