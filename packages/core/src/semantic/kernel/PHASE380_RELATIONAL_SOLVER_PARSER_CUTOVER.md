# Phase 380 — Relational Solver + Parser Boundary Cutover

Phase 380 melanjutkan authority convergence dari Phase 379.

## Authority yang dipadatkan

1. `semanticRelationSolver.ts`
   - quantifier checks tidak lagi menggunakan `Array.prototype.some/every`;
   - menggunakan `relationSome`/`relationEvery` dari relational kernel;
   - solver tetap bekerja sebagai relation-plan → match → derive → fixed-point saturation.

2. `syntaxErrorRelationCore.ts`
   - syntax errors tetap berupa relations;
   - diagnosis dan blocking tetap berasal dari rewrite rules, bukan parser branching.

3. `ternaryHandler.ts`
   - ternary tetap melewati candidate/requirement solver;
   - tidak memiliki host control-flow construct atau forbidden semantic sentinel.

4. `parserAdapterRelations.ts`
   - parser input tetap diekspos sebagai syntax evidence relations;
   - absence menggunakan Presence/RelationOption.

5. `routeBindingAstAdapter.ts`
   - custom binding key dan parent binding diproyeksikan melalui relation lookup;
   - host `undefined` sentinel dan type assertion pada boundary adapter dihapus;
   - `withTrashed` memakai canonical `FlagPresence`.

6. `syntaxRange.ts`
   - range search membaca `TokenCursor.currentPresence`;
   - token projection menggunakan relation selection/projection;
   - hasil pencarian memakai `void` compatibility boundary, sementara canonical internal absence tetap Presence;
   - array `map`/type assertion/undefined sentinel dihapus dari file.

## Model

```text
AAT / token evidence
        |
        v
Presence / RelationOption
        |
        v
candidate relations
        |
        v
constraints / requirements
        |
        v
relation solver
        |
        v
rewrite / derivation
        |
        v
least fixed point
        |
        v
canonical semantic facts
```

## Forbidden-surface audit

Untuk enam authority file Phase 380, AST audit harus menghasilkan nol untuk:

- `if`
- `for`
- `while`
- `switch`
- `.map`
- `.filter`
- `.reduce`
- `.flatMap`
- `undefined`
- `??`
- `null`
- `===`
- `!==`
- `as`
- `unknown`

Audit dilakukan pada TypeScript AST, bukan grep, agar string/comment tidak dihitung sebagai semantic construct.

## Validation

- TypeScript transpilation diagnostics: 0 untuk setiap changed authority file.
- Full project `tsc --noEmit`: blocked only by missing external type definitions in the checkpoint environment (`node`, `vitest/globals`). No changed-file diagnostic was emitted.
- `unzip -tq`: required to pass for the resulting checkpoint.
