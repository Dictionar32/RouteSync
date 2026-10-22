# Phase 1437 — Terminal Expression Evidence Contract

## Change

Expression candidate arbitration now distinguishes a terminal source-evidence failure from both a rejected candidate and a selected structure. `ExpressionCandidateContract.isTerminal` is optional and, when supplied, causes the algebra to stop in a closed `terminal` resolution. The attempt trail records `outcome: 'terminal'`; later candidates are not evaluated.

The PHP expression evidence provider no longer throws when the conditional or prefix form algebra reports malformed source evidence or a prefix contract violation. The compound-expression operator lookup also returns typed malformed delimiter evidence rather than routing that outcome through the runtime helper that throws. The upstream arbitration authority closes terminal evidence into `malformed_source` or `contract_violation` judgment variants while preserving candidate identity and attempt trail.

The duplicate `classifyTernary` runtime fallback was removed: the compound-expression provider is now the single ternary candidate path. The runtime executor consumes the closed judgment. It emits a diagnostic for malformed input, but does not decide whether the source is malformed, which candidate wins, or whether later candidates should run.

## Pipeline

`PHP token evidence → PHP evidence provider → candidate algebra (priority + terminal semantics) → closed ExpressionStructureJudgment → runtime executor → AST projector`

## Validation scope

`audit-phase1437-terminal-expression-evidence-contract.cjs` checks source boundaries and regression-test shape. These checks are static checks, not a substitute for executing TypeScript tests or building the package. The build remains blocked because `tsdown` is absent; the available global TypeScript compiler is incompatible with this repository configuration and required type definitions are missing.
