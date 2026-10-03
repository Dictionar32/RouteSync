# Phase 654 — AST Judgment Algebra and Semantic Frontier

## Model elevation

The AST interface is no longer only a closed payload schema. It is a semantic judgment carrying:

- identity
- semantic term
- source evidence
- provenance
- semantic constraints
- dependency edges
- explicit relation facts
- derivation proof with premises and fixed-point round
- resolution status
- first-class diagnostics

The relation vocabulary is closed. AST constraints and dependencies refer to typed AST relation facts instead of free-form relation strings.

Route AST semantic payload is `RouteDefinition`; the AST wrapper itself is not recursively embedded as its semantic payload.

## Consequence

Syntax such as ternary, short ternary, null-coalesce, conditional statements, loops, and switch remains source evidence. It is not allowed to become the TypeScript host language's semantic authority.

The intended semantic path is:

`source evidence -> relation facts -> constraints -> rewrite/fixed point -> witness/provenance -> semantic AST judgment -> semantic IR -> target lowering`.

## Vacuum policy

Unused files are preserved at their original paths and truncated to zero bytes. Files with direct import references are not vacuumed merely because their names look legacy.

The machine report records both referenced and unreferenced zero-byte production files.

## Remaining frontier

The largest non-test lexical surfaces are scanner/lexer, resource binding, graph resolver, AST/upstream mapping, analysis, and TypeScript semantic lowering. These are migration targets, not automatically semantic leaks: source evidence and projection code can legitimately contain target/source vocabulary.
