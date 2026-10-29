# Phase 2897 — Source text domain continuation

## Trace finding

The Phase 2896 factory accepted the existing upstream `StringValue`, but `PhpSourceText` remained data-only. The CLI reader still assembled `PhpSourceDocument` inline, so document binding was an operation owned by the composition layer rather than by the source-text domain value.

## Change

- Extended the existing `PhpSourceText` contract with `bindTo(sourceFile: SourceFile): PhpSourceDocument`.
- Implemented `bindTo` on the frozen value created by `phpSourceTextFactory`.
- Changed the CLI source reader to call `phpSourceTextFactory.create(stringValue(content)).bindTo(input.sourceFile)` and pass the resulting document to the read-result factory.
- Reused existing `StringValue`, `SourceFile`, `PhpSourceText`, and `PhpSourceDocument`; no new generic or duplicate input wrapper was added.
- Kept the filesystem's decoded `string` at the Node I/O boundary only, then converted it through the existing `stringValue` constructor.
- Kept `packages/core/src/types/upstream/collections.ts` empty.

## Runtime trace

`source discovery -> fs.readFile(sourceFile, 'utf8') -> stringValue(decodedText) -> phpSourceTextFactory.create(StringValue) -> PhpSourceText.bindTo(SourceFile) -> PhpSourceDocument -> phpSourceDocumentReadResultFactory.complete(document) -> source identity binding -> semantic judgment pipeline -> manifest composition`.

## Validation boundary

Run `npm run audit:phase2897-source-text-domain-continuation` for the structural checks. This audit does not replace workspace typecheck, build, tests, or CLI end-to-end validation.

## Remaining audit boundary

This phase addresses the source-text/document-binding segment only. It does not claim that every runtime export in all upstream modules is interface-first, or that every data-bearing ADT in the entire repository has domain continuation operations. Those are broader audit items and must be measured separately before claiming completion.
