# Phase 1491 — Query Model-Origin Semantic Authority

## Intent

Move the model-origin decision used by the query producer behind the upstream `QueryProducerSemanticInterface`, so the scanner forwards a semantic judgment instead of recursively classifying receiver expressions itself.

## Change

- Added `resolveModelOrigin(evidence)` to `QueryProducerSemanticInterface`.
- Implemented upstream model-origin resolution for direct model references, chained method/nullsafe-method receivers, and recognized class static query operations.
- Added explicit `not_applicable` for unknown/non-model evidence and `malformed` for recognized operations whose argument contract is not satisfied.
- Replaced the scanner-local recursive `modelFromReceiver` classifier with a small judgment-to-legacy wiring adapter.
- Gated static-operation AST construction on the same upstream model-origin judgment, so the scanner catalog cannot independently authorize an unknown or malformed static operation.
- Added tests for direct model references, recognized and unknown static operations, and malformed static-operation evidence.

## Boundary and limitations

This is a vertical-slice migration, not a claim that all query semantics have moved upstream. `modelStaticOperationCatalog` still constructs detailed `QueryOperationAst` values in the scanner. The upstream judgment now gates this construction, but the argument constraints in the upstream model-origin vocabulary and the AST-construction rules should ultimately be unified into one declarative rule catalog to eliminate duplicated constraints. Other `toLegacyOption` calls still discard `malformed` diagnostics and remain migration work.

## Verification

The workspace does not include installed dependencies (`node_modules` is absent), so project tests and build could not be executed locally. Source-level changes and the phase test were added, but build/test success is not asserted.
