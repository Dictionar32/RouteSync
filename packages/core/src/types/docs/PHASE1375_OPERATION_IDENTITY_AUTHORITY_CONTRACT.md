# Phase 1375 — Operation Identity Authority Contract Composition

## Trace

`RouteBoundaryContract.capability` → `operationIdentityCapabilityFromRoute` → `OperationIdentityCapabilityAuthorityInterface` → `OperationIdentityCapabilityRuntimeAlgebraInterface` → `OperationIdentityCapabilityContract` → `OperationIdentityProjectionInterface` → CLI projection / SDK fail-closed consumption.

The same trace was checked against the canonical AST/dataflow boundary, manifest forwarding, structural graph projection, closed IR projection, and React endpoint capability consumption.

## Finding

The operation identity authority delegated to the canonical runtime algebra, but its executable authority surface was only a free function. The contract described the algebra operation, but did not express authority ownership/closure or provide a composition factory for selecting an implementation at the boundary.

## Change

- Added `OperationIdentityCapabilityAuthorityInterface`, which specializes the existing runtime algebra contract and declares upstream ownership plus closed authority metadata.
- Added `createOperationIdentityCapabilityAuthority(algebra)` to compose an authority from the behavioral contract.
- Bound the canonical production authority to `operationIdentityCapabilityAlgebra` exactly once.
- Preserved the existing one-argument `operationIdentityCapabilityFromRoute(route)` API; an authority may now be supplied explicitly for runtime composition and verification.
- Exported the new contract and factory from the core public entry point.

## Ownership

The authority wrapper does not classify HTTP method/path, recreate identity, or reconstruct proof. The canonical algebra remains the sole constructor and forwards route evidence, derivation, provenance, and reasoning proof. CLI/SDK continue to consume the projection rather than reclassifying identity.

## Validation

Run `npm run audit:phase1375-operation-identity-authority-contract`. The audit is static and does not claim TypeScript build/runtime test success. Build verification requires the project's installed toolchain.
