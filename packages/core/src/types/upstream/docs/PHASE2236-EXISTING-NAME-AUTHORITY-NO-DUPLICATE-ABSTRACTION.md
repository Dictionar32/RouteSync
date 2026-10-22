# Phase 2236 — Existing Name Authority, No Duplicate Abstraction

## Root cause

Phase 2235 introduced `StringValueEqualityInterface` and `stringValueEquality` even though the upstream `names.ts` module already owns typed name identity operations (`classNameEquals`, `variableNameEquals`, and `modelNameMatchesClassName`). This added a generic authority surface instead of evolving the existing owner.

## Correction

- Removed `StringValueEqualityInterface` and `stringValueEquality` from `valueObjects.ts`.
- Kept the existing typed name operations in `names.ts` as the owner of name equality.
- Added/retained `methodNameEquals` as a domain-specific operation on the existing `MethodName` contract because the resource-binding rule compares method names.
- Implemented these existing operations with `Object.is` on the wrapped value, preserving exact value equality without importing `semantic/relations` or `foundation`.
- Updated the Phase 2235 audit to reject duplicate generic equality authority rather than reward it.

## Trace boundary

The targeted path is `ControllerResourceBindingAuthorityInterface` → `controllerResourceBindingAuthority` → `methodNameEquals` in the existing name owner. The resource-binding authority and names module do not import `semantic/relations` or `foundation`.

The broader Laravel controller path is not yet subscanner-free. `laravelControllerExecutionDependencies.ts` still wires `scanControllerAction()` and `controllerBodySemanticJudgmentAuthority` from `subscanners/controller`. This phase deliberately reports that debt instead of claiming it has been retired.

## Authority rule

Do not create a generic equality interface when the existing typed domain owner can own the operation. New interfaces are justified only when they express a distinct semantic capability or ownership boundary that cannot be represented by the existing contract.
