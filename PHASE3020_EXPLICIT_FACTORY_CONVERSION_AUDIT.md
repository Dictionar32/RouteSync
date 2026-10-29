# Phase 3020 — Explicit Factory Conversion Audit

## Scope

This phase prioritizes the requested conversion pattern rather than adding another manifest-tracing feature. One small, domain-cohesive factory in `packages/core/src/types/upstream/valueObjects.ts` was migrated from a callable exported arrow function to an explicitly typed object contract.

## Conversion

Before:

```ts
export const descriptionText = (value: string): DescriptionText =>
  Object.freeze({ kind: 'description_text' as const, value });
```

After:

```ts
export interface DescriptionTextFactoryInterface {
  readonly create: (value: string) => DescriptionText;
}

export const descriptionText: DescriptionTextFactoryInterface = Object.freeze({
  create: (value: string): DescriptionText =>
    Object.freeze({ kind: 'description_text' as const, value }),
});
```

Both production consumers were migrated to the explicit operation:

- `packages/core/src/types/upstream/queryProducerSemanticReasoning.ts`
- `packages/core/src/compiler/semantic/query/queryEvidenceProducer.ts`

They now call `descriptionText.create(...)`. A repository-package scan found no remaining direct `descriptionText(...)` calls.

## Verification

- Structural audit: 10/10 checks passed.
- TypeScript syntax transpilation: 3 files, zero syntax diagnostics.
- `packages/core/src/types/upstream/collections.ts` remains exactly one newline byte.
- Deleted relation foundation modules remain absent; none were restored.
- Full typecheck and unit/end-to-end tests were not run in this phase; syntax transpilation is not a substitute for typechecking.

## Scope boundary

This is one incremental API conversion, not a claim that all exported functions or arrow factories in the repository have been converted. The next conversion should select a cohesive factory group, inventory all import/call sites, migrate consumers, then verify public re-exports and tests before proceeding. Broad mechanical conversion without call-site migration would break runtime contracts.
