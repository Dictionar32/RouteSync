# RouteSync — Trace / Suggestion / Repair v46

## Source of truth
Laravel `examples/ecommerce-shop-source` remains the only source evidence. Legacy manifest JSON is not evidence.

## Tool repair
The trace tool now reports:
- first-loss boundary per semantic datum;
- explicit Laravel source vs framework/default origin;
- existing nested semantic owner mapping;
- existing-symbol dataflow;
- high-level projection gaps without inventing interface fields;
- distinction between lexer -> AST construction and semantic token bypass.

## Production AST repair
The proven blocker for Eloquent model properties was repaired.

New canonical AST vocabulary:
- `PhpClassPropertyAst`
- `PhpPropertyVisibility`

New AST producer:
- `packages/core/src/compiler/scanner/subscanners/model/modelPropertyAstParser.ts`

Existing semantic parser now consumes the AST node:
- `modelMemberParser.ts` calls `parseModelPropertyAsts(tokens)`.
- `memberPropertiesParser.ts` applies `PhpClassPropertyAst` through `applyModelPropertyAst`.

No parallel semantic interface was introduced.

## Dataflow now proven for model properties
`Laravel PHP source`
→ `LaravelSourceLexer.tokenize`
→ `parseModelPropertyAsts`
→ `PhpClassPropertyAst`
→ `applyModelPropertyAst`
→ `ParsedModelMembers`
→ `ParsedModel`
→ `ModelFacts`
→ `ModelAst`

The eight existing datums map to existing owners:
- `table` → `ModelFacts.identity.table`
- `primaryKey` → `ModelFacts.key.column`
- `keyType` → `ModelFacts.key.type`
- `incrementing` → `ModelFacts.behavior.incrementing`
- `fillable` → `ModelFacts.exposure.fillable`
- `guarded` → `ModelFacts.exposure.guarded`
- `hidden` → `ModelFacts.exposure.hidden`
- `appends` → `ModelFacts.exposure.appends`

`primaryKey`, `keyType`, `incrementing`, and `guarded` also have explicit framework/model-parser defaults; the trace distinguishes those from explicit Laravel source values.

## Current next blocker
After the AST repair, the first-loss boundary for the eight model datums moved to:
`ModelFacts → ModelSemanticNode / CompleteLaravelSourceModel`.

`ModelSemanticNode` already owns `facts: ModelFacts`; therefore adding `key`, `behavior`, `exposure`, etc. as duplicate top-level fields is blocked.

`CompleteLaravelSourceModel` currently projects only:
`models, resources, requests, responses, routes`.

The canonical `SourceAsts` vocabulary contains additional source families. These must get producer-backed projections before any catalog/interface widening.

## Validation
- v46 trace: `UNPROVEN`
- Laravel PHP files: 111
- critical: 81 (the new high-level connection finding is now explicit)
- high: 7
- semantic field loss: 0
- semantic free-data sites: 9
- AST model-property producer/consumer: `AST_PRODUCER_AND_CONSUMER_PROVEN`

Repository-wide TypeScript typecheck is still blocked by the environment because `@types/node` and `vitest/globals` definitions are unavailable. Changed TypeScript files pass `typescript.transpileModule` syntax validation.
