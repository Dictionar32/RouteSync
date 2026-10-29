# RouteSync Phase2976 — Runtime IR Domain Ownership

## Why this slice

The supplied build log shows that missing relation-foundation imports block the public `packages/core/src/index.ts` entry and propagate through SDK entrypoints. This phase begins the requested migration at the IR boundary instead of restoring `relationMembership`, `relationalSequence`, `semanticRelations`, or creating a replacement generic foundation.

## Implemented

- Replaced relation-driven IR lowering rules with `IRLoweringRule`, `IRLoweringRuleSetInterface`, and the explicit `IRLoweringRuleLookup` ADT (`found` / `missing`) whose variants own `continueWith`.
- Exposed `irLoweringOperations` as an explicitly typed runtime object export and migrated response-field normalization / nullable-wrapper consumers to it.
- Moved semantic field-name projection to `SemanticFieldSet.names()` and removed the direct relation import from `ir/buildIRNode.ts`.
- Changed `computeStableHash` and `buildSemanticIRNode` from exported function declarations to callable exports with explicit interfaces.
- Added domain-owned `responseCardinalityOperations` and removed direct relation foundation imports from `types/ir/resolvedSemanticFactory.ts`; gave the factory an explicit interface.
- Added regression tests for found/missing lowering judgments and preserved missing-rule blocker behavior.

## Runtime trace relationship

This slice is on the response/IR lowering side of the route scan → semantic resolution → IR lowering → generated response-field pipeline. It does not claim to complete all relation-foundation consumers in `types/upstream`, CLI composition, manifest graph compilation, or the whole core public entrypoint.

## Verification limits

The audit checks the structural migration in this slice. The repository still has other imports of deleted relation-foundation modules (including upstream authorities and manifest graph compilation), so full build success is not claimed. Full typecheck and full test suite must be rerun after the remaining consumer domains are migrated.
