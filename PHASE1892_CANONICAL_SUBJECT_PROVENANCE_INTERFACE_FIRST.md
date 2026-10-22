# Phase 1892 — Canonical subject and provenance boundary, interface first

## Trace finding

The canonical Laravel invocation judgment already has one inventory subject key (`judgment.sourceFile`) and preserves the exact integrated response as an outcome-indexed union. For `complete` and `blocked`, that response also carries a closed source-binding judgment whose identity relation owns the two endpoints used as provenance evidence. These are different semantic roles: the outer key supports inventory lookup; the nested relation proves the source-to-pipeline binding. Treating the two roles as duplicate models would be incorrect, but saying that the relation is the sole owner of every source identity while separately retaining an outer canonical subject is ambiguous.

## Interface correction

- Advanced `PhpSourceInvocationSemanticSourceBindingContract` from v4 to v5 to define relation-endpoint ownership without forbidding the enclosing judgment's canonical subject key.
- Advanced `LaravelControllerInvocationSemanticBoundaryContract` from v58 to v59 and added `canonicalSubjectProvenanceBoundary`.
- Retained the existing canonical judgment union, inventory model, integrated-response outcomes, and public exports. No V2 model or projection interface was added.

## Runtime boundary

No runtime behavior was implemented or migrated. `laravelControllerScanner.ts`, the invocation judgment authority implementation, and the inventory authority implementation remain byte-identical to Phase 1891. The source-binding authority's judgment-construction and execution body is also byte-identical; only its declared contract metadata was updated to match interface v5.

## Verification

The phase audit checks contract ownership, canonical model uniqueness, receipt-only scanner input, and unchanged runtime implementation hashes. This is static verification; no TypeScript build or test suite is claimed.
