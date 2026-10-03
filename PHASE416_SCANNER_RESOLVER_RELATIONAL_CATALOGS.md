# Phase 416 — Scanner/Resolver Relational Catalog Authority

## Research basis
- MLIR PDLL models matching and rewriting declaratively, with explicit constraints and rewrite sections.
- MLIR DRR models source patterns, result patterns, and additional constraints as declarative rewrite rules.
- Souffle models semantic computation as typed relations and rules rather than control-flow procedures.
- egglog combines equality saturation with Datalog.
- JastAdd circular attributes provide declarative fixed-point computation and require monotone finite-height domains for convergence.

## Change
`queryEvidenceProducer.ts` moved two remaining semantic catalog lookups from direct `Map.get()` authority to the RouteSync relational kernel:

`catalog -> relationLookup -> RelationOption -> relationOptionFold -> semantic resolver`

Affected catalogs:
- relation aggregate function catalog
- query join descriptor catalog

The existing public resolver return contracts remain unchanged (`T | undefined`) in this phase; this avoids an unsafe cross-file type migration. The next migration should change those contracts to `RelationOption<T>` at the boundary rather than introducing more sentinel propagation.

## Boundary principle
Source syntax names such as `join`, `withCount`, `leftJoin`, etc. remain vocabulary facts. They are not host-language control flow. The architectural target is removal of imperative authority, not deletion of source-language vocabulary.

## Validation
- TypeScript transpilation of `queryEvidenceProducer.ts`: 0 diagnostics.
- No repository-wide typecheck claim: environment lacks the complete project type dependency set.

## Next frontier
1. Convert named-method resolver return contracts to `RelationOption<QueryOperationAst>`.
2. Convert aggregate/join resolver contracts to `RelationOption`.
3. Migrate `astClassifierEvidence` candidate resolution to the same relation contract.
4. Migrate provider/resource/service resolver catalogs.
5. Only then remove remaining `undefined` sentinels from the semantic authority layer.
