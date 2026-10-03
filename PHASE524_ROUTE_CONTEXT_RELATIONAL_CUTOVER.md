# Phase 524 — Route Context Relational Cutover

## Scope

Closed the scanner/resolver authority in:

`packages/core/src/compiler/scanner/subscanners/route-scanner/routeContextTracker.ts`

## Architecture

```text
route token evidence
  -> token/window relations
  -> prefix relation option
  -> middleware argument relation
  -> group-context relation state
  -> recursive context closure
  -> authorization knowledge relation
```

The tracker no longer uses host-language branch constructs as semantic authority for prefix, middleware, group, or authorization decisions.

Presence is represented through `RelationOption`; sequence traversal uses the relational kernel; middleware flattening uses recursive relation expansion; authorization is resolved through semantic relation equality.

## Verification

Phase 524 audit:

- all forbidden surface counts: 0
- `closedSurfaceClean`: true
- target `transpileModule` diagnostics: 0
- direct target TypeScript check: clean

The repository-wide TypeScript check remains environment-limited by the existing dependency/type-definition baseline and is not claimed as a full pass.
