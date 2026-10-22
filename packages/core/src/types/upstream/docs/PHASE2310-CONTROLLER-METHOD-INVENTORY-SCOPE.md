# Phase 2310 — Controller Method Inventory Scope Closure

## Finding

The constructor-selection authority already consumes the upstream `PhpClassMethodDeclarationInventory` contract, but its parser producer previously searched every named `function` token in the entire file. That could mix methods from another class and nested named functions into the selected controller's inventory. It could also declare an inventory complete without first proving that the selected class body had a matching closing brace.

## Change

- The parser now identifies the selected class body's opening and matching closing brace before enumerating methods.
- A missing class-body boundary produces `controller_method_declaration_inventory_blocked` instead of a complete inventory.
- Method candidates are enumerated only at direct class-body depth, so nested named functions and declarations belonging to later classes are not treated as methods of the selected class.
- The existing upstream `PhpClassConstructorSelectionAuthorityInterface` remains the single constructor-selection authority; no parallel selector was added.

## Limits

This closes the specific file-wide/nested-function scope error. It does not prove complete PHP grammar coverage, does not remove existing `semantic/relations` imports from the parser, and does not claim a project typecheck or full build. The project build was not run.

## Verification

Run `node scripts/audits/audit-phase2310-controller-method-inventory-scope.cjs` for the static boundary audit. The new Vitest regression file covers cross-class leakage, nested named functions, and an unclosed class body; it requires the repository's Vitest dependencies to execute.
