# Phase 374 — Relational Sentinel Cutover

## Tujuan

Mempersempit lagi boundary semantic/syntax agar absence tidak menjadi sentinel yang dipakai sebagai semantic decision. Referensi desain yang dipakai adalah declarative pattern matching/rewrite (MLIR PDLL/DRR), relation/rule evaluation (Souffle), dan gabungan Datalog + equality saturation/fixpoint (egglog).

## Perubahan

1. `packages/core/src/semantic/kernel/syntax/relationalSyntaxCursor.ts`
   - presence derivation dipusatkan pada `RelationOption`.
   - pemeriksaan sentinel `void 0` untuk keputusan presence dihapus dari relational path.
   - fallback token sintetis `kind: 'unknown'` dihapus; pembacaan token kini menuntut witness presence pada titik yang secara semantik memang membutuhkan token.
   - legacy cursor getters tetap menjadi compatibility transport dan belum diklaim sebagai semantic authority.

2. `packages/core/src/semantic/kernel/syntax/parserAdapterRelations.ts`
   - dipertahankan sebagai evidence-relation boundary; tidak ada control-flow authority baru.

3. `packages/core/src/compiler/scanner/lexer/routeAst/syntaxErrorRelationCore.ts`
   - dipertahankan sebagai relation + solver/rewrite authority; tidak ada parser dispatch imperatif baru.

4. `packages/core/src/semantic/kernel/requirementSolver.ts`
   - dipertahankan sebagai facade constraint/decision relation; candidate selection tetap melalui `semanticDecisionEngine`.

5. `packages/core/src/semantic/plugins/expression/ternaryHandler.ts`
   - candidate selection dan branch resolution tetap melalui relation refinement + requirement solver; tidak menambah host-language dispatch.

## Batas yang sengaja dipertahankan

- PHP `null` tetap merupakan nilai source-language yang sah dan tidak boleh dihapus secara global. Representasinya harus berupa semantic atom/tagged relation, bukan absence sentinel.
- `SemanticResolution.kind = 'unknown'` masih merupakan compatibility/domain variant di upstream ADT. Menghapusnya memerlukan migrasi seluruh resolution ADT dan visitor secara serempak; fase ini tidak memalsukan eradikasi tersebut.
- `TokenCursor` masih memiliki compatibility return types berbasis `void` pada beberapa getter. Itu transport debt, bukan semantic authority, dan menjadi target migrasi consumer berikutnya.

## Validasi

- Audit forbidden sentinel/construct pada relational syntax path: tidak ada `void 0`, `Object.is(..., void 0)`, atau synthetic `kind: 'unknown'` fallback.
- Global TypeScript build belum dapat dijalankan karena environment checkpoint tidak memiliki `@types/node` dan `vitest/globals`.
