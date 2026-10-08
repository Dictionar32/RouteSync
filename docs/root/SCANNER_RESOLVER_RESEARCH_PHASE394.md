# Scanner/Resolver Research — Phase 394

The current migration direction is supported by several declarative systems:

- MLIR PDLL defines declarative patterns with match sections, constraints, and rewrite sections.
- MLIR DRR represents rewrites as source patterns, result patterns, and additional constraints.
- JastAdd expresses circular fixed-point analyses declaratively, with convergence based on finite-height lattices and monotonic equations.
- egglog combines equality saturation and Datalog-style relational reasoning.

RouteSync applies these ideas at the semantic boundary: scanner output remains evidence, while candidate selection, constraints, closure, and canonical projection move into relational infrastructure.
