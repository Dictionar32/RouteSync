# Phase 406 — Query Resolver RelationOption Boundary

Phase 406 advances the scanner/resolver authority migration after Phase 405.

## Change

`queryEvidenceProducer.ts` now introduces a `RelationOption<QueryOperationAst>` boundary for the model-static operation catalog and resolver. The resolver catalog no longer uses `undefined` as its successful/unsuccessful operation result representation at that boundary; it returns `some/none` relation witnesses.

This is intentionally a semantic boundary migration, not a token substitution. The next migration target is the larger named-method resolver catalog, followed by expression-operation dispatch and query nested traversal.

## Research basis

The architecture follows the same direction as declarative matcher/rewrite systems: constraints select a semantic candidate and a rewrite/resolver produces the witness. MLIR PDLL/PDL explicitly separates matching constraints from rewrites, while declarative rewrite rules encode source patterns, constraints and result patterns.
