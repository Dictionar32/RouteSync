# Phase 434 — Scanner/Resolver Relational Binding + Resource Authority

## Objective
Continue the semantic-authority cutover after Phase 433. The target is not syntax substitution: binding/resource route resolution uses the relational kernel for collection projection, membership and sequence slicing.

## Changes
- `routeBindingSemanticResolver.ts`: fact collection projection uses `relationProject`.
- `routeResourceSemanticResolver.ts`: action membership uses `relationAny` + `relationProject`; resource parent derivation uses `relationSlice` instead of direct `.slice()`.
- No target-level `if`, `for`, `while`, `switch`, `map`, `filter`, `reduce`, `flatMap`, `undefined`, `??`, `null`, `===`, `as unknown`, `||`, `trim`, `&&`, positional `index + N`, or `.slice()` remains in these two authority files.

## Verification
- TypeScript `transpileModule`: 0 diagnostics for both modified files.
- ZIP integrity: verified with `unzip -t`.
- Broader route resolver frontier remains and is intentionally next work; this phase does not claim global eradication.

## Research basis
MLIR PDLL/DRR model matching and rewriting declaratively; MLIR PDL represents matcher/rewrite as IR. egglog combines equality saturation with Datalog. JastAdd circular attributes provide declarative fixed-point computation. These support the RouteSync direction toward relation facts + solver/rewrite closure rather than imperative semantic dispatch.
