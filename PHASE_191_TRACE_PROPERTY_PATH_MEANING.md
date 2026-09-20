# Phase 191 — Trace Property Path Meaning Upstream

## Flow

`ecommerce_shop → PHP lexer → PhpPropertyPath → ResourceScanner → binder`

## Finding

`PhpPropertyPath` sebelumnya hanya membawa:

- `root`
- `steps`

Akibatnya `fieldBinder` harus membaca `target.steps.length > 0` untuk menebak apakah sebuah property access adalah single member atau chained member path.

## Repair

Makna dinaikkan ke existing scanner interface `PhpPropertyPath`:

- `single`
- `chain`

`PhpAstFactory.propertyPath()` sekarang membentuk varian tersebut di origin boundary.

`matchPhpPropertyPath()` menjadi eliminator terpusat.

## Scanner connection

`fieldBinder` sekarang membaca semantic shape melalui:

`matchPhpPropertyPath(val.target, { single, chain })`

bukan melalui `steps.length`.

## Invariant

Downstream tidak perlu lagi menyimpulkan:

`steps.length === 0 → single`

`steps.length > 0 → chain`

Makna tersebut sudah menjadi bagian dari interface scanner.

## Verification

`npx tsc -p tsconfig.phase87.33.narrow.json --noEmit`

Hasil: hanya blocker lama:

`packages/core/src/compiler/utils/Hash.ts(4,28): error TS2307: Cannot find module 'crypto' or its corresponding type declarations.`

Tidak ada error baru dari perubahan Phase 191.

## Next trace target

`method_chain.property === 'whenLoaded'` masih membuat `fieldBinder` menebak semantic operation dari nama method. Ini kandidat berikutnya untuk dinaikkan ke boundary ResourceScanner tanpa membuat ADT paralel.
