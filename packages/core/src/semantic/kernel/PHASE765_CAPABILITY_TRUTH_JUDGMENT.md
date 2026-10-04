# Phase 765 — Capability Truth Judgment

## Build frontier

The DTS frontier was:

`RouteCapabilityContract.auth: TruthValue` receiving a host `boolean` from `RouteSecurityResolver`.

This was not repaired by an assertion. The semantic model was raised so authentication is a nominal upstream value object at the semantic boundary.

## Model elevation

```text
Laravel route evidence
  -> boundary input boolean (host perimeter only)
  -> TruthValue
  -> capability semantic judgment
  -> RouteCapabilityContract.auth
```

`TruthValue` is now constructed once at the boundary and remains the authority through capability/security resolution.

## Authority cutover

- `ResolvedRouteBoundaryOptions.auth` is `TruthValue`.
- `RouteCapabilitySemanticInput.auth` is `Presence<TruthValue>`.
- `RouteSecurityResolution.auth` is `TruthValue`.
- `RouteSecurityResolver` consumes and produces the nominal value.
- `RouteCapabilityContract` consumes the canonical value.
- `boundaryContractFactory` no longer re-resolves capability after `resolveRouteBoundaryInput`.
- `capabilityBuilder` consumes the already-resolved capability fields from `ResolvedRouteBoundaryOptions`.

This removes the second capability authority and prevents a raw boolean from crossing the semantic contract boundary.

## Data-flow and AST relation

The route boundary remains connected to the closed AST/data-flow pipeline:

```text
Laravel ecommerce-shop source
  -> syntax evidence
  -> closed AST
  -> mapping judgment
  -> resolver graph judgment
  -> data-flow judgment
  -> analysis judgment
  -> semantic type judgment
  -> diagnostic judgment
  -> relation closure / fixed point
  -> declarative rewrite
  -> Laravel canonical route semantics
  -> Next.js target projection
```

No parsed-descriptor reservoir is reintroduced.

## Research alignment

WebAssembly specifies validity as declarative typing judgments over abstract syntax. MLIR PDLL separates pattern matching from rewriting and treats patterns as a higher-level abstraction. CompCert states compiler correctness as semantic preservation between source and generated code.

RouteSync follows the same architectural direction: closed judgments and canonical semantic values become the authority; host primitives remain only at explicit evidence/perimeter boundaries.
