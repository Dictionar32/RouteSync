# Phase 2338 — Existing upstream policy input contract closure

## Scope

This phase starts at the existing upstream contract `EffectiveControllerActionPolicyUpstreamInput`; it does not introduce a parallel interface or begin by changing the Laravel scanner runtime.

## Contract defect found

The existing input contract allowed `policy`, `inheritedFrom`, and `source` to be omitted. The upstream resolver then silently substituted empty collections (`input.policy ?? []`, etc.). That collapsed two distinct states into one:

- upstream explicitly established that the action has no policy / no inherited lineage / no source spans;
- the caller failed to provide the corresponding semantic evidence.

A closed executor boundary must not infer the first state from the second.

## Change

The existing interface now requires all three fields:

- `policy`: explicit controller-action policy evidence;
- `inheritedFrom`: explicit inheritance lineage for the action;
- `source`: explicit provenance collection.

The existing resolver no longer supplies fallback collections. Existing call sites were updated to state their empty evidence explicitly where the test/model case truly has no policy or lineage. The canonical algebra and the existing complete/blocked result ADT remain the semantic owners; no `V2` contract was added.

## Laravel semantics and boundary

Laravel controller middleware can be class-level or method-filtered with `only` / `except`, and resource routes can scope middleware to individual actions. Therefore scope and inheritance are semantic evidence, not incidental runtime options. The existing controller policy ADTs and the effective-policy judgment remain the right ownership boundary; this phase closes missing-field ambiguity without claiming that every inheritance/catalog question is solved.

## Verification

Run `node scripts/audits/audit-phase2338-policy-input-contract.cjs` and `node --check scripts/audits/audit-phase2338-policy-input-contract.cjs`.

TypeScript typecheck, Vitest, CLI end-to-end, and package build were not run in this environment. `npm run build` was not run.

## Remaining contract audit

1. Determine whether controller policy evidence should carry an explicit inventory-completeness judgment rather than relying on an explicitly supplied empty collection at this boundary.
2. Trace the existing `LaravelRouteScannerInterface` artifact into AST / manifest security projection and verify the same policy judgment is preserved without `auth:boolean` reconstruction.
3. Audit the remaining scanner-path imports from `semantic/relations` against their proper upstream owners.
4. Trace the legacy route subscanner's callers and exports before any retirement.
