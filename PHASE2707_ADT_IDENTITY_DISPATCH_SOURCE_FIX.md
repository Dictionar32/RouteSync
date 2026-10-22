# Phase 2707 — ADT Identity Dispatch Source Fix

## Source problem

Phase 2706 used `if (identity.kind !== ...)` guards inside both canonical request identity handlers. That duplicated ADT narrowing inside a dispatch table whose purpose is to dispatch by the discriminant.

## Source-level correction

Updated `packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSourceEvidenceInventory.ts`:

- Added `RequestIdentityVariant<K>` using `Extract<RequestIdentitySource, { readonly kind: K }>`.
- Added `CanonicalRequestIdentityVariant<K>` to preserve the correspondence between the source variant and canonical output.
- Changed the dispatch contract to a mapped type keyed by `RequestIdentityKind`.
- Made the HTTP and FormRequest handlers accept only their exact ADT variants.
- Removed both runtime `if` guards and their mismatch exceptions from this dispatch.
- Kept the operation connected to the actual source evidence inventory used by request-type derivation.

The dispatch now has the form `canonicalRequestIdentityDispatch[identity.kind](identity)` with handler input/output correlation represented in the type model.

## Runtime trace

```text
CLI scan/sync
  -> upstream composition
  -> manifest scan operation
  -> controller invocation manifest authority
  -> source discovery and identity binding
  -> PHP AST/source inventory
  -> request-type derivation input
  -> requestTypeDerivationSourceEvidenceInventory.inventory
  -> canonicalRequestIdentityImplementation
  -> mapped ADT dispatch by identity.kind
  -> request evidence references
  -> semantic reasoning and proof verifier
  -> coverage / decision / authority / integrity
  -> manifest projection only if all authorities permit it
```

## Audit

- ADT dispatch source audit: **9/9** assertions passed.
- Phase 2703 upstream runtime source audit: **9/9** assertions passed.
- TypeScript syntax transpilation for the changed source: **0 syntax diagnostics**.
- A TypeScript compiler invocation was attempted. It reports existing type errors in other workspace files; this is not a clean workspace typecheck. No diagnostic named the changed source file in the captured output.
- Runtime/unit tests were not run.

## Explicit remaining work

This phase only removes `if`/`switch` narrowing from the canonical request-identity dispatch. Other ADT-related branches remain in proof verification, source occurrence verification, resource resolution, and semantic authority/preparation. They must be migrated individually to typed operation/ADT dispatches without broad mechanical rewrites.

Also unresolved: semantic and occurrence identities are still serialized as template strings; the proof verifier has not completed the full canonical proof-law set. The manifest path must remain fail-closed until those proof obligations are complete.
