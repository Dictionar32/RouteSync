# Phase 182 — Trace AST/ADT Interface

## Fokus
Relation-load batch resolution, khususnya semantic information loss dari `resolved | invalid` menjadi `target | undefined`.

## Temuan
`resolveRelationLoadBatch()` sebelumnya memetakan setiap `ResourceRelationLoadTargetResolution` menjadi `ResourceRelationLoadTarget | undefined`, lalu memakai `target === undefined` untuk menentukan invalid. Ini membuang makna ADT dan memaksa consumer/batch resolver menafsirkan ulang `undefined`.

## Perbaikan
Batch sekarang mempertahankan `ResourceRelationLoadBatchResolution` sepanjang transformasi:

`ResourceRelationLoadTargetResolution[] → ResourceRelationLoadBatchResolution`

Tidak ada lagi `ResourceRelationLoadTarget | undefined` pada batch resolver dan tidak ada `target === undefined` untuk menentukan semantic failure.

Jika batch sudah invalid, state invalid dipertahankan. Jika target berikutnya invalid, hasil batch menjadi `{ kind: 'invalid', reason: 'invalid_target' }`. Jika semua target resolved, batch membawa seluruh `ResourceRelationLoadTarget[]`.

## Prinsip
Origin/boundary boleh menerjemahkan syntax, tetapi semantic ADT tidak boleh diturunkan kembali menjadi `undefined` hanya untuk kemudian direkonstruksi.

## Validasi
`npx tsc -p tsconfig.phase87.33.narrow.json --noEmit`

Expected existing blocker:
`packages/core/src/compiler/utils/Hash.ts(4,28): error TS2307: Cannot find module 'crypto' or its corresponding type declarations.`

No new TypeScript error introduced by Phase 182.
