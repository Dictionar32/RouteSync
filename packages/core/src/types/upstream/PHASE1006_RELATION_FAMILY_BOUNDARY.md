# Phase 1006 — Relation Family Boundary Closure

The Eloquent producer classifies only `belongsTo`, `hasOne`, and `hasMany` as direct-FK relations. All `belongsToMany`, through, and polymorphic families use `RelationKey = not_applicable` until their own semantic identities are introduced.

`semanticReconciliation.ts` reconciles only the direct-FK families. It does not infer pivot, through, or polymorphic foreign-key semantics.

This keeps the current `RelationKey` narrow and prevents graph projection from becoming a second relation-family inference authority. Future families should receive dedicated semantic identities (`PivotRelationIdentity`, `ThroughRelationIdentity`, `PolymorphicRelationIdentity`) rather than widening `RelationKey`.

The legacy `migrationScanner.ts` remains physically present and empty.
