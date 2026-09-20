# Phase Upstream Interface Repair 49 — Model Column Origin Correlation

## Scope

Whole `packages/core/src`, excluding legacy `packages/core/src/compiler.ts`.

## Root found

`modelColumnFactsCanonical.ts` still accepted two independent low-level collections:

- `ParsedColumn[]`
- `ParsedCast[]`

and correlated them internally by column name. That made the canonical transformer responsible for reconstructing the semantic relation between a model column and its cast.

## Repair

The correlation boundary was moved one level upstream into the scanner origin:

```text
ParsedColumn[] + ParsedCast[]
        ↓
modelColumnOrigin.ts
        ↓
ModelColumnCandidate[]
        ↓
modelColumnFactsCanonical.ts
        ↓
ModelColumnFact[]
```

`ModelColumnCandidate` is now part of the upstream model-source vocabulary and already carries the correlated:

- `property`
- `column`
- `databaseType`
- `type: native | casted`
- `presence`
- `nullability`
- `source`

The canonical builder no longer knows about `ParsedCast`, does not build a cast map, and does not perform column/cast matching.

## SSOT

`ModelColumnFact` remains canonical in:

`packages/core/src/types/upstream/modelSourceFacts.ts`

No duplicate `ModelColumnFact` was introduced.

## Verification

Narrow TypeScript trace was executed. The changed files introduced no new TypeScript diagnostic; existing migration diagnostics remain elsewhere, including the already-known `ModelSemanticPropertyIndex.get` consumers and unrelated RouteParameter/Zod migrations.

`packages/core/src/compiler.ts` remains excluded as legacy.

## Remaining signal

The raw `ParsedModel.columns` / `ParsedModel.casts` vocabulary still exists for scanner compatibility. It is now an upstream/source representation, while `ModelColumnCandidate` is the semantic correlation boundary. Future work should trace producers of `ParsedModel` to determine when the raw pair can be retired rather than reintroducing another join downstream.
