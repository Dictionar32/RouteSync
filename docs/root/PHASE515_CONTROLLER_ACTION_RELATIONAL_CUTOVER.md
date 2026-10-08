# Phase 515 — Controller Action Contract Relational Cutover

Target:
- `packages/core/src/compiler/scanner/descriptors/request/controllerActionContract.ts`

Architecture:
- scanner evidence remains an input boundary;
- parameter/type classification is represented as relation options;
- dependency candidates are projected as relation facts and filtered through presence relations;
- contextual attribute resolution is a relation candidate catalog;
- request resolution is first-witness relation selection;
- response/runtime-return selection uses relation gates;
- argument projection uses recursive relation projection;
- optional context values use relation witnesses rather than absence sentinels;
- canonical output remains the semantic controller action contract.

Forbidden surface audit:
- `if`, `for`, `while`, `switch`
- `map`, `filter`, `reduce`, `flatMap`
- `undefined`, `null`, `??`
- `===`, `as unknown`, `||`, `&&`
- `.trim()`, `.slice()`, `never`, ternary syntax

All target counts are zero.

Validation:
- Phase 515 lexical audit: clean.
- TypeScript `transpileModule` diagnostics for the target: 0.
- Full repository typecheck is not claimed; the repository retains unrelated/baseline type-shape incompatibilities outside this target.
