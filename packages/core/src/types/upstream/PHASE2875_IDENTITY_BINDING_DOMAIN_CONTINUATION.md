# Phase2875 — Identity Binding Domain Continuation

## Scope

This phase evolves the existing upstream contract in `phpSourceDocumentIdentityBindingInterface.ts`; it does not introduce a parallel identity-binding abstraction. Bound and rejected evidence now share a named domain operation contract, `PhpSourceDocumentIdentityBindingJudgmentOperations`, and the existing producer attaches `continueWith(...)` to both outcomes.

## Runtime trace

```text
sourceDocumentReader.read(requestedSourceFile)
  -> phpSourceDocumentIdentityBinding.bind(input)
  -> PhpSourceDocumentIdentityBindingJudgment.continueWith(...)
       onBound    -> retain bound read result for downstream completeness evaluation
       onRejected -> preserve rejected identity evidence for terminal rejection
  -> source document completeness check
  -> invocation semantic pipeline
  -> inventory authority
  -> manifest builder judgment
  -> ControllerInvocationManifest continuation
```

## Runtime usage

The composition now collects bound and rejected identity outcomes by invoking the ADT operation rather than reading `binding.kind` at each call site:

```ts
const identityRejections = Object.freeze(identityBindings.flatMap(binding => binding.continueWith({
  onBound: () => Object.freeze([]),
  onRejected: rejectedBinding => Object.freeze([rejectedBinding]),
})));
```

The rejected result remains a distinct terminal outcome. It is not converted into an empty source inventory. The existing identity-binding authority remains the producer and its contract is exported from the existing upstream barrel.

## Design constraints

- Reuse the existing identity-binding contract; no generic `Result` abstraction was introduced.
- Domain continuation handles the identity-bound versus identity-rejected distinction.
- This phase does not claim that source-read complete/blocked handling is fully operationalized: composition still inspects read-result kinds to distinguish complete documents from blocked reads.
- This phase does not claim the entire composition is free of conditionals. The next focused gap is the existing `PhpSourceDocumentReadResult` contract and the aggregation of complete documents versus blocked reads.
- `packages/core/src/types/upstream/collections.ts` remains empty.

## Verification

Run `npm run audit:phase2875-identity-binding-domain-continuation`. This is a structural source audit; it is not a substitute for full typecheck, build, or end-to-end tests.
