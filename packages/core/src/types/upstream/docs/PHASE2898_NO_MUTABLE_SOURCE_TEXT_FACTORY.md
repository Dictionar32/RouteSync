# Phase 2898 — Remove mutable self-reference from source-text factory

## Finding
Phase 2897 introduced `let sourceText!` and assigned the frozen object afterward so `bindTo` could close over the object itself. This created mutable setup solely to solve a circular object reference and relied on a definite-assignment assertion. That implementation is rejected.

## Change
- Added `PhpSourceTextContent` as the immutable payload embedded by `PhpSourceDocument`.
- Kept `PhpSourceText` as the operation-bearing domain value by extending the payload contract with `bindTo`.
- The factory now creates `const sourceContent` first, then returns the frozen operation-bearing value. `bindTo` closes over the immutable payload, not over the value being constructed.
- Kept the existing `StringValue`, `SourceFile`, `PhpSourceText`, `PhpSourceDocument`, and factory contract; no generic helper or collections abstraction was added.
- Kept CLI composition calling `phpSourceTextFactory.create(stringValue(content)).bindTo(input.sourceFile)`.
- Kept `packages/core/src/types/upstream/collections.ts` empty.

## Trace
`source discovery -> filesystem read -> stringValue(decoded text) -> phpSourceTextFactory.create(StringValue) -> PhpSourceText.bindTo(SourceFile) -> PhpSourceDocument -> read-result ADT -> identity-binding ADT -> semantic pipeline -> manifest composition -> CLI result`.

## Validation scope
The Phase 2897 audit was updated to assert the corrected design. The Phase 2898 audit checks the interface-first export, domain input, immutable payload capture, runtime use, upstream barrel export, no exported function declarations in the two traced modules, and empty `collections.ts`. These are structural checks; they do not establish full TypeScript compilation, full test-suite success, or end-to-end CLI behavior.
