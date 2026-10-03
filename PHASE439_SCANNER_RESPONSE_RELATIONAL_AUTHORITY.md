# Phase 439 — Scanner Response Relational Authority

Migrated `compiler/scanner/subscanners/controller/responseDetector.ts` to a relational semantic boundary.

Architecture:
- response absence uses `RelationOption` rather than an `undefined` sentinel;
- model response dispatch uses lazy rewrite candidates and requirements;
- method catalogs use relational lookup;
- inline response field projection uses relational projection;
- token-position movement uses the central relational index primitive;
- conventional controller-domain mapping uses relational lookup;
- imperative branch/loop/collection operators were removed from this authority file.

Validation:
- target forbidden-pattern audit: 0 for `if`, `for`, `while`, `switch`, `.map()`, `.filter()`, `.reduce()`, `.flatMap()`, `undefined`, `??`, `null`, `===`, `as unknown`, `||`, `.trim()`, `&&`, `index+N`, `.slice()`;
- TypeScript `transpileModule`: 0 diagnostics;
- full repository `tsc --noEmit` remains environment-blocked by missing `@types/node` and `vitest/globals`.

Research basis: declarative match/constraint/rewrite separation in MLIR PDLL/DRR and relational + equality-saturation architecture in egglog; circular fixed-point semantics are relevant to the next resolver closure layer.
