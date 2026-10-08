# Phase 351 — Parser Relational Cutover

Phase 351 memindahkan tiga titik authority parser yang masih memakai sentinel/branching host-language ke model relasional:

- `delimiterNavigation.ts` → delimiter catalog + relation refinement + presence witness.
- `syntaxScan.ts` → fixed-point closure melalui relation solver.
- `routeDeclarationParser.ts` → Presence folds dan relation projections; tidak ada raw optional sentinel, casts, atau collection-control constructs pada file authority.

## Semantic lowering

| Legacy construct | Canonical relation |
|---|---|
| delimiter branch | delimiter relation + refinement | 
| parser termination | fixed-point convergence | 
| optional token | Presence relation | 
| route candidate | candidate relation | 
| route group state | state relation + transition relation | 
| path lookup | relation selection | 
| collection traversal | relation projection/expansion | 

The low-level `TokenCursor` remains a transport boundary. Its remaining legacy constructs are not claimed as eradicated by this phase; the next cutover must replace its semantic consumers and then quarantine/delete the old cursor authority.

## Verification

Changed authority files have zero lexical occurrences of:

`if`, `for`, `while`, `switch`, `map`, `filter`, `reduce`, `flatMap`, `undefined`, `null`, `===`, `!==`, `as`, `??`.

TypeScript compilation was not claimed because this checkpoint does not contain an installed `tsc` binary.
