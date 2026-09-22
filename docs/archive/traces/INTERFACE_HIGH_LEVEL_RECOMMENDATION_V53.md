# High-Level Interface Recommendation — V53

## Trace conclusion
The actual production path is:

Laravel source → PHP AST/ADT → ModelFacts/ModelAst → SourceAsts → CompleteSourceAst → RouteSyncManifest.

`CompleteLaravelSourceModel` and its semantic-node declarations are not reachable from that production path. The auditor therefore classifies them as `ORPHANED_INTENDED_PROJECTION`, not as a first-loss boundary.

## Interface decision
Do not add fields to `ModelSemanticNode`.
Do not create a parallel semantic model.
Do not project `ModelFacts.key`, `behavior`, `exposure`, `capabilities`, or `surface` into new top-level fields.

Those meanings already have an existing owner: `ModelFacts`.

## If high-level model becomes an intended compiler stage
Integrate the existing owner as an explicit stage at the origin boundary. The integration must be source-backed and value-level proven before the auditor treats it as production flow.

The current trace does not authorize adding catalog fields for controllers/services/migrations/etc. merely because `SourceModelCatalog` does not contain them. That is a projection design decision, not proven data loss.

## Production repair authorized by current trace
Repair only actual production-flow defects. The first model datum loss is not authorized because no model datum is lost in the actual scanner → manifest path.
