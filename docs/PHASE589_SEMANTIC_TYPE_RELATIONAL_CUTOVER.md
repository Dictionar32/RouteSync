# Phase 589 — Semantic Type Relational Cutover

Tanggal: 2026-10-02

## Tujuan

Mendorong lapisan semantic type lowering dari model constructor/class-driven menuju immutable relation-backed algebra. Lapisan yang disentuh:

- resolved semantic type algebra
- semantic resolver handlers
- TypeScript semantic lowering
- primitive TypeScript lowering rules
- audit frontier scanner/resolver/AST-upstream yang masih bocor

## Model

`ResolvedSemanticType` sekarang direpresentasikan sebagai discriminated data witnesses + factory relations:

- `ResolvedPrimitiveType.create`
- `ResolvedReferenceType.create`
- `ResolvedOptionalType.create`
- `ResolvedNullableType.create`
- `ResolvedCollectionType.create`
- `ResolvedObjectType.create`
- `ResolvedUnionType.create`
- `ResolvedIntersectionType.create`
- `ResolvedUnknownType.create`

Tidak ada constructor/class instantiation pada algebra resolved-type baru. Formatting capability menjadi fungsi data immutable pada witness.

Semantic resolver handlers juga menjadi immutable relation handler objects, bukan class instances.

TypeScript lowering sekarang menggunakan:

`resolved type kind -> semantic lowering relation -> resolved-type catamorphism -> target syntax`

Parenthesization collection tidak lagi mendeteksi string hasil lowering; ia diturunkan dari relasi kind `union/intersection`.

Primitive target token juga diselesaikan melalui relation solver dan witness refinement.

## Research basis

Arsitektur ini mengikuti pola yang lebih dekat dengan:

- Soufflé: relasi adalah himpunan tuple yang menjadi domain deklaratif analisis. citeturn0search8
- MLIR PDLL/DRR: matching dan rewriting dideklarasikan sebagai pattern/rewrite rules. citeturn0search4turn0search13
- WebAssembly: validitas dinyatakan sebagai typing constraints declarative; algoritma diturunkan dari aturan. citeturn0search0turn0search14
- egglog: equality saturation digabung dengan Datalog untuk reasoning/rewrite. citeturn0search15
- CompCert: compiler correctness dibangun terhadap formal semantic relations dan semantic preservation. citeturn0search6turn0search12

## Validasi

- Transpile syntax check pada file algebra/resolver/lowering yang disentuh: 0 diagnostics.
- Audit Phase 589 tersimpan di `docs/PHASE589_SEMANTIC_TYPE_RELATIONAL_CUTOVER_AUDIT.json`.
- Full `tsc --noEmit --skipLibCheck` masih terblokir sebelum project checking oleh dependency type definitions yang tidak tersedia: `node` dan `vitest/globals`.

## Frontier yang belum dipotong

Audit menunjukkan scanner/resolver/AST-upstream masih memiliki constructor authority yang besar, terutama:

- `scanner/binders/resource/resourceBinder.ts`
- `scanner/descriptors/manifest/resourceRouteGroupDescriptor.ts`
- `scanner/descriptors/validation/validationRuleEntry.ts`
- `scanner/subscanners/FormRequestScanner.ts`
- `scanner/subscanners/resource/resourceUpstreamExpressionCanonical.ts`

`SemanticTypeResolver` masih merupakan compatibility class dan masih menjadi titik `new`; ini adalah kandidat cutover berikutnya setelah semua consumer dipindahkan ke resolver-factory relation.

Catatan penting: token `undefined` dan `null` yang muncul di target TypeScript lowering adalah vocabulary target language, bukan absence sentinel host. Ia belum boleh dihapus dari output semantics; yang harus dihapus adalah host-language absence/control authority.
