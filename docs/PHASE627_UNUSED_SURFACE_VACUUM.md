# Phase 627 — Unused Surface Vacuum

Policy: preserve unused file paths; empty implementation instead of deleting files.

## Confirmed production-unused surfaces

The following files had no production import/export path consumer after excluding test trees and were therefore emptied:

- `packages/core/src/types/upstream/routeResource.ts`
- `packages/core/src/types/upstream/routeSemanticFlow.ts`
- `packages/core/src/types/upstream/routeResourceMode.ts`

These are legacy upstream semantic surfaces superseded by the active relation/AST vocabulary and scanner route-AST relations.

## Safety rule

Source-language vocabulary is not removed merely because a textual token such as `any`, `null`, `??`, or ternary appears. The elimination target is host-language implementation authority, not PHP/Laravel syntax represented as AST facts.

## Next frontier

The remaining active frontier is scanner/lexer, graph resolver, AST/upstream mapping, analysis, and semantic type lowering. These require consumer migration into declarative relations, constraints, recursive closure/fixed-point evaluation, and rewrite/lowering rules before their old files can be vacuumed.
