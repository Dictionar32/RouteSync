# Phase Error Repair 05 — Validation Vocabulary Producer

## Status
**COMPLETED / VERIFIED**

## Scope
Root cause: validation domain types had already been raised to semantic ADTs, but the producer/factory/parser still accepted and produced primitive values (`string`, `number`, `string | null`) and used fallback values such as `0`, `''`, and `null`.

## Repair

### Canonical factory boundary
`packages/core/src/types/domain/validationRules.ts`

`ValidationRuleNodeFactory` now consumes semantic values:

- `array(ArrayElementType)`
- `date(DateFormatSpecification)`
- `min(ValidationConstraintValue)`
- `max(ValidationConstraintValue)`
- `between(ValidationConstraintValue, ValidationConstraintValue)`
- `in(ValidationParameter[])`
- `exists(TableName, ValidationDatabaseColumn)`
- `unique(TableName, ValidationDatabaseColumn)`
- `custom(ValidationRuleName, ValidationParameter[])`

Default absence is represented by explicit ADT variants such as `unspecified` / `default_column`, not `null`.

### Parser boundary
The Laravel validation parser now converts raw parameters into domain vocabulary before constructing nodes. Invalid/missing numeric parameters are no longer silently converted to `0`; they are preserved as custom validation parameters rather than fabricating semantic constraint values.

### Single source of truth
`packages/core/src/types/domain/index.ts` no longer maintains a second copy of the validation node/factory/parser definitions. It re-exports the canonical definitions from `validationRules.ts` and retains only its separate registry/Zod/route-facing structures.

## Verification

Command:

```bash
npx tsc --noEmit --strict --target ES2022 --module NodeNext --moduleResolution NodeNext packages/core/src/types/domain/validationRules.ts
```

Result:

- No diagnostic from `validationRules.ts`.
- No diagnostic from `domain/index.ts`.
- Remaining diagnostics from this compile path are outside root 05 (notably `httpErrors.ts` and legacy `types/route.ts`).

Additional scan of the repaired validation file found no occurrences of:

- `| null`
- `| undefined`
- `??`
- `Number(...) || 0`
- `params[...] || ...`
- `? null`

## Architectural result

```text
Laravel validation source
        ↓
raw parser boundary
        ↓
semantic validation vocabulary
        ↓
ValidationRuleNode ADT
        ↓
RequestField / RequestAst
        ↓
downstream receives meaning, not primitive guesses
```

## Known follow-up
`validationRules.ts` is still larger than the project target of 100 lines/file. Splitting it is intentionally deferred until the error-root migration is stable; splitting now would mix structural cleanup with contract repair.

## Next root
**PHASE 06 — HttpError schema producer/boundary**

Current known error:
`httpErrors.ts` creates a fallback response descriptor whose `schema` is an empty object instead of the required `HttpErrorSchema` ADT.
