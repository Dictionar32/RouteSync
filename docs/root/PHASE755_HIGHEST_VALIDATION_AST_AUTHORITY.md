# Phase 755 — Highest Validation AST Authority

## Build frontier

The authoritative local DTS frontier was `validationRuleSet.ts` plus `RouteSemanticFlowFactory.ts`.
The previous build exposed direct access to non-variant fields (`source`, `collection`, `element`, `fields`, `elementType`) on closed ADTs, plus an implicit `any` callback in route invalidation.

## Structural correction

The validation boundary is now a canonical semantic relation authority:

```text
Laravel validation evidence
        ↓
RouteValidationRuleEntry
  - field identity
  - semantic location ADT
  - shape ADT
  - semantic type
  - presence
  - constraints
  - source provenance
        ↓
RouteSemanticFlowValidationRuleSet
        ↓
RequestField + ValidationFieldNode
        ↓
upstream request AST
```

`ValidationFieldShape`, `ValidationFieldLocation`, `ValidationRuleNode`, and `SemanticType` are consumed through `relationVariantFold` rather than direct property probing across union members.

The validation entry now carries canonical `SourceSpan` provenance itself. The scanner no longer requires a parallel provenance descriptor.

## Legacy implementation vacuum

`form-request/validationFieldAssembler.ts` contained a duplicate validation aggregation implementation. Reference audit showed its only production consumers were `requestProducer.ts` and `ruleCollector.ts`.

Both consumers now use `RouteSemanticFlowValidationRuleSet.create`. The duplicate implementation was therefore emptied only after the reference audit.

This is a real authority replacement, not a compatibility wrapper.

## Route factory correction

`RouteSemanticFlowFactory.create` now uses a `RelationOption` refinement for complete-contract selection, and the invalidation callback has an explicit semantic contract type. The constructor boundary does not restore a second flat route descriptor.

## Forbidden host constructs

The changed validation authority contains no `if`, `while`, `for`, `switch`, `.map`, `.filter`, `.reduce`, `.flatMap`, `===`, or unsafe `as unknown/any/const` escape.

## Audit

`audit:phase755-highest-validation-ast-authority` passes.

Phases 750–755 all pass their structural audits.

A full `npm run build` is intentionally not claimed from the checkpoint workspace because it does not contain the user's local `node_modules`. The user's local build remains authoritative.

## Architectural reference

The model follows the same important separation seen in declarative compiler systems: MLIR PDLL separates matching from rewriting and binds typed entities; CodeQL treats predicates as logical relations over tuples; WebAssembly defines validation constraints declaratively and separates them from the validation algorithm; Circular Reference Attribute Grammars express recursive dependencies through fixed-point equations. Laravel's route model binding and ecommerce implementations reinforce that source semantics form a graph of identities, resources, validation, cart/order/payment, rather than isolated scalar descriptors.
