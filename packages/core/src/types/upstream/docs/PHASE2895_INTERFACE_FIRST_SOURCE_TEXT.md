# Phase 2895 — Interface-first source text construction

## Scope

This phase migrates one exported callable value in `phpSourceFrontendInterface.ts` to the requested interface-first runtime pattern. The previous `phpSourceTextOf(value): PhpSourceText` function-valued export becomes `phpSourceTextFactory: PhpSourceTextFactoryInterface`, with the named domain operation `create(value)`.

## Runtime API

```ts
export interface PhpSourceTextFactoryInterface {
  readonly kind: 'php_source_text_factory';
  readonly create: (value: string) => PhpSourceText;
}

export const phpSourceTextFactory: PhpSourceTextFactoryInterface = Object.freeze({
  kind: 'php_source_text_factory',
  create: (value: string): PhpSourceText => Object.freeze({
    kind: 'php_source_text',
    value: stringValue(value),
  }),
});
```

Usage: `phpSourceTextFactory.create(sourceText)`.

## Runtime trace

Scanner ingress text -> `phpSourceTextFactory.create(...)` -> `PhpSourceText` -> `PhpSourceDocument.content` -> source-read and semantic judgment pipeline -> invocation inventory -> manifest builder -> CLI output.

## Compatibility note

Repository-wide search in the extracted source found no internal call sites of `phpSourceTextOf`; external consumers may still use the old export, so this is a public API shape change and should be called out in release notes if the package is published. The upstream barrel already re-exports `phpSourceFrontendInterface.ts`, so no duplicate barrel export is needed.

## Constraints

- No `export function` declaration was introduced.
- The new runtime export uses `export const name: Interface = Object.freeze({...})`.
- No generic collection ADT or helper was introduced.
- `collections.ts` remains empty.

## Validation boundary

Run `npm run audit:phase2895-interface-first-source-text` for the structural audit. This audit does not substitute for full typecheck, build, tests, or CLI E2E.
