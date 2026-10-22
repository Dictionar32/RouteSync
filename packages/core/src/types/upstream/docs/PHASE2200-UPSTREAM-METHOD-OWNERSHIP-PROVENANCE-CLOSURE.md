# Phase 2200 — Upstream Method Ownership and Provenance Closure

## Root cause

The integrated response pipeline resolved a DTO declaration from a controller response attribute, then `projectDtoResponseContracts()` searched the controller's method evidence again by comparing source-span object identity. This made method ownership an inferred join rather than data carried by the upstream judgment. The resolver knew which request caused the judgment, but its contract retained only `requestSource`.

## Contract-first change

- Added `LaravelControllerResponseDtoDeclarationRequestOwner`, a closed owner ADT with `controller_response_attribute_owner` and `dto_property_type_reference_owner` variants.
- Controller response requests retain the exact `ControllerMethodEvidence` whose response attribute requested the DTO.
- DTO property-reference binding uses the distinct property-owner variant; it does not pretend to be a controller method response.
- The declaration resolver preserves owner provenance when it narrows a request to a resolved input, so positive, unresolved, and ambiguous judgments all retain the same request owner.
- `projectDtoResponseContracts()` now reads the response shape directly from the judgment's controller owner. It no longer scans methods or joins on source-span equality.
- The existing DTO declaration resolution contract is version 5. No parallel semantic authority or new relation/foundation/subscanner layer was introduced.

## Boundary retained

The owner ADT carries provenance; it does not itself declare a response contract. DTO declaration resolution still owns only canonical project/class declaration resolution. Response-contract projection remains the existing projection authority, and invocation semantic ownership remains unchanged.

## Validation

The phase audit records syntax transpilation, structural assertions, and ZIP integrity separately. Full typecheck, Vitest, and package build are not claimed. `npm run build` was not run.
