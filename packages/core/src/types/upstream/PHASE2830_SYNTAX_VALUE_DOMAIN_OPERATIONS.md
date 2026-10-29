# Phase 2830 — Syntax Value Domain Operations

## Scope

Migrate the active route-syntax runtime consumers from free exported token lookup functions to one explicitly typed, interface-first domain operation surface. The existing `SyntaxTokenFact`, syntax vocabularies, `TokenDescriptor`, and `RelationOption<T>` semantics remain the authority; this phase does not introduce a replacement token ADT or a generic reasoning/visitor primitive.

## Runtime owner

`packages/core/src/compiler/frontend/php/routeAst/syntaxValue.ts`

- `SyntaxValueOperationsInterface` explicitly declares lexical lookup and membership operations.
- `syntaxValueOperations` is exported as `SyntaxValueOperationsInterface = Object.freeze({...})`.
- Implementation functions remain private to the module; no `export function` or function-shaped exported const remains in this owner.

## Applied runtime consumers

- `semanticRouteSyntaxRelations.ts`
- `relationalSyntaxCursor.ts`
- `syntaxRange.ts`
- `routeDeclarationParser.ts`
- `packages/core/src/semantic/kernel/syntax/relationalSyntaxCursor.ts`

All five consume `syntaxValueOperations.<domain operation>(...)`. Optional lookup results still use the existing typed `RelationOption<T>` variants, and membership checks preserve their prior boolean behavior.

## Upstream contract review

No new contract was added to `packages/core/src/types/upstream`: the existing `TokenDescriptor`, syntax fact ADT, and relation-option vocabulary already cover this boundary. The upstream `collections.ts` file remains empty.

## Verification boundary

Run `npm run audit:phase2830-syntax-value-domain-operations`. This structural audit verifies the interface-first owner and real consumer call sites; it is not a substitute for a TypeScript typecheck, package build, or end-to-end CLI manifest scan.
