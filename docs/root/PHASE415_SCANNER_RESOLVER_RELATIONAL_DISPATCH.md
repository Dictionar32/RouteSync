# Phase 415 — Scanner/Resolver Relational Dispatch

Phase 415 melanjutkan eliminasi semantic authority berbasis host-language catalog lookup.

## Changes

- `queryEvidenceProducer.ts`
  - fixed duplicate local `operation` declaration in relation resolver;
  - named-method catalog lookup moved to `relationLookup` + `relationOptionFold`;
  - relation-operation catalog lookup moved to `relationLookup` + `relationOptionFold`;
  - model-static operation catalog lookup moved to `relationLookup` + `relationOptionFold`;
  - expression-argument catalog lookup moved to relational lookup;
  - closure and closure-statement catalog lookup moved to relational lookup;
  - for-clause catalog lookup moved to relational lookup;
  - operation catalog remains relation-backed.

## Architecture rule

Catalog dispatch is a semantic relation. Absence is consumed at the relation boundary rather
than delegated to `Map.has`, `Map.get`, optional chaining, or sentinel-driven dispatch.

This is intentionally not described as a complete forbidden-token-zero phase: `undefined`,
legacy nullable contracts, and imperative traversal still exist elsewhere in the scanner and
require contract-level migration to `RelationOption` / fixed-point relations rather than blind
text substitution.

## Validation

TypeScript `transpileModule` syntax diagnostics for the changed scanner file: 0.
Full repository type-check remains dependent on the repository's unavailable Node/Vitest type
packages in this environment.
