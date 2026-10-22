# Phase 2283 — Contextual Attribute Inventory Contract Flow

## Trace finding

Phase 2282 introduced `contextualAttributeInventory` on `LaravelControllerScannerInterface`, but the production source-AST pipeline still sent `contextualAttributeNames`, the attribute scanner interface still returned a raw `AttributeAst[]`, and `LaravelControllerScannerExecutor` still declared contract version 38. The interface and its consumers were therefore not coherent.

## Contract-first correction

- Moved ownership of `LaravelContextualAttributeInventory` and its source-proven declaration evidence to the existing `LaravelAttributeScannerInterface`, the upstream producer boundary.
- Evolved the existing attribute scanner contract from version 1 to version 2. Its result is one `LaravelAttributeScanJudgment` carrying both the complete AST products and the project-scoped contextual-attribute inventory.
- Kept `LaravelControllerScannerInterface` as the consumer of the inventory; no duplicate scanner interface was added.
- Updated source-AST wiring to forward the exact inventory returned by the attribute scan.
- Updated the controller scanner to project the already-typed `ClassName` identities into the existing action-judgment input and aligned its implementation/result versions with contract version 40.

## Scope boundary

The existing `scanAttributeAsts` producer still owns its existing `AttributeAst.definition.contextual` fact. This phase does not claim that the regex-based contextual-attribute classification inside `attributeAstCanonical.ts` has been replaced by a semantic authority. That is a separate upstream ownership problem and remains open. The current change packages existing producer facts into the stronger contract; it does not invent new classification logic.

No imports from `semantic/foundation` or `semantic/relations` were added to the upstream contracts. No TypeScript typecheck or build was run.

## Validation

Run:

```sh
node scripts/audits/audit-phase2283-contextual-attribute-inventory-contract-flow.cjs
node --check scripts/audits/audit-phase2283-contextual-attribute-inventory-contract-flow.cjs
```

The static audit verifies contract ownership, typed provenance, exact inventory forwarding, consumer type alignment, and version alignment. It is not a substitute for TypeScript typechecking or an end-to-end CLI test.
