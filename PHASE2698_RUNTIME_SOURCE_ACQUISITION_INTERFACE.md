# Phase 2698 — Runtime Source Acquisition Interface

## Objective

Move the shared source discovery and source text reads used by the live upstream manifest scanner path from three separately exported functions to one explicitly typed runtime object:

```ts
export interface SourceFileAcquisitionInterface {
  readonly collectPhpFiles: (directory: string) => Promise<readonly string[]>;
  readonly readSourceText: (file: string) => Promise<string>;
  readonly readSourceTextSync: (file: string) => string;
}

export const sourceFileAcquisition: SourceFileAcquisitionInterface = Object.freeze({
  collectPhpFiles: async (directory: string): Promise<readonly string[]> => { /* ... */ },
  readSourceText: async (file: string): Promise<string> => fs.promises.readFile(file, 'utf-8'),
  readSourceTextSync: (file: string): string => fs.readFileSync(file, 'utf-8'),
});
```

## Runtime trace

```text
CLI scan / sync
  → upstream composition and manifest scan operation
  → manifestBuilderOperationPreparation
  → Laravel scanner / semantic evidence acquisition
  → sourceFileAcquisition.collectPhpFiles(root)
  → sourceFileAcquisition.readSourceText(file)
  → AST / semantic evidence production
  → inventory receipt and manifest judgment
  → blocked judgment OR complete manifest projection
```

The same object is used by resource, response, provider, service, middleware, form-request, migration, model, controller, and source-AST evidence acquisition call sites. Controller execution dependencies inject `sourceFileAcquisition.readSourceText` through their existing typed dependency contract.

## Changes

- Added `SourceFileAcquisitionInterface` and `sourceFileAcquisition: SourceFileAcquisitionInterface` in `packages/core/src/compiler/scanner/sourceFiles.ts`.
- Removed the exported free-function declarations `collectPhpFiles`, `readSourceText`, and `readSourceTextSync` from that module.
- Migrated runtime consumers to the interface object's explicit methods.
- Migrated semantic source-AST evidence acquisition away from its prior `scannerUtils` import to the canonical scanner source acquisition object.
- Preserved recursive directory traversal, `.php` filtering, missing-root empty result, frozen file arrays, UTF-8 asynchronous reads, and synchronous reads.
- Added `audit:phase2698-runtime-source-acquisition-interface` and the structural/syntax audit script.

## Verification

- Phase 2698 structural and syntax audit: **26/26 passed**.
- Changed implementation/consumer syntax transpilation: **15/15 passed**.
- Phase 2697 baseline audit: **27/27 passed** (12/12 syntax checks).
- Runtime smoke test: **passed** for recursive PHP discovery, extension filtering, missing root, async read, sync read, and frozen runtime object/results.
- Full project typecheck: **not passed / not verified**. The available global TypeScript compiler exits with TS2318 missing global types, TS2688 missing `node` and `vitest/globals` definitions, and TS6046 because the project's target/lib settings exceed the available compiler version. This is an environment/toolchain limitation; it does not establish project type correctness.
- Full build, full test suite, and end-to-end CLI scan/sync integration: **not verified**.

## Re-run audit

```bash
npm run audit:phase2698-runtime-source-acquisition-interface
```

Structural and syntax audits are not substitutes for a dependency-complete project typecheck and end-to-end integration test.
