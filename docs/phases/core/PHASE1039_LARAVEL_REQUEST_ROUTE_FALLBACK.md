# Phase 1039 — Laravel Request Dynamic Property Route Fallback

## Boundary

Laravel dynamic request properties are request evidence, not a new `DataFlowInterface` capability.

For `$request->field`, Laravel resolves the request payload first and, when absent, the matched route parameters. The projection therefore preserves both possible provenances when the matched controller route contains a parameter with the same name.

```text
request payload field ─┐
                       ├─> request dynamic-property access
matched route field ───┘
```

This is an alternative-provenance relation. It does not mean both values exist simultaneously at runtime.

## Changes

- `requestAccessFields` now receives the bound request variable explicitly; it no longer references a caller-local `boundName`.
- `semanticDataflowRequestProjection.ts` resolves routes for the current controller/action through canonical `RouteHighLevelContract` bindings.
- Matching route parameters add `route:<route>:parameter:<field> -> request-access:raw:<field>` facts.
- The generic `DataFlowInterface` remains unchanged.
- Route projection, graph projection, IR projection, ModelRelation, Resource, and Schema remain separate from the solver authority.

## Validation

Run:

```bash
node scripts/audits/audit-phase1039-laravel-request-route-fallback.cjs
node scripts/audits/audit-phase1038-dataflow-interface-upstream-downstream.cjs
node scripts/audits/audit-phase1036-laravel-request-dynamic-properties.cjs
```

A full TypeScript build still requires the workspace's missing `@types/node` and `vitest/globals` dependencies.
