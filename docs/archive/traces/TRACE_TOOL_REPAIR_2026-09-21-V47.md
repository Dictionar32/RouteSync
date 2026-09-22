# RouteSync Trace Tool Repair — V47

## Scope lock
Only the trace/audit tool was changed in this step. Production RouteSync interfaces, AST/ADT, scanners, lowerers, and manifest flow were not modified.

## Tool repaired
- `tools/trace-data-loss-v47.cjs`
- output: `data-loss-trace-v47.json`

## Why V46 was insufficient
1. High-level model connection could be mistaken from a type reference; V47 now requires value-level evidence (typed value/return/call/facts assignment).
2. Model dataflow contained a stale hardcoded pre-repair path (`tryParseModelProperty`); V47 derives the checked model edges from the current repaired symbols.
3. Free-data detection was too broad; V47 separates semantic fallback, semantic free containers, and structural containers.
4. V46 output naming could be overwritten during tool evolution; V47 writes its own versioned JSON output.

## New evidence rules
- `ModelFacts -> ModelSemanticNode/CompleteLaravelSourceModel` is not considered connected from declaration/type references alone.
- `Record` / index signatures are classified before becoming blockers.
- `?? undefined` normalization is not automatically treated as semantic reconstruction.
- Model-property dataflow is checked against the repaired AST path:
  `Laravel source -> tokenize -> parseModelMembers -> parseModelPropertyAsts -> applyModelPropertyAst -> ParsedModelMembers -> ParsedModel -> modelAstFromParsed -> ModelAst.facts`.
- `ModelAst -> CompleteSourceAst -> RouteSyncManifest` remains `TRACE_REQUIRED` until producer evidence exists.

## V47 run
- status: `UNPROVEN`
- Laravel PHP files: `111`
- critical: `81`
- high: `7`
- unproven: `11`
- free-data observations: `13`
- semantic free-data/fallback: `12`
- strong high-level value-flow evidence: `0`
- missing SourceAsts category: `channels`
- hidden rescans: `2`
- pipeline rescans: `6`
- nested project-root rescans: `10`

The unchanged critical count is expected: this step strengthens the auditor; it does not claim that production blockers are repaired.

## Next locked scope
Do not change production interfaces/AST/ADT from this result yet. The next production change, when explicitly authorized, must be based on the V47 evidence and must begin at the first proven upstream connection gap.
