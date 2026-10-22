# Phase 2282 — Laravel Scanner Contextual-Attribute Inventory Contract

## Goal

Strengthen the existing upstream Laravel scanner contract before changing its runtime wiring. The scanner must receive source-correlated, closed contextual-attribute evidence instead of a list of names whose provenance and completeness are not represented in the type.

## Production trace

1. `packages/cli/src/commands/scan.ts` enters the manifest scan composition.
2. `packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts` reaches the source/manifest pipeline.
3. `packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts` calls the existing attribute scanner, filters contextual declarations, extracts `definition.name.value.value`, and passes `contextualAttributeNames` to `controllerScanner.scan(...)`.
4. `packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts` forwards the name list into `LaravelControllerActionSemanticJudgmentAuthorityInterface.judge(...)`.
5. `packages/core/src/types/upstream/controllerDependencySemanticJudgmentInterface.ts` already expects `customContextualAttributeNames: readonly ClassName[]`.

The gap is upstream of the action judgment: the scanner input represents contextual-attribute discovery as names only. It cannot express which source declaration produced each identity or whether discovery completed and found no declarations versus was not supplied.

## Interface-first changes

- Evolved the existing `LaravelControllerScannerInterface` input from `contextualAttributeNames` to `contextualAttributeInventory`.
- Added a closed, discriminated upstream inventory contract with a source-project identity and source-correlated declaration evidence.
- Each declaration carries the existing `ClassName` value object and `SourceSpan`; no new generic wrapper, duplicate scanner, `semantic/foundation`, or `semantic/relations` dependency was introduced.
- Evolved the scanner contract/result version from 39 to 40.
- Evolved the existing `LaravelControllerActionProjectionMigration` obligation set to retain the unclosed source-pipeline-to-inventory boundary and the still-open projection to the action authority's existing `ClassName[]` input.
- Evolved the action contract metadata from version 51 to 52.

## Deliberately not changed

No runtime or CLI wiring was edited. The source pipeline still produces the old `contextualAttributeNames` input, and the scanner implementation still declares version 38. This is intentionally an interface-first contract phase and is **not** typecheck/build-ready. The next phase must update the upstream attribute evidence producer and wire the closed inventory through the existing scanner/action path without adding semantic classification to the runtime.

The new inventory type is a contract requirement, not a claim that a producer already issues a validated inventory. That ownership remains explicitly open in the migration ADT.

## Validation

`node --check scripts/audits/audit-phase2282-contextual-attribute-inventory-interface.cjs` passed.

The phase audit passed 11/11 static contract checks, including closed inventory shape, source identity, source span, migration debt, contract version evolution, current unconverted producer, and absence of forbidden foundation/relation imports in the scanner interface.

TypeScript typecheck and package build were not run. Because wiring is intentionally not changed in this phase, the source/runtime contract mismatch remains open and is not represented as a successful build.

## External references

- TypeScript Handbook — discriminated unions: https://www.typescriptlang.org/docs/handbook/2/narrowing.html
- PHP-Parser — AST and source location/traversal capabilities: https://github.com/nikic/PHP-Parser

These references support the distinction between explicit typed variants and parser/source evidence. They do not prove the local RouteSync implementation is complete.
