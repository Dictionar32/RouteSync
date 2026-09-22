# Trace Tool Repair — V48 — 2026-09-21

## Execution order
1. Repair trace tool
2. Fresh trace ecommerce-shop-source
3. Recompute first-loss
4. High-level interface authorization
5. Production repair gate

## Tool repairs
- Versioned auditor to `tools/trace-data-loss-v48.cjs`.
- Fresh output: `data-loss-trace-v48.json`.
- Root-level summary counters are now explicit.
- High-level connection requires value-level producer evidence; type references do not count.
- First-loss findings are reconciled after a repaired AST boundary; stale AST-boundary blockers are removed from the fresh count.
- PHP source property evidence uses exact property-assignment matching rather than substring presence.
- Tokenization is not classified as an AST bypass when the file immediately delegates to an existing AST parser / constructs an existing AST/ADT. Remaining token-only semantic bypasses are reported.
- Unproven classification includes the actual high-level connection finding kind.

## Fresh trace
- Laravel PHP files: 111
- Status: `UNPROVEN`
- Critical: 71
- High: 7
- Unproven: 12
- Hidden rescans: 2
- Pipeline rescans: 6
- Nested project-root rescans: 10
- Semantic field loss: 0
- Semantic field mapping unproven: 5
- Semantic lineage unproven: 5
- Return-type mismatches: 1
- Delegate mismatches: 4
- Scanner graph edges: 10
- Semantic reopen edges: 10
- Free-data observations: 13

## First-loss validation
The previously repaired model-property AST boundary is no longer reported as the active first-loss.

For the model datums `table`, `primaryKey`, `keyType`, `incrementing`, `fillable`, `guarded`, `hidden`, `appends`:

`Laravel PHP source -> LaravelSourceLexer.tokenize -> parseModelPropertyAsts -> PhpClassPropertyAst -> applyModelPropertyAst -> ParsedModelMembers -> ParsedModel -> ModelFacts`

is treated as proven.

The active first-loss is now:

`ModelFacts -> ModelSemanticNode / CompleteLaravelSourceModel`

because no value-level producer was found for the existing high-level model.

## High-level interface decision
No new top-level fields are authorized for `ModelSemanticNode`.
Existing ownership is:
- `facts.key`
- `facts.behavior`
- `facts.exposure`
- `facts.capabilities`
- `facts.surface`

Therefore duplicating those as top-level fields would create a second semantic vocabulary.

`SourceModelCatalog` category gaps are also blocked from interface expansion until an actual producer for the existing high-level model is proven.

## Production repair gate
No speculative production interface change was made.
The remaining high-level producer is not proven, so adding fields or inventing a parallel interface would violate the fail-closed trace rule.
Independent proven production defects remain visible for the next repair pass, notably:
- `RouteScanner.scanAsts()` return-type mismatch / legacy delegation
- canonical scanner legacy delegates for FormRequest / Resource / Route
- missing `channels` in canonical SourceAsts vocabulary
- remaining token-only semantic extraction in migration scanner

## Authoritative artifacts
- `tools/trace-data-loss-v48.cjs`
- `data-loss-trace-v48.json`
