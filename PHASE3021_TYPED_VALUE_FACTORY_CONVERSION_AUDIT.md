# Phase 3021 — Typed Value Factory Conversion Audit

## Scope
This phase stays focused on conversion and on the concern raised about passing a raw `string` to a domain factory. It does not expand the CLI manifest audit.

## Change
`stringValue` is now exported as `StringValueFactoryInterface` with an explicit `.create(sourceText)` operation, and its call sites use `stringValue.create(...)`. `DescriptionTextFactoryInterface.create` accepts `StringValue`, not `string`; it projects the typed upstream value into the existing serialized `DescriptionText` shape. Runtime call sites explicitly construct `StringValue` first and then use `descriptionText.create(...)`.

Updated files:
- `packages/core/src/types/upstream/valueObjects.ts`
- `packages/core/src/types/upstream/queryProducerSemanticReasoning.ts`
- `packages/core/src/compiler/semantic/query/queryEvidenceProducer.ts`
- `packages/core/src/ir/domain/request-endpoint/endpointRefs.ts`
- All TypeScript call sites of `stringValue(...)` under `packages/` were migrated to `stringValue.create(...)` (253 typed factory call sites found after migration).

## Conversion rule
A domain factory should not accept an unmodeled primitive if an upstream typed value already represents the datum. Raw text remains only as the leaf input to the explicit `StringValueFactoryInterface.create` ingestion operation; it is not accepted directly by the higher-level `DescriptionText` domain factory. This is an explicit typed boundary, not a claim that text can be represented without textual data at all.

## Verification
The structural audit checks:
- `StringValueFactoryInterface` exists and the `stringValue` export is typed by that interface.
- Production/test call sites use `stringValue.create(...)`, not the old function call form.
- `DescriptionTextFactoryInterface.create` accepts `StringValue`.
- the factory is explicitly interface-backed (`export const descriptionText: DescriptionTextFactoryInterface`).
- implementation consumes `sourceText.value`, not a free `string` parameter.
- all production `descriptionText.create` call sites pass `StringValue`.
- the old raw-string `descriptionText.create(message)` call is absent.
- the legacy one-byte `packages/core/src/types/upstream/collections.ts` constraint remains unchanged.
- removed relation-foundation files were not restored by this phase.

Syntax transpilation checked 73 TypeScript files that use the converted factory or define/export its contract, with zero syntax diagnostics. This does not constitute a full repository typecheck or a Laravel CLI end-to-end test.
