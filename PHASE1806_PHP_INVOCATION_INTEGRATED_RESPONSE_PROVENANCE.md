# Phase 1806 — PHP Invocation Integrated-Response Provenance

The integrated-response contract now retains the exact discriminated source-pipeline result alongside the projected PHP invocation integration state. Composition receives one source-pipeline evidence union instead of accepting a separately projected state that could disagree with it. Scanner wiring forwards evidence without projecting or reclassifying it.

See `scripts/audits/reports/phase1806-php-invocation-integrated-response-provenance.md` and run:

```sh
node scripts/audits/audit-phase1806-php-invocation-integrated-response-provenance.cjs
```

This phase does not claim that a concrete whole-file PHP AST frontend or full scanner migration exists. Build/typecheck were not run.
