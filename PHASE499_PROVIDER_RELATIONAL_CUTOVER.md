# RouteSync Phase 499 — Provider Scanner Relational Cutover

Phase 499 advances the scanner/lexer frontier from the Phase 498 `astClassifierEvidence.ts` closure into the provider resolver/scanner surface.

## Research synthesis

The architecture continues to move from syntax-directed control to semantic facts + constraints + rewrite/closure:

- Statix models static semantics as constraints and name binding as scope-graph relations; its solver can defer resolution until constraint resolution.
- Scope graphs explicitly represent scopes, labeled reachability edges, and declarations, which is a useful model for RouteSync resolver authority.
- MLIR PDLL separates pattern matching from rewriting, while PDL represents rewrite patterns at a higher level.
- Rascal treats extracted facts as relational data, supports transitive closure/enrichment, constraint solving, and rewrite rules.
- egglog combines Datalog-style relations with equality saturation, allowing facts and rewrite equivalence to participate in one saturation engine.

## Phase 499 changes

### `providerAstCanonical.ts`

The provider scanner/resolver was cut over from imperative collection and branching into relational primitives:

- provider binding attributes use relation selection/projection and a relation lookup catalog;
- provider container binding recognition uses relation predicates and contextual-chain facts;
- operation dispatch is represented as `RelationOption<ProviderContainerBinding>`;
- argument extraction uses recursive relation navigation instead of array slicing;
- traversal through closure/method expressions uses recursive relation gates rather than imperative loops;
- optional `make`/`call` parameters no longer use a language-level absence sentinel.

### Upstream semantic vocabulary

`ProviderContainerResolution.parameters` and `ProviderContainerInvocation.parameters` now use an explicit `ExpressionArgumentsOption` algebraic value (`absent | present`) rather than `ExpressionArguments | undefined`.

This is a semantic-vocabulary change: absence is represented as a domain fact, not a JavaScript/TypeScript sentinel.

## Audit

Command:

```text
npm run audit:scanner-lexer:phase499
```

The Phase 499 closed surface is clean, including:

- `lexer/astClassifierEvidence.ts`
- `subscanners/providerAstCanonical.ts`

The next scanner/resolver frontier remains the migration/service/controller/form-request/resource surfaces, with `migrationProducer.ts` currently the largest unresolved surface.

## Validation limitation

The repository's full TypeScript typecheck cannot currently be established because the workspace lacks the `node` and `vitest/globals` type-definition dependencies required by the configured compiler. The Phase 499 audit itself executes successfully.
