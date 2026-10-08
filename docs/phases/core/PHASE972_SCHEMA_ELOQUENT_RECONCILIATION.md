# Phase 972 — Schema/Eloquent Relation Reconciliation

## Boundary

Migration evidence remains upstream-owned by `SchemaAst`. Eloquent relation evidence remains upstream-owned by `EloquentRelationAst`. The semantic model builder reconciles these two evidence surfaces before producing `ModelSemanticRelation`.

## Rules

- `belongsTo`: inspect foreign keys on the source model table.
- `hasOne` / `hasMany`: inspect foreign keys on the target model table.
- A relation becomes `RelationKey.explicit` only when exactly one matching schema foreign key exists.
- Ambiguous direct-FK matches retain the source key rather than being guessed; unsupported relation families use `RelationKey.not_applicable` rather than pretending to have a direct FK.
- `belongsToMany` and polymorphic relations are not inferred from ordinary foreign keys.
- Manifest/dataflow remains downstream; no second solver is introduced.
- `model/migrationScanner.ts` remains present as an empty compatibility placeholder (0 bytes) when no production reference exists.

## Fixture evidence

`OrderDetail` provides `order_id -> orders.id` and `produk_item_id -> produk_items.id`, matching its `belongsTo(Order)` and `belongsTo(ProdukItem)` relations.

`ProductReview` provides `produk_item_id -> produk_items.id` and `user_id -> users.id`, matching its `belongsTo(ProdukItem)` and `belongsTo(User)` relations.

## External semantic alignment

Laravel documents foreign-key constraints as referential-integrity evidence and documents `belongsTo`, `hasMany`, implicit model binding, custom route keys, and scoped nested bindings as separate framework semantics. Route binding therefore remains a separate evidence surface and is not inferred merely from schema relations.
