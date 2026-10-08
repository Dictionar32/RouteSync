# Phase 274 — Construct-Free Semantic Adapter

Phase 274 introduced the syntax/evidence projector boundary so the semantic
knowledge adapter no longer dispatches directly on PHP statement construct names.

Phase 275 strengthens this boundary: construct-shaped selection/repetition has also
been removed from the canonical `SemanticFact` model. See
`PHASE275_RELATIONAL_CONTROL_ERADICATION.md` for the complete invariant.
