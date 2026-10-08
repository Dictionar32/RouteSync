# Phase 435 — Scanner/Resolver Relational Binding Resolution

Phase 435 moves route binding resolution traversal and target selection onto the declarative relation layer.

## Cutover
- `input.bindings.map(...)` -> `relationProject(...)`
- `facts.map(...)` -> `relationProject(...)`
- parent-presence branch -> `relationGate` + `relationEqual`
- implicit-model / implicit-enum / parameter target selection -> relational gates
- model/enum presence selection -> relational gates
- mirrored semantic/upstream/descriptor resolver copies synchronized

## Authority audit
Target resolver has zero occurrences of:
`if`, `for`, `while`, `switch`, `map`, `filter`, `reduce`, `flatMap`, `undefined`, `??`, `null`, `===`, `as unknown`, `||`, `.trim()`, `&&`, `index+N`, `.slice()`.

This is an authority-layer migration, not a textual syntax substitution: collection traversal and semantic alternatives are represented as relation operations.

## Research basis
MLIR PDLL/PDL models matching, constraints and rewrites declaratively; egglog combines equality saturation with Datalog; JastAdd expresses iterative fixed-point computation declaratively.
