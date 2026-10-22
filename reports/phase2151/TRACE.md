# Phase 2151 Trace

`LaravelControllerRequestSemanticBindingAuthority` -> canonical action request judgment (`typed` / `typed_unresolved`) -> **OPEN WIRING GAP** -> `RouteRequestBinding` ADT -> `EndpointRequestBinding` ADT -> high-level relation projection / request-type aggregation.

Phase 2151 closes the ADT mismatch and prevents unresolved request outcomes from being mistaken for absent input at the endpoint ADT boundary. It does not yet connect the canonical action judgment to route-boundary construction: the route producer still consumes the legacy `ControllerActionInfo.request` field. This remaining ownership obligation is intentionally not marked closed.

Invocation semantic judgment, integrated response composition, and runtime executor behavior remain unchanged: executor forwards the existing closed judgment and does not derive semantic meaning.
