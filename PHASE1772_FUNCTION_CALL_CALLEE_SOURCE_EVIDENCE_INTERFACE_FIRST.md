# Phase 1772 — Function-call callee source evidence (interface first)

## Trace finding

The scanner AST represented a PHP function call with only `functionName: AstIdentifier`. `phpExpressionStructureProjector.ts` projected `structure.callee[0]` and discarded the remaining callee tokens. This erased namespace separators and qualified-name segments before upstream PHP name resolution could consume them.

## Interface-first change

- Added `PhpFunctionNameSourceEvidence` to the scanner AST contract.
- The evidence retains the complete immutable callee token sequence.
- `PhpAstFactory.functionCall` now requires the evidence explicitly.
- The expression structure projector forwards the complete `structure.callee` sequence.
- The old `functionName` identifier remains as a compatibility projection for existing consumers; it is not treated as complete name-resolution evidence.
- The public `PhpAst.ts` facade exports the new evidence type.

## Remaining work

This phase does not claim the invocation/name-resolution migration is complete. The resource canonicalizer and invocation publication still consume the compatibility short-name field, and the legacy builtin-name classifier remains. Next, adapt the complete lexical evidence into upstream `PhpFunctionNameSyntaxEvidence`, connect the closed name-resolution judgment, migrate all consumers, then retire the resource subscanner only after reference audits prove it is unused.

## Validation

The phase audit checks the interface and producer wiring statically. It does not replace TypeScript typecheck, scanner tests, or a full build; those were not run in this environment.
