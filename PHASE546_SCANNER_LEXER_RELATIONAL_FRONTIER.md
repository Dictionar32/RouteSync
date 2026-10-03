# Phase 546 — Scanner / Lexer Relational Frontier

Phase 546 advances the scanner/lexer boundary from local syntax utilities toward a semantic navigation and fixed-point model.

## Research direction

The design is informed by current declarative language infrastructure:

- Tree-sitter treats parsing as an incremental concrete-syntax operation; RouteSync keeps lexical evidence separate from semantic interpretation.
- SDF3 separates lexical/context-free syntax, disambiguation and AST construction, supporting scannerless parsing and declarative recovery.
- Statix models static semantics as constraints over terms and scope graphs, making name/navigation relationships explicit rather than encoded as host branching.
- MLIR PDL/PDLL and DRR separate pattern matching from rewrite construction.
- egg/equality saturation and egglog demonstrate combining rewriting with relational saturation.
- K expresses executable semantics through configurations and rewrite rules.
- Rascal exposes relations and algebraic data types as first-class analysis structures.
- Flix and Ascent demonstrate fixed-point relational computation and lattice-aware inference.
- SeaHorn demonstrates lowering semantic obligations to constrained Horn clauses rather than embedding proof decisions in host control flow.

## Closed targets

- `packages/core/src/compiler/scanner/subscanners/route-scanner/routePathParser.ts`
- `packages/core/src/compiler/scanner/lexer/routeAst/syntaxRange.ts`
- `packages/core/src/compiler/scanner/lexer/routeAst/syntaxScan.ts`

## Changes

### Route path parser

Route-path normalization now uses relation selection/projection and relation gates for prefix joining, API normalization, segment admission, and default resource selection. Path-parameter extraction is relation projection rather than collection mapping.

### Syntax range

Bounded token navigation is kept as a recursive relation traversal. Presence conversion, compound evidence checks, pair extraction, and call matching are relation-gated. Host logical conjunction and absence-token vocabulary are removed from the closed surface.

### Syntax scan

The scan state transition and fixed-point termination predicate are expressed through relation gates and relation conjunction. The scanner remains evidence-driven; the step function supplies semantic observations while the traversal engine performs closure.

## Architectural consequence

The closed scanner frontier is now closer to:

`lexical evidence -> syntax relation -> candidate/witness -> fixed-point navigation -> semantic projection`

rather than:

`token -> imperative parser branch -> sentinel -> ad-hoc resolver`.

This is the intended boundary for the next scanner/resolver migration waves. The goal is not merely to remove keywords, but to remove host-language constructs as semantic authority.

## Audit

`node scripts/audit-phase546-scanner-lexer-relational-frontier.cjs` requires zero occurrences of the forbidden authority constructs and zero target-level TypeScript transpile diagnostics.
