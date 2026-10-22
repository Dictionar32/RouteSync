# Phase 2634 — CLI Semantic Authority Single Gate

## Root cause

The CLI previously treated the preflight request/resource-resolution assessments as independent hard gates, then invoked the proof-producing RequestType semantic pipeline. This created two competing decision paths: a diagnostic inventory/resolution operation could terminate scan/sync before the canonical semantic judgment had a chance to represent its own closed outcome.

## Change

- `scan` and `sync` still emit the preflight evidence and resolution assessment JSON files for observability.
- They no longer branch/exit on those preflight assessment discriminants.
- The authority-backed RequestType pipeline is the sole gate for projection; its closed ADT (`manifest_projected` / `manifest_projection_blocked`) controls whether manifest lowering occurs.
- No fallback to the legacy RequestType projection was introduced.
- No `semantic/foundation` or `semantic/relation` dependency was added.

## Boundary of this fix

This removes the duplicate CLI-level semantic gate; it does **not** implement the missing production reasoning/verifier. The preflight ledger remains diagnostic and is not proof that the semantic judgment has validated the same facts. Production completeness still requires a real reasoning producer and independent verifier that establish the full upstream law contract. Until then, the pipeline must fail closed.

## Verification

Run `npm run audit:phase2634-cli-semantic-authority-single-gate`. This is a structural audit, not a substitute for full typecheck, tests, build, or Laravel fixture execution.
