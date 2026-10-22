# Phase 2292 — Trace Report

## Decision

Interface first. Strengthen the existing upstream contract before changing producers or wiring.

## Root cause

Phase 2291's proof duplicated `declaration` and `resolution` as separate fields. Both were typed, but their association with the same `LaravelAttributeResolvedInterfaceEvidence` inventory member was not represented in the contract.

## Change

- Evolved `LaravelAttributeScannerInterface` from contract version 9 to 10.
- Added `LaravelContextualAttributeResolvedInterfaceEvidence`, narrowing the resolution to the exact Laravel contextual-attribute identity while retaining the linked source declaration.
- Changed `LaravelContextualAttributeImplementationProof` to reference the single `interfaceEvidence` object.
- Kept producer, pipeline, CLI, and runtime unchanged by design.

## Remaining debt

- Producer and pipeline still implement an older contract shape/version.
- `attributeProducer.ts` still imports `semantic/relations`.
- Full typecheck, fixture tests, and build remain unverified.

## Official references

- PHP namespace imports and aliases: https://www.php.net/manual/en/language.namespaces.importing.php
- TypeScript discriminated unions and narrowing: https://www.typescriptlang.org/docs/handbook/2/narrowing
- PHP-Parser NameResolver documentation: https://github.com/nikic/PHP-Parser/blob/master/doc/2_Usage_of_basic_components.markdown
