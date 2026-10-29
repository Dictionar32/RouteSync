# Phase 225 — Semantic Object Identity

RouteSync now has a conservative object-identity/alias analysis overlay.

## Principle

Canonical semantic facts remain authoritative. Alias answers are derived from
those facts and never from AST/Tree-sitter node identity.

## Alias lattice

- `must-alias`: exact semantic identity.
- `may-alias`: explicit by-reference assignment evidence.
- `no-alias`: reserved for future explicit non-alias evidence; this phase never
  guesses it from different syntax or construction sites.

This follows the conservative shape of compiler alias analysis while keeping
RouteSync's semantic knowledge model independent of LLVM IR or pointer syntax.

## Consequence

Property/object flow can query identity before connecting a write to a read.
Future phases can add field-sensitive object identity, escape evidence, and
Mod/Ref without changing the canonical semantic fact model.
