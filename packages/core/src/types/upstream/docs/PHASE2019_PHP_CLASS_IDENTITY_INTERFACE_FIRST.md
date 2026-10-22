# Phase 2019 — PHP Class Identity, Interface First

## Trace

Phase 2018 correctly blocked ambiguous short parent names, but it still compared controller names rather than PHP class identities. That prevented a safe resolution when two namespaces declared the same short class name and the child imported exactly one of them.

The existing `ControllerDeclarationSemanticJudgmentInterface` is extended instead of adding a second declaration authority. Every candidate now carries `PhpQualifiedClassName`; parent evidence carries either a resolved PHP class identity or an explicit blocked name-resolution ADT.

## Contract and execution

- `phpClassNameResolutionInterface.ts` defines the class-specific qualified identity, class import binding, and resolved/blocked name evidence. The function-name resolver is not reused because class imports and function imports are different symbol categories.
- `controllerDeclarationParser.ts` derives the declared identity from the active namespace region and resolves direct parent names against fully qualified names, `namespace\` names, class-import aliases, and current namespace rules.
- Grouped class imports are not silently guessed: when their inventory cannot be expanded by this parser, parent name resolution is explicitly blocked.
- The existing declaration authority matches parent candidates by case-insensitive canonical qualified class identity. It still blocks duplicate canonical identities and inheritance cycles.
- The Laravel controller scanner passes the parser's identity evidence into the existing authority. Scanner contract version is now 26.

## Boundaries

No `relation` or `foundation` subscanner was added. This phase does not claim that every PHP import grammar form is supported: grouped class imports are deliberately marked incomplete and cause blocked ancestry rather than guessed resolution. Existing `semantic/relations` utilities remain outside this phase's scope.

## Verification

`audit:phase2019-php-class-identity-interface-first` is a structural contract audit. The phase artifact records the result. Full TypeScript typecheck/build and Vitest execution are not claimed unless run independently.
