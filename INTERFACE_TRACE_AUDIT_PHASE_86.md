# Interface Trace Audit Phase 86

## Target
PHP AST argument structure traced from ecommerce_shop usage.

## Finding
Call nodes previously represented every argument as `PhpAstNode`. That loses PHP syntax when an argument is named or unpacked. The ecommerce_shop corpus contains dense method/function calls such as `whereHas`, `updateOrCreate`, `selectRaw`, and nested query expressions, so argument structure belongs at the AST boundary rather than being reconstructed downstream.

## Repair
Added closed `PhpArgument` ADT:
- positional
- named
- unpacked

All PHP call AST nodes now carry `readonly args: readonly PhpArgument[]`.

The folder preserves argument expression values while the argument kind/name remains available to semantic consumers.

## Invariant
AST preserves call argument structure. Semantic layers do not need to parse `originalCode` to recover named/unpacked argument information.

## Scope
Interface/ADT only. Parser/factory/consumer migration is intentionally deferred.
