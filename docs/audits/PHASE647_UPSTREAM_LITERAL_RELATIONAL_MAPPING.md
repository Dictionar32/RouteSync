# Phase 647 — Upstream Literal Relational Mapping

## Scope

Move the resource upstream literal adapter away from an untyped `unknown` payload and host-language casts while preserving PHP/Laravel literal vocabulary as source evidence.

## Change

`packages/core/src/compiler/scanner/subscanners/resource/resourceUpstreamExpressionMappings.ts`

- `resolveLiteral` now consumes the closed `PhpLiteralValue` algebra directly.
- The former `value: unknown` boundary and `as string` / `as number` / `as boolean` projections were removed.
- Literal classification is selected through relational option witnesses (`relationFirstOption` + `relationOptionFold`).
- `resourceUpstreamExpressionCanonical.ts` passes the complete literal node to the adapter.

## Semantic boundary

The PHP literal kinds (`string`, `number`, `boolean`, `null`) remain source-language evidence. They are not treated as TypeScript semantic authority.

The adapter now follows:

```text
PHP literal evidence
  -> closed upstream literal fact
  -> relational witness
  -> canonical upstream expression
```

rather than:

```text
PHP literal evidence
  -> unknown payload
  -> host-language cast
  -> semantic expression
```

## Unused-surface audit

No additional non-empty production file met the conservative unused-file proof threshold in this phase. No active file was emptied speculatively and no file was deleted.

## Research basis

The architecture is consistent with declarative rewrite/fixpoint systems: MLIR canonicalization repeatedly applies registered rewrite patterns toward a fixpoint, while declarative rewrite rules separate source patterns and constraints from result construction. Circular Reference Attribute Grammars similarly combine non-local reference dependencies with recursive fixed-point equations.
