# RouteSync — High-Level Interface Recommendation V55

## Gate result

The actual production scanner flow is:

Laravel source → scanner/AST producers → SourceAsts → CompleteSourceAst → RouteSyncManifest

`CompleteLaravelSourceModel` and `ModelSemanticNode` are declared in `types/upstream/highLevelSourceModel.ts`, but no value-level usage was found outside that declaration file. They are therefore classified as `ORPHANED_INTENDED_PROJECTION`, not as a data-loss boundary.

## Model datum first-loss

The traced model datums are:
- table
- primaryKey
- keyType
- incrementing
- fillable
- guarded
- hidden
- appends

All are proven through the existing production path up to `ModelAst`/`ModelFacts`. No first-loss is proven in the actual production path.

## Interface decision

Do not add top-level fields to `ModelSemanticNode`.
Do not create a parallel model interface.
Do not create a producer solely to satisfy an orphaned type declaration.

Existing semantic ownership remains:

`ModelSemanticNode.facts: ModelFacts`

with `ModelFacts.identity`, `key`, `behavior`, `exposure`, `capabilities`, and `surface`.

## Production repair gate

No high-level production repair is authorized by this trace because the high-level projection is not part of the actual scanner → manifest flow.

The remaining production defects must be repaired independently only when their exact value lineage and canonical owner are proven. In particular, `RouteScanner.scanAsts()` has a real `ParsedRoute[]` → `RouteAst[]` mismatch and requires an existing semantic mapping owner before repair; inventing a cast or parallel interface is prohibited.
