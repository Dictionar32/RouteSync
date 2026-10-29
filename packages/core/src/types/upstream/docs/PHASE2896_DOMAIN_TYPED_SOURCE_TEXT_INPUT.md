# Phase 2896 — Domain-typed source text input

## Audit finding

Phase 2895 changed source-text construction to an interface-first runtime export, but its `create` operation still accepted a raw `string`. That left the domain factory contract primitive-typed even though the stored value was already represented by the upstream `StringValue` contract.

## Change

- `PhpSourceTextFactoryInterface.create` now accepts the existing `StringValue` domain value.
- `phpSourceTextFactory` remains an interface-first frozen runtime object.
- The CLI filesystem boundary wraps decoded file content with the existing `stringValue` adapter, then delegates construction to `phpSourceTextFactory.create`.
- No new wrapper/generic ADT was introduced; the existing upstream `StringValue` contract is reused.
- `packages/core/src/types/upstream/collections.ts` remains empty.

## Runtime trace

`fs.readFile(..., 'utf8')` → `stringValue(content)` at the filesystem/text boundary → `phpSourceTextFactory.create(StringValue)` → `PhpSourceText` → source document read judgment → identity binding and semantic judgment pipeline → manifest composition.

The filesystem boundary necessarily receives decoded text from Node as a JavaScript string. The domain factory no longer exposes that primitive as its input contract.

## Usage

```ts
const sourceText = phpSourceTextFactory.create(stringValue(decodedFileContent));
```

The CLI composition uses this operation rather than assembling `PhpSourceText` inline.

## Validation boundary

The phase audit script checks the named interface, typed `StringValue` input, interface-first runtime export, CLI adoption, upstream barrel export, absence of exported function declarations in the frontend module, and empty `collections.ts`. This structural audit does not establish that the full workspace typecheck, build, test suite, or CLI end-to-end tests pass.
