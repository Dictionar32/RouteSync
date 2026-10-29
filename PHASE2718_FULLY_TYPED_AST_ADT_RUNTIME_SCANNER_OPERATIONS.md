# Phase 2718 — Fully Typed AST ADT Runtime Scanner Operations

## Implemented source changes

This phase moves request-domain-to-upstream-AST canonicalization out of the scanner and consolidates duplicate implementations.

### Ownership changes

- Moved the canonicalization implementation to `packages/core/src/compiler/semantic/requestAstCanonical.ts`.
- Deleted the duplicate implementation at `packages/core/src/compiler/scanner/operations/requestAstCanonical.ts`.
- Deleted the duplicate implementation at `packages/core/src/compiler/scanner/subscanners/requestAstCanonical.ts`.
- Updated both runtime consumers (`operations/requestProducer.ts` and `subscanners/requestProducer.ts`) to call the same semantic owner: `requestAstCanonicalization.fieldFromSource`.
- Removed the duplicate unused `field(...)` conversion body and retained one `buildRequestField(...)` implementation.
- Replaced exported free functions with the interface-typed immutable operation object `requestAstCanonicalization`.
- Added the upstream contract `RequestAstCanonicalizationInterface` in `packages/core/src/types/upstream/requestAstCanonicalizationInterface.ts` and exported its type through upstream/core barrels.

The operation shape is:

```ts
export const requestAstCanonicalization: RequestAstCanonicalizationInterface = Object.freeze({
  fieldFromSource: (field: RequestField): UpstreamRequestField => buildRequestField(field),
  astFromSource: (request: FormRequestSource): RequestAst => buildRequestAst(request),
});
```

No relation foundation, generic relation helper, or replacement semantic foundation was introduced by this phase.

## CLI manifest runtime trace

The source path was traced through these existing runtime anchors:

```text
packages/cli/src/commands/scan.ts / commands/sync.ts
  -> composition.manifestScanOperation.scan(input)
  -> packages/cli/src/upstreamCompositionFactory.ts
  -> packages/cli/src/manifestScanOperationInterface.ts
  -> controller invocation manifest composition authority
  -> source acquisition / source identity / AST evidence
  -> inventory and semantic judgment closure
  -> packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts
  -> manifest_builder_complete | manifest_builder_blocked
  -> CLI projection only after the accepted manifest result
```

`scan.ts` explicitly preserves distinct blocked variants for source-project identity, source-document identity, source acquisition, source discovery, inventory rejection, and manifest-builder rejection. The refactor does not weaken those boundaries.

## Static audit

Run:

```bash
npm run audit:phase2718-request-ast-adt-ownership
```

Result: **9/9 static checks passed**. The audit verifies the single semantic owner, interface-first immutable object, no exported free functions in the moved module, removal of duplicate files, migrated consumers, absence of the deleted `relationFoundation` implementation files, and existence of the CLI manifest trace anchors.

## Explicitly unresolved

- The previous destructive removal of `relationFoundation` leaves **28 source files** importing the removed module. These legacy imports remain visible in the audit and are not hidden or replaced by a new foundation. The workspace is expected to fail typecheck/build until consumers are migrated to their real owners or existing upstream APIs.
- `compiler/scanner` still contains implementation folders such as `binders`, `descriptors`, `operations`, `resolvers`, `semantic`, `subscanners`, and `symbols`. This phase moves one duplicated request-AST semantic slice; it does **not** claim scanner is fully wiring-only.
- Typecheck, unit tests, and CLI end-to-end were not validated. The globally available TypeScript compiler is incompatible with the repository's configured target/lib and lacks `node` and `vitest/globals` type definitions in this extracted workspace.

## Validation result

- Static audit: PASS (9/9).
- Typecheck: NOT VERIFIED (environment/toolchain errors).
- Unit tests: NOT RUN.
- CLI scan/sync end-to-end: NOT RUN.
