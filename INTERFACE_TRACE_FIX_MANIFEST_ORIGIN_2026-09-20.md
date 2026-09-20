# Interface Trace Fix — Manifest Origin Boundary — 2026-09-20

## Change
`ScannedRouteManifestDescriptor.create()` is now a pure assembly boundary.
It no longer calls `TypeDeriver.deriveRequestTypes()` or
`TypeDeriver.deriveSemanticTypes()` when arrays are empty.

## Dataflow
Scanner-derived facts -> Manifest -> downstream.

The manifest must not re-classify or re-derive missing request/semantic data.
Missing upstream facts remain missing and must be repaired at the scanner
origin boundary instead of synthesized inside Manifest.

## Remaining identity issue
`ScannedRequestTypeDescriptor` still has a legacy request-class fallback for
compatibility. The next upstream repair should replace that fallback with an
explicit RequestClassBinding ADT and make FormRequestScanner the authoritative
source of request class identity.
