# Phase Error Repair 20 — Route Parameter Consumer / Scanner Boundary

## Trace
The previous trace pointed at `controllerDataflowContract`, but the actual semantic leak was upstream of that consumer: `ScannedRouteParameterDescriptor` still exposed legacy fields `in`, `required`, and `bindingField` while the canonical `RouteParameter` already carried `location`, `presence`, and `binding` ADTs.

## Repair
- `ScannedRouteParameterParams` now contains semantic ADTs directly:
  - `RouteParameterName`
  - `PropertyName`
  - `RouteParameterBinding`
  - `RouteParameterLocation`
  - `Presence`
  - `RouteParameterType`
  - `RouteParameterConstraint`
- `ScannedRouteParameterDescriptor` exposes only canonical semantic fields.
- Raw scanner input is isolated in `RawScannedRouteParameterInput`.
- Conversion from raw PHP strings happens at the scanner origin boundary.
- Removed legacy public descriptor fields `in`, `required`, and `bindingField`.

## Verification
`tsc -p tsconfig.phase87.33.narrow.json --noEmit` was run after the change. Remaining diagnostics, if any, are unrelated roots and are captured in the active session trace.
