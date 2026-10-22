# Phase2482 — Resource Evidence Single Inventory

## Goal

Close the P0 source-evidence duplication found by tracing the CLI source-AST pipeline against the Resource scanner. The pipeline must acquire Resource source evidence once and pass the exact inventory through the existing `LaravelResourceScannerInterface` boundary. Resource binding and AST projection must consume the same source-ordered evidence.

## Changes

- Added the generic upstream `LaravelResourceSourceEvidence<Identity, Syntax>` contract. It names the evidence envelope without importing compiler/lexer-owned syntax types into upstream.
- Evolved the existing `LaravelResourceScannerInterface` and `LaravelResourceScanInput` to accept `resourceEvidence` as one complete inventory; removed the detached `relationEvidence` input side channel.
- Made the concrete `ResourceScanEvidence` implement the upstream evidence envelope while retaining its existing implementation location.
- Updated `laravelSourceAstPipeline.ts` to acquire evidence once and pass that exact inventory to `resourceScanner.scan`.
- Updated `laravelResourceScanner.ts` to consume `input.resourceEvidence`, derive its relation facts from that inventory, and project ASTs from the same evidence. The scanner no longer reads the source project or calls `scanResourceSourceEvidence`.
- Advanced Resource scanner/input/judgment contract version from 18 to 19.
- Propagated the evidence type through the existing source-AST pipeline dependency contract. No new pipeline was introduced and no implementation file was moved.

## Verification

Run:

```sh
node scripts/audits/audit-phase2482-resource-evidence-single-inventory.cjs
node scripts/audits/audit-phase2457-upstream-resource-evidence.cjs
node scripts/audits/audit-phase2474-existing-resource-scan-contract-wiring.cjs
```

The new audit verifies the single-acquisition invariant, the upstream contract boundary, the removal of the side channel, and the explicit evidence wiring. Full project typecheck, build, Vitest, and end-to-end CLI are separate checks and must not be inferred from structural audit results.

## Remaining work

This phase closes the duplicate source-evidence acquisition only. Resource syntax parsing still depends on the existing lexer/evidence implementation and `semantic/relations`; Resource producers remain in `subscanners`. Those are separate migration tasks and must be handled after auditing existing upstream ownership contracts and all consumers.
