# Phase 461 — Scanner AST classifier relational cutover

- AST classifier dispatch is now represented as candidate records with `RelationOption` results.
- Rule selection uses `relationProject` -> `relationFirst` -> `relationOptionFold`.
- Single-token and inline-array candidates emit explicit relation options.
- Legacy classifier implementations remain adapters for this cutover; their internal sentinel/control leakage is the next migration frontier.
- No claim is made that the whole scanner is clean.
- Query evidence operation cutover from Phase 460 is preserved.

Research alignment: MLIR PDLL/PDL separates match constraints from rewrite; SDF3 models lexical syntax as productions; egglog combines Datalog and equality saturation.
