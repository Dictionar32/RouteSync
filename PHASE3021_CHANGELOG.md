# Phase 3021 Changelog

- Converted `stringValue` from a callable export to `export const stringValue: StringValueFactoryInterface = Object.freeze({ create: ... })`.
- Migrated 253 TypeScript factory call sites from `stringValue(...)` to `stringValue.create(...)`.
- Tightened `DescriptionTextFactoryInterface.create` from raw `string` to upstream `StringValue`.
- Migrated three production call sites to explicitly pass `StringValue` through the interface-backed factory.
- Kept the serialized `DescriptionText` payload shape stable (`kind`, `value`) to avoid unrelated manifest/IR compatibility changes.
- Did not restore relation-foundation modules or alter `collections.ts`.
