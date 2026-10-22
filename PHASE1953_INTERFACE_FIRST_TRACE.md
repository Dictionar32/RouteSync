# Phase 1953 Interface-First Trace

## Trace

`CLI controller discovery → whole-file invocation pipeline → invocation judgment authority → LaravelControllerInvocationSemanticJudgmentInventoryAuthority.close → authority-produced closure receipt → manifestBuilder.build(receipt) → laravelSourceAstScanner.scan(receipt) → SourceAsts.controllerInvocationSemanticInventory`

## Findings

1. The inventory contract already described closure invariants, but its four completeness-witness obligation strings were duplicated in the authority implementation. This allowed the public contract and its executor to drift.
2. `witnessComplete` previously included `projectBinding`. As a result, a witness with a valid obligation tuple but a different project identity caused two rejections: `controller_source_inventory_project_binding_mismatch` and `controller_source_inventory_completeness_witness_invalid`. Those are separate semantic facts and should not be conflated.
3. The inventory authority already preserves the exact source-correlated judgment objects in the receipt. The manifest builder and source AST pipeline accept that receipt rather than a raw judgment list.
4. The inventory result is a discriminated union: validated results carry a closure receipt; rejected results carry a non-empty typed rejection ledger. The CLI terminal branch dispatches on these ADT variants.

## Interface-first correction

- The existing inventory interface now owns a versioned `LaravelControllerInvocationSemanticJudgmentInventoryReasoningContract`.
- The authority reads completeness obligations from that canonical contract.
- Project binding and witness-shape completeness are evaluated independently.
- The authority publishes contract v9 in both result variants and binds that same contract to a validated receipt.
- The exact judgment objects and their integrated response variants remain correlated with canonical source identities.

## Boundary

A TypeScript interface declaration cannot execute itself. The interface owns the typed declarative reasoning contract; the existing authority executes it. This phase does not claim that type declarations replace runtime execution, nor does it create a parallel authority.
