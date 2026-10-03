# Scanner/Resolver Research — Phase 395

The current design target is not syntactic replacement (`if` -> ternary, `for` -> recursion) by itself. The target is relocation of semantic authority.

Relevant external systems:

- MLIR PDLL: declarative matching, constraints, and rewrites.
- MLIR DRR/PDL: source patterns, result patterns, and explicit constraints.
- egglog: Datalog plus equality saturation, incremental reasoning, lattice-style analyses, congruence closure, and extraction.

RouteSync applies the same separation at a smaller semantic boundary:

```text
scanner evidence -> relation candidates -> witness -> canonical projection
```

A scanner may still recognize source tokens such as `if`, `for`, or `===` because those tokens are facts about the input language. What is being removed is their use as the host-language semantic decision engine in authority layers.
