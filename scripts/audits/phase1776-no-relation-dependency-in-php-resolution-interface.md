# Phase 1776 — PHP Function Resolution Interface Ownership

## Correction

`phpFunctionNameResolutionInterface.ts` must not import `Sequence` from `semantic/relations`. The resolver contract owns typed PHP import/declaration inventories; a generic relation collection is not part of the semantic interface contract.

## Change

- Removed the `semantic/relations/relationalSequence` type dependency from the PHP function name-resolution interface.
- Represented the two evidence inventories as readonly collections of their domain-specific item types.
- Preserved the existing resolution judgment, rule order, environment-completeness model, and deferred namespace/global fallback candidates.

## Boundary

This phase only removes the relation dependency from this interface. It does **not** claim that `semantic/relations` or `semantic/foundation` can already be deleted globally. The legacy PHP function-call authority and Laravel scanner still have runtime imports that need to be migrated in subsequent interface-first phases before those directories can be removed.

## Verification

Run:

`node scripts/audits/audit-phase1776-no-relation-dependency-in-php-resolution-interface.cjs`

The audit checks the target interface boundary only. No full build or TypeScript typecheck is claimed.
