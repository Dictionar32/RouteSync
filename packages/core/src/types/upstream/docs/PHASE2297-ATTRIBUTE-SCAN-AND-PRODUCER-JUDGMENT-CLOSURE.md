# Phase 2297 — Attribute Scan and Producer Judgment Closure

## Trace finding

The upstream `LaravelAttributeScannerInterface` v13 described a discovery receipt using a tuple of obligation labels. Those labels were documentary promises, not typed evidence tying the successful directory enumeration to the exact source root and directory. Its blocked outcome also used a non-empty array for failures, while the repository's stated semantic model prefers closed recursive ADTs.

The extracted compiler-side `AttributeProducerInterface` had a second contract gap: `produce()` returned `AttributeAst` directly, but the implementation throws when the declaration has no constructor. The type boundary therefore omitted a known domain outcome.

## Interface changes

- Evolve the existing `LaravelAttributeScannerInterface` in place to contract v14; no `V2` or legacy duplicate was added.
- Replace obligation-label tuples with `LaravelAttributeDirectoryEnumerationEvidence`, explicitly binding source root, directory, scan scope, and deterministic relative-path order.
- Record the enumerated source-file sequence separately from the completed scanned-file evidence so the producer implementation must establish exact coverage before publishing `complete`.
- Replace the blocked outcome's non-empty failure array with a recursive `LaravelAttributeScanFailureSequence` ADT. The sequence's terminal node itself carries a failure, so an empty blocked result is unrepresentable.
- Evolve the existing compiler-side `AttributeProducerInterface` in place to contract v2. Its result is now a discriminated judgment: complete with `AttributeAst`, or blocked with a typed missing-constructor blocker.
- Retain the existing upstream `LaravelSourceAstPipelineInterface` v9 rather than adding a competing pipeline interface. Its implementation still needs migration to scanner v14 and producer v2.

## Deliberate boundary

This is an interface-first contract phase. It does not pretend that the existing producer implementation already conforms: `attributeAstCanonical.ts` still returns scanner v7-shaped outcomes, and `attributeProducer.ts` still returns an AST directly and throws for a missing constructor. The next migration must update those producers and the pipeline consumer together, then connect the result to the CLI path. The upstream interface imports neither `semantic/foundation` nor `semantic/relations`.

## Validation

Structural audits only. No TypeScript typecheck and no `npm run build` were run. A passing audit does not imply the implementation is already compatible with these new contracts.

## Related official references

- TypeScript interfaces are named structural contracts: https://www.typescriptlang.org/docs/handbook/interfaces
- TypeScript discriminated unions encode distinct outcome shapes: https://www.typescriptlang.org/docs/handbook/2/narrowing.html
- PHP-Parser documents AST parsing and namespace/name resolution: https://github.com/nikic/PHP-Parser/blob/master/doc/2_Usage_of_basic_components.markdown
- PHP `scandir()` documents failure distinctly from a successful listing: https://www.php.net/manual/en/function.scandir.php
- PHP `file_get_contents()` documents read failure: https://www.php.net/manual/en/function.file-get-contents.php
