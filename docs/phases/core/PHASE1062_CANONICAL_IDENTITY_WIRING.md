# Phase 1062 — Canonical Identity Equality at the Downstream Wiring Boundary

The semantic dataflow identity key remains an upstream semantic authority. A canonical `semanticDataflowIdentityEqual` operation now compares identities by that key's stable fields.

The downstream runtime adapter uses this equality operation instead of serializing identity keys with `JSON.stringify`. This keeps representation/equality authority upstream while preserving the dependency direction:

`SemanticDataflowInput -> downstream wiring boundary -> DataFlowInterface`.

The semantic authority continues to own closure/fixed-point computation. The adapter only wires the closed semantic judgment into the generic dataflow contract.
