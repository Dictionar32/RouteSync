# Phase 170 — Trace AST/ADT Interface

## Fokus
Menaikkan makna presence argument pada query boundary agar `args[index] -> undefined` tidak menjadi vocabulary downstream.

## Temuan
Sebelumnya query operation masih memakai `presentArgument()` / `expressionAt()` dan ternary berbasis `undefined` untuk membedakan argument hadir atau hilang. Ini membuat presence menjadi implicit control flow.

## Perbaikan
`resourceQueryOperation.ts` sekarang memiliki:

```ts
type ResourceArgumentPresence =
  | { kind: 'present'; value: ResourceExpressionModel }
  | { kind: 'missing'; index: number };
```

Dengan matcher `matchResourceArgumentPresence()`.

Boundary query yang sudah dinaikkan:
- relation load target
- comparison operator lookup
- predicate operand
- ordering target
- pagination argument
- window argument
- conditional argument
- relation-filter callback

Consumer menerima `present | missing`, bukan menginterpretasikan `undefined` sebagai makna presence.

## Trace ulang
Pola `presentArgument` dan `expressionAt` sudah hilang dari query resolver.
`args.length` untuk predicate operand sekarang memakai registry index, bukan ternary.

Sisa `undefined` yang terlihat berada pada semantic parsing yang memang belum dinaikkan penuh, terutama:
- literal string extraction
- property/operator resolution
- invalid literal/property detection
- low-level array access boundary `argumentAt`

Ini menjadi kandidat Phase 171: menaikkan hasil semantic resolution tersebut menjadi ADT beralasan, sehingga `undefined` tidak lagi menjadi semantic error channel.

## Validasi
Command:
`npx tsc -p tsconfig.phase87.33.narrow.json --noEmit`

Hasil: hanya blocker environment lama:
`packages/core/src/compiler/utils/Hash.ts(4,28): error TS2307: Cannot find module 'crypto' or its corresponding type declarations.`

Tidak ada TypeScript error baru dari Phase 170.
