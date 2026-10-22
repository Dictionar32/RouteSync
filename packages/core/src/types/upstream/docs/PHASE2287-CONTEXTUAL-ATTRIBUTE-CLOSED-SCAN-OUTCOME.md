# Phase 2287 — Contextual Attribute Closed Scan Outcome

## Trace

The CLI source-AST composition consumes `LaravelAttributeScannerInterface.scan(...)` in `packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts` and forwards its contextual-attribute inventory to `LaravelControllerScannerInterface`. The previous contract represented only a successful scan. It could not represent a blocked lexical name resolution without either throwing or falsely publishing an empty inventory.

The existing producer still has unresolved semantic ownership: `packages/core/src/compiler/scanner/subscanners/attributeAstCanonical.ts` marks `AttributeAst.definition.contextual` using a short-name regex, while the composition root creates inventory entries without the required canonical class identity and implementation proof. This phase does not pretend that producer has been migrated.

## Interface-first correction

Evolve the existing `LaravelAttributeScannerInterface` result contract from version 5 to version 6 and make its outcome a closed discriminated union:

- `LaravelAttributeScanCompleteJudgment` carries ASTs and the complete contextual-attribute inventory.
- `LaravelAttributeScanBlockedJudgment` carries only source-project identity and typed resolution blockers; it exposes neither AST products nor a contextual inventory.
- `LaravelAttributeScanBlocker` preserves the exact blocked `PhpClassNameResolution` and declaration source span.

This makes the distinction between “complete and found no declarations” and “cannot establish completeness” part of the upstream contract. The controller scanner continues to accept only `LaravelContextualAttributeInventory`, which is itself a complete inventory.

No new scanner, resolver, generic wrapper, `semantic/foundation` dependency, or `semantic/relations` dependency is introduced in the upstream interface.

## Explicit remaining integration debt

The current production composition root still constructs the old version-5 complete shape and does not branch on the new scan outcome. It also has not yet supplied the required qualified identity and implementation proof. That producer/wiring mismatch is intentionally recorded rather than hidden by runtime fallback or reclassification. This is an interface-only phase; the next step must adapt the existing producer to the closed result and existing `PhpClassNameResolutionRuleInterface`, then wire the complete variant into the CLI path.

## Validation boundary

The focused static audit checks the shape and closure of the new contract, and the audit script is syntax-checked. TypeScript typecheck and build are not claimed; the current production wiring is known not yet to satisfy version 6.
