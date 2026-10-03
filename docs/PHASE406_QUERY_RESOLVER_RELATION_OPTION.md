# Phase 406 — Query Resolver RelationOption Boundary

Moved the model-static query operation resolver boundary toward relational semantics. `modelStaticOperationCatalog` and `modelStaticOperationFromExpression` now return `RelationOption<QueryOperationAst>` and use explicit `some/none` witnesses.

This prepares the remaining query resolver catalog for candidate/requirement/rewrite migration instead of procedural sentinel propagation.
