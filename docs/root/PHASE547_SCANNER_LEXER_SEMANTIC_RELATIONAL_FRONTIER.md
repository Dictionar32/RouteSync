# Phase 547 — Scanner/Lexer Semantic Relational Frontier

## Direction

Phase 547 continues the relational cutover at the scanner/lexer semantic boundary. The target is not to erase PHP syntax vocabulary (`&&`, `||`, `null`, etc.) from lexical evidence; those spellings are input facts. The target is to prevent host-language control/collection operators from becoming semantic decision machinery.

The architecture follows the useful separation seen across SDF3/Statix, MLIR PDL/DRR, K, and relational/fixed-point systems:

`lexical evidence -> typed syntax facts -> semantic relations -> constraint/rewrite closure -> projection`

SDF3 treats lexical/context-free syntax and disambiguation as declarative grammar material; Statix models name binding through scope graphs and constraint solving; MLIR PDL represents matching and rewriting as an IR-level pattern abstraction; K represents executable semantics through configurations and rewrite rules. RouteSync adopts the same architectural direction without copying their implementation models.

## Cutover

The following scanner/lexer semantic modules were moved further toward relation algebra:

- semantic rewrite matching and saturation
- semantic knowledge/data-flow validation
- interprocedural call-target derivation
- semantic evidence projection
- route syntax target classification predicates
- object identity relation matching
- constraint calculus and constraint-handling closure
- semantic data-flow closure
- state/data-flow equality and fact selection
- relational fixed-point termination predicates

The lexical operator catalog remains evidence-only: token spellings such as `&&`, `||`, `===`, `??`, and `null` remain valid language facts and are not treated as host-language semantic control flow.

## Audit

`node scripts/audit-phase547-scanner-lexer-semantic-frontier.cjs`

Checks:

- no `if/for/while/switch` executable control constructs on the frontier
- no host `.map/.filter/.reduce/.flatMap`
- no host `===`, `||`, `&&`, `??`, `as unknown`, `trim`, `slice`, or synthetic `index + 123` decision machinery
- TypeScript transpilation diagnostics for every frontier file

Phase 545, 546, and 547 audits all pass after this cutover.
