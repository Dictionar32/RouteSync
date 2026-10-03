# Phase 571 — Build Trace: FormActionGenerator StringValue Boundary

## Trace

`build(7).log` shows all ESM/CJS bundles succeeding. The only DTS failure is:

`FormActionGenerator.ts(72,32): error TS2322: Type 'StringValue' is not assignable to type 'string'.`

The failing projection was `resource: value => value.resourceName.value`.

## Root cause

`ResourceName.value` is a `StringValue`, not a primitive `string`:

`ResourceName = { kind: 'resource_name'; value: StringValue }`.

Therefore the generator must cross the semantic value-object boundary explicitly and project the wrapped primitive through `.value.value`.

The same semantic shape occurs in `resourceCollection`, so that projection was corrected at the same time to prevent the next DTS frontier from exposing the identical mismatch.

## Fix

- `resource: value => value.resourceName.value.value`
- `resourceCollection: value => \`Array<${value.resourceName.value.value}>\``

No semantic fallback or type assertion was introduced.
