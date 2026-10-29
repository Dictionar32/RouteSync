# Phase 3065 changelog

- Replaced redundant `schemaEvidence.continueWith({ onAvailable: ..., onUnavailable: ... })` call with the explicit domain operation `schemaEvidence.continueToSchema()` in the controller-reference route boundary projection.
- Kept the original `schemaEvidence` attached to the boundary contract, preserving availability/provenance independently from the schema payload.
- Added audit script and npm command `audit:phase3065-route-schema-evidence-domain-continuation`.
- Did not restore deleted relation foundation modules or alter the protected `collections.ts` invariant.
- End-to-end PHP/CLI runtime and strict TypeScript checks remain unverified.
