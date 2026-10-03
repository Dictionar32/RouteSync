# Phase 579 — Build Trace: Remove Global Process Shadowing

## Root cause

`semanticRelationalOntology.phase277.test.ts` declared a global `process` with only `cwd()`:

```ts
declare const process: { cwd(): string };
```

Because the declaration lived at module top level without imports, TypeScript treated the file as a script and the declaration participated in the global scope. That narrowed the Node `process` symbol for unrelated CLI files and produced cascading errors such as `Property 'exit' does not exist on type '{ cwd(): string; }'`.

## Fix

The test is now a real ES module and imports the Node APIs it uses:

- `readFileSync`, `readdirSync`, `statSync` from `node:fs`
- `join`, `relative` from `node:path`
- `cwd` from `node:process`

No global declaration, compatibility widening, or production API change is introduced.

## Verification

- No `declare const process` remains in `packages/`.
- No `declare const require` remains in the modified test.
- The test's process access is local through the imported `cwd` function.
- Full workspace build was not claimed because this checkpoint does not contain installed workspace dependencies.
