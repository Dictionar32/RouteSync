# RouteSync Phase 2114 — Executor Invocation Correlation

The executor input/result contracts now preserve the exact invocation-judgment subtype through a generic parameter constrained by the closed invocation ADT. This prevents type-level widening at the executor boundary while leaving runtime execution as a forward-only operation.

Audit: `node scripts/audits/audit-phase2114-executor-invocation-correlation.cjs`.

This is a bounded interface improvement, not completion of the broader controller canonicalization or subscanner retirement.
