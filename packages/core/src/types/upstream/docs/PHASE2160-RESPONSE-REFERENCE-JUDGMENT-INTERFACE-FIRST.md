# Phase 2160 — Response Reference Judgment, Interface First

`ControllerResponse` previously used `response_present` and `response_absent`, which obscured that this ADT describes response-reference availability rather than proving an HTTP return. The existing canonical return ADT and integrated response pipeline already own HTTP-return interpretation.

The existing contract is evolved to `ControllerResponseReferenceJudgment` with `response_reference_declared` and `response_reference_not_declared`. Response descriptors expose `responseReferenceJudgment`; the action contract and published semantic knowledge use the same explicit field name. Resource-binding authority now receives the precise reference ADT and returns unresolved when a declared reference is unavailable.

No new response authority, `relation/foundation` layer, or subscanner is added. The legacy `ControllerResponse` name remains a compatibility alias. `resolveResponse(...)` remains a known derivation boundary and is not claimed retired by this phase.
