# Phase 796 — Token Transition Type Frontier

## Frontier

DTS compilation reached `compoundScanners.ts:102`:

`Argument of type 'string' is not assignable to parameter of type 'TokenType'.`

The scanner transition catalog already carried the closed lexical `TokenDescriptor['type']` vocabulary in `simpleOperators`, but relational option folding widened the selected value at the consumer boundary because the result was left as an unconstrained string inference.

## Model correction

The selected direct token kind is now explicitly typed as:

`TokenDescriptor['type']`

The catalog remains the lexical evidence authority. PHP operator spellings remain source evidence strings; the produced token kind is a closed lexical ADT member. No arbitrary string is allowed to cross into `action`/`emitToken`.

This is intentionally kept at the scanner evidence boundary rather than manufacturing a duplicate semantic token ADT under `types/upstream`. The existing upstream model is the semantic AST/dataflow authority; the lexical `TokenType` is already the scanner's closed evidence vocabulary.

## Audit

`audit-phase796-token-transition-type-frontier.cjs` verifies the closed token-kind annotation, typed operator catalog, fallback wiring, and absence of the previous unconstrained direct-token inference.
