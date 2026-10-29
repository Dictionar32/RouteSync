# Phase 3082 — Fully Explicit Typed Runtime Scanner Operations

## Change applied to the runtime path

In `packages/core/src/types/upstream/phpSourceFrontendInterface.ts`, both source-read batch traversals now consume their typed inputs in sequence order with `for...of` and delegate classification to existing domain operations:

- `PhpSourceDocumentReadOperationSettlement.contributeToBatch` updates the closed source-read batch state.
- `PhpSourceDocumentReadResult.continueWith` owns complete-versus-blocked classification; the batch consumer only adds the selected domain evidence to its accumulator.

The two traversals no longer expose an integer index, `index + 1`, indexed array access, or recursive cursor advancement. This is a scoped model improvement, not a claim that all primitive control flow has been removed from the repository. Rejection remains a monotonic state transition; source identity, failure evidence, read ordering, and partial documents are preserved.

The source-read factory remains interface-first, and core remains independent of CLI manifest terminal types. The `collections.ts` one-newline invariant is unchanged. Deleted relation foundation modules are not restored.

## Runtime trace: upstream → CLI → manifest → generator

1. `packages/cli/src/commands/scan.ts` and `sync.ts` use the composition-provided `RouteSyncCliManifestScanOperationInterface.scan`.
2. `packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts` discovers controller sources and creates read settlements through `discoveredSourceReadSettlementOperation.readAll`.
3. `phpSourceDocumentReadOperationBatchFactory.fromSettlements` accumulates settlements through `contributeToBatch`, retaining the closed fulfilled/rejected state and stable source order.
4. The existing CLI boundary consumes the batch judgment. Fulfilled reads proceed to `phpSourceDocumentIdentityBindingBatchFactory.bindReads`.
5. `phpSourceDocumentReadBatchFactory.fromResults` consumes read-result ADTs; each result chooses its domain-owned complete/blocked continuation while the batch state preserves complete documents and blockers.
6. Complete documents enter the Laravel controller invocation semantic preparation/pipeline, inventory closure and manifest composition.
7. Both CLI commands validate the canonical `resolvedManifest` through `manifestContractValidationOperations.validate` and persist it through `manifestGeneratorOperations.save`.
8. `sync` also writes invocation, request evidence/resolution, dataflow and IR artifacts; those are additional outputs, not replacements for the canonical manifest JSON.

## Audit

Run:

```sh
node scripts/audits/audit-phase3082-typed-source-read-sequence.cjs
```

The audit checks the two sequence traversals, monotonic rejection state, retained rejection/source identity evidence, actual scan/sync → composition → manifest validation/persistence boundaries, TypeScript syntax transpilation, the `collections.ts` invariant, and the prohibition on restoring deleted relation foundation files.

## Explicitly not claimed

- Syntax transpilation is not a strict TypeScript typecheck.
- Full tests and PHP → CLI → manifest → generator integration have not been run.
- Generic `continueWith<Result>` remains an open frontier. Replacing it must not import CLI terminal types into core or discard rejection/source evidence.
- This phase only removes exposed index-based traversal from the two source-read batch sites; it does not claim repository-wide elimination of `if`, `switch`, primitive types, or all callbacks.

## PHP/Laravel modelling reference

PHP's official documentation describes interfaces as contracts and typed declarations as runtime-enforced boundaries. Laravel's request/controller conventions similarly rely on explicit object contracts. RouteSync should translate those source facts into its own typed evidence/ADT model rather than flattening them into unowned strings or duplicated control flow:

- PHP type declarations: https://www.php.net/manual/en/language.types.declarations.php
- PHP object interfaces: https://www.php.net/manual/en/language.oop5.interfaces.php
- PHP type system: https://www.php.net/manual/en/language.types.type-system.php
- Laravel HTTP requests: https://laravel.com/framework/docs/requests
