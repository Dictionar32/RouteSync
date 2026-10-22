# Phase 2706 — Request Identity Dispatch Source Fix

## Root source changed

`packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSourceEvidenceInventory.ts`

The canonical request identity operation previously selected HTTP Request versus FormRequest with an inline `switch`. It now dispatches through `CanonicalRequestIdentityDispatchInterface` and `canonicalRequestIdentityDispatch`, keyed by the discriminant. Each named handler validates its source variant and produces the corresponding canonical identity. A mismatched runtime variant throws instead of being coerced or silently accepted.

Runtime path:

`CLI scan/sync → upstream composition → manifest scan → source discovery and identity binding → PHP AST/source inventory → requestTypeDerivationSourceEvidenceInventory.canonicalRequestIdentity → request resolution → semantic judgment → proof verification → manifest authority/projection`.

## Validation

- Phase 2704 upstream runtime operation-object audit: 11/11 static assertions passed.
- Phase 2706 request identity dispatch audit: 7/7 static assertions passed.
- These are static source audits only. A full TypeScript build and runtime/unit test suite are not claimed as passing because the workspace has known missing dependencies and the repository's configured target is newer than the globally installed compiler supports.

## Important remaining root issue

This change fixes the inline variant dispatch at its source; it does **not** claim that all low-level string identity keys have been eliminated. The canonical inventory still serializes semantic identities into `semanticKey` template strings (`route:…`, `resource:…`, `request:…`) and occurrence keys into strings. Fully eliminating that representation requires a coordinated migration across inventory, collision detection, source-occurrence verification, semantic reasoning, receipt replay, and proof verification; changing only the aliases would break key equality or create a false sense of type safety. The verifier also remains fail-closed while the complete canonical proof-law set is not verified.
