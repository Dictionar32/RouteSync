# Phase 2670 — Source-bound incoming contribution receipts

## Root cause

The upstream `RequestTypeGroupContributionReceipt.incoming` carried only `{ actions, response }`. That projection omitted the incoming `RequestType.identity` and `RequestType.source`. A verifier could replay the fold payload without establishing that the payload belonged to the route/request AST occurrences named by the receipt. The initial transition also reconstructed its expected `after` identity/source from the receipt's claimed `after`, making those fields self-attested rather than derived.

## Changes

- Upstream contract now requires the full `RequestType` as `incoming`.
- The canonical group-fold algebra preserves that complete incoming semantic value.
- Independent replay derives the initial state from `incoming`, not the claimed `after`.
- The verifier correlates route and request occurrence keys with the original input and prepared inventory; checks source spans; checks route-bound FormRequest identity/source against the incoming value; and checks the request resolution ledger points at the same request occurrence.
- A successful group replay is reported as `verification_incomplete`, never as full law verification.
- Added structural audit `audit:phase2670-source-bound-incoming-receipts`.

## Laravel fixture trace

Inspected `examples/ecommerce-shop-source/routes/api.php`, `routes/web.php`, and `routesync.temp.manifest.json`. The fixture has concrete API route declarations (including `/register`, `/produk`, and `/produk/{id}`) and a separately generated manifest. These files provide a local integration target; this phase does not claim that a fresh Laravel scan and manifest regeneration was executed because project dependencies are absent.

## Validation

- Phase 2670 structural assertions: 10/10 pass.
- Focused TypeScript invocation: no diagnostics were reported in the changed verifier, group-fold algebra, or upstream interface files.
- The same invocation still reports existing project errors in unrelated modules, including `PrimitiveKind` imported as a type but used as a value, missing `ControllerActionSchemaRequestEvidence`, controller expression algebra generic errors, and other domain-model mismatches.
- Vitest / full build / end-to-end Laravel scan: not run; `node_modules` is absent.
- All 34 semantic laws: not verified. Receipt provenance is strengthened but action/response derivation still needs independent AST-to-contribution checks and authority/integrity closure.
