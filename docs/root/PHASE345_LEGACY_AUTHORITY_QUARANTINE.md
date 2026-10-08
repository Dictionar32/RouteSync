# Phase 345 — Legacy Authority Quarantine

The canonical parser authority is now a relational product. `TokenCursorAuthority` exposes both the historical cursor relation and the new typed `RelationalCursor`; consumers should read semantic presence through `Presence<T>`.

The legacy `TokenCursor` remains transport-only compatibility code. Its sentinel-returning accessors are not part of the canonical semantic authority. Migration proceeds consumer-by-consumer so source semantics are preserved instead of being destroyed by a lexical replacement.

Constraint rule meaning is likewise represented as `ConstraintRuleRelation` data before the mutable compatibility evaluator is invoked. The next stage can therefore replace the evaluator with fixed-point derivation without changing the rule catalog.
