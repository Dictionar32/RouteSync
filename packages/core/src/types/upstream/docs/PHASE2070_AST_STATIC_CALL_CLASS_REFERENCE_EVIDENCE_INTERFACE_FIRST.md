# Phase 2070 — AST Static-Call Class-Reference Evidence, Interface First

## Trace finding

`controllerDataflowContract.ts` reconstructed the PHP class-reference form from a raw class-name string (`startsWith` / `includes`) even though the parser had already recognized the source tokens. This made a scanner consumer reclassify lexical syntax and left `PhpAstValue.static_call` with only a raw `className` field.

## Contract-first change

- Added `PhpClassReferenceSourceEvidence`, a discriminated union owned by the PHP AST vocabulary.
- Replaced `PhpAstValue.static_call.className` with `classReference`.
- The AST parser derives the form from the original token spelling: `fully_qualified`, `namespace_relative`, `import_or_namespace_dependent`, or `simple_name`.
- Candidate discovery now locates `::` after a qualified class spelling rather than assuming the separator is at token index 1; this fixes static-call AST recognition for fully qualified class references whose leading `\` is a separate token.
- `PhpAstFactory.staticCall` accepts typed source evidence rather than a raw class-name string.
- Controller dataflow now adapts the existing discriminant to upstream `ControllerStaticCallClassReferenceEvidence`; it no longer classifies names using string prefix/containment checks.
- Existing PHP class-name resolution remains the only semantic resolver. The AST records spelling form; it does not decide the canonical class identity.
- Updated AST consumers to read `classReference.sourceName`. Resource factory syntax also derives the short resource name from the final qualified-name segment, rather than accidentally treating the whole qualified spelling as the resource name.

## Architecture boundary

Source tokens → typed PHP AST class-reference evidence → existing PHP class-name resolution authority → existing static-call/model identity judgment → invocation and integrated response contracts → AST/ADT projection and runtime executor.

No new `relation/foundation` subscanner and no duplicate invocation, response, or AST authority were introduced.

## Regression coverage

`phpAstStaticCallClassReference.phase2070.test.ts` covers fully qualified, namespace-relative, import/namespace-dependent, and simple class references.

## Verification boundary

Structural audit results and parser-only inspection are not a substitute for the full TypeScript typecheck, project build, or Vitest. Those full checks are not claimed as run in this environment.
