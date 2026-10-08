# Phase 1006 — External Architecture Trace

Laravel migrations define schema as a source-controlled database definition and distinguish explicit foreign-key references from convention-based `foreignId(...)->constrained()`. UUID/ULID and composite primary keys are supported.

CodeQL's JavaScript/TypeScript dataflow documentation separates dataflow graph nodes from AST nodes and uses a generic solver driven by a dataflow configuration. Its migration guidance favors the shared `DataFlow::ConfigSig` interface over the deprecated configuration class.

MLIR uses interfaces to let analyses and transformations reason over semantic contracts without encoding knowledge of every concrete operation/dialect.

RouteSync follows the same boundary principle:

`MigrationInterface -> SchemaInterface -> Model semantic reconciliation -> Graph projection`

and separately:

`SemanticDataflowInput -> SemanticDataflowJudgment -> SemanticDataflowInterface -> IR projection`

No migration-to-dataflow solver is introduced.
