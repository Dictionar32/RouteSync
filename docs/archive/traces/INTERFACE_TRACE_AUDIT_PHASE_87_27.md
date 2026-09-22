# RouteSync Interface Trace Audit - Phase 87.27

## Scope
Upstream identity closure for Laravel AST -> semantic ADT -> downstream dataflow.

## Findings
- Phase 87.26 closed `SemanticResolution`, but model/resource resolutions still depended on `bound_unsupported` when no expression node existed.
- This weakened the invariant: the semantic resolution knew `ModelName`/`ResourceName`, while Bound AST discarded that identity.
- Legacy resolver code still consumes `LegacySemanticResolution` and free fields. It is now an explicit migration surface, not the canonical semantic contract.

## Repair
- Added `bound_model_reference` and `bound_resource_reference` to the closed Bound AST.
- Added exhaustive visitor cases and factories.
- Added contract tests proving model/resource identity travels as qualified domain values.

## Target flow
Laravel AST -> resolver -> SemanticResolution ADT -> Bound AST -> IR -> lowerer.

No downstream stage should reconstruct model/resource identity from `type`, optional strings, or fallback values.

## Remaining migration
1. Migrate PrimitiveResolver to SemanticResolutionFactory.
2. Migrate VariableResolver and model-name resolver to modelReference.
3. Migrate AccessorResolver without projecting through legacy fields.
4. Migrate expression/method/resource plugins.
5. Delete LegacySemanticResolution from the semantic kernel boundary.
6. Remove `|| ''`, `|| 'unknown'`, and heuristic semantic reconstruction after producers are closed.
