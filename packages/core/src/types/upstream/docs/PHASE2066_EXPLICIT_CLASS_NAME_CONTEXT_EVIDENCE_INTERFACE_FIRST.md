# Phase 2066 — Explicit Class-Name Context Evidence, Interface First

## Trace finding

`controllerDataflowContract.ts` previously synthesized an empty namespace plus an incomplete import inventory when a method's lexical class-name context was absent. That was conservative in many cases, but it represented missing evidence as if it were a constructed PHP context. The distinction matters because the resolver's closed judgment should report why it cannot resolve a class name, not infer the shape of a context that was never supplied.

## Contract change

- Added `ControllerStaticCallClassNameResolutionContextEvidence`, an ADT with `available` and `unavailable` variants.
- Added `class_name_resolution_context_unavailable` to the existing `PhpClassNameResolution` blocked outcome.
- The existing static-call class-reference rule now closes unavailable context directly instead of invoking the PHP name resolver with synthetic namespace/import data.
- The dataflow projection explicitly forwards unavailable context evidence when the lexical context is missing.
- The existing `ControllerStaticCallOriginAuthorityInterface` advances to contract version 10; the class-reference resolution rule advances to version 3.
- The same canonical class-name judgment continues to flow into rule matching and model identity. No new invocation, response, AST, ADT, or runtime authority was introduced.

## Preserved boundaries

`Laravel source evidence → lexical context evidence → closed class-name judgment → model-origin judgment → invocation/integrated response → AST/ADT projection → runtime executor`.

No `relation/foundation` subscanner was added. The runtime executor remains delegation-only.

## Verification scope

The phase audit checks source-level contract invariants. It does not claim a full TypeScript build, full typecheck, or Vitest suite result.
