# Phase 338 — Declarative Semantic Decision Engine

## Tujuan

Phase ini menaikkan `SemanticCandidate`/requirement solver menjadi satu decision engine canonical. Parser, adapter dan semantic plugin tidak lagi perlu mengetahui mekanisme pemilihan kandidat; mereka hanya membentuk kandidat + constraint.

## Riset yang dijadikan prinsip

- WebAssembly 3.0 memformalkan validitas sebagai constraint deklaratif dan execution sebagai reduction rules.
- MLIR PDLL memisahkan pattern matching dari rewrite.
- JastAdd circular attributes menggunakan iterasi sampai stabil dan mensyaratkan lattice finite-height + monotonic equations untuk konvergensi.
- Soufflé dan Flix menempatkan relation/constraint + fixed point sebagai domain analisis.
- CompCert menempatkan semantic preservation sebagai correctness boundary, bukan bentuk implementasi host.

## Perubahan nyata

1. Menambah `semanticDecisionEngine.ts` sebagai otoritas candidate/requirement/exclusion/dependency → witness.
2. `requirementSolver.ts` menjadi compatibility facade menuju engine canonical.
3. `syntaxGrammar.matchBySet` dipindahkan dari `relationResolve` langsung ke candidate solver dan explicit cursor presence.
4. `constraintStep.ts` dipindahkan dari branch dispatch berbasis `relationResolve` ke rule catalog + relation refinement/projection/selection.
5. `relationResolve` dipertahankan hanya sebagai primitive evaluasi internal engine; target migrasi berikutnya adalah menghapus pemanggilannya dari semantic-authority surfaces.

## Prinsip penting

Rename bukan lagi dianggap migrasi. `relationResolve(boolean, ...)` diperlakukan sebagai transitional implementation primitive, bukan semantic vocabulary. Vocabulary canonical adalah candidate, predicate, requirement, exclusion, dependency, transition, rewrite, witness, provenance dan fixed-point closure.

## Status

Phase ini tidak mengklaim seluruh repository bebas dari `if/for/while/switch/map/filter/reduce/flatMap/undefined/null/??/===/as`. Audit penuh tetap diperlukan; target Phase 338 adalah memindahkan authority boundary yang sudah memiliki candidate solver ke engine canonical.
