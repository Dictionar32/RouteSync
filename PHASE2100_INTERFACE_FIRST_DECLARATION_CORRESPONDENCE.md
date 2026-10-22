# Phase 2100 — Interface-First Declaration Correspondence

This phase formalizes the controller declaration authority's one-to-one, input-order correspondence and removes the scanner's redundant source-identity relation lookup when pairing parsed declarations with semantic selections.

See `docs/traces/PHASE2100_INTERFACE_FIRST_DECLARATION_CORRESPONDENCE_TRACE_TO_CLI.md` for the full CLI path and remaining dependency inventory.

Audit: `scripts/audits/audit-phase2100-controller-declaration-correspondence.cjs` — 12/12 static checks passed.

This is a scoped contract correction, not a claim that relation/foundation/subscanner have been removed. Build, typecheck, and Vitest were not run.
