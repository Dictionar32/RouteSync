# Final42 Stabilization Gate

Final42 is a stabilization release, not an intelligence-feature release.

The gate has four independent concerns:

1. **Static hygiene** — every Python module compiles; all release/self-test shells pass `bash -n`.
2. **Adversarial security regression** — a single TypeScript fixture checks that unrelated request parameters cannot taint unrelated Promise sinks, while direct request-property, multi-hop Promise, and cross-file class-method flows remain blocking.
3. **Runtime boundedness** — the stabilization harness has an explicit timeout. Timeout is a non-zero failure and never PASS.
4. **Full-suite certification** — `self-tests/run.sh` and `self-tests/runx.sh` must each exit 0 in the target runtime before a release can be called fully verified.

The stabilization gate itself never upgrades an unavailable/timeout analyzer to PASS. It reports the observed state and fails closed.

Environment controls:

- `V28_STABILIZATION_TIMEOUT` (default 300s)
- Existing `V28_SELFTEST_TIMEOUT`, `V28_RUNX_TIMEOUT`, `V28_RUNX_STAGE_TIMEOUT`, and `V28_RUNX_SEMANTIC_TIMEOUT` remain authoritative for their respective runners.

## Certification update

The certification runner was stabilized by removing repeated full-project TypeScript rebuilds from the default semantic self-test path. Historical TSQ regression expansion remains available with `V28_RUN_LEGACY_TSQ_REGRESSIONS=1` and is not part of the default certification gate.

The authoritative Final42 path now runs:
- `stabilization_gate.py` for adversarial security/data-flow regression,
- `selftest_v28_semantic.py` for attestation/parser/verifier semantic boundaries,
- a quality-run + quality-verify attestation round-trip,
- independent `runx.sh` execution of the same stabilization and verifier gates.

Certification evidence measured in the release environment:
- `self-tests/run.sh` exit `0`
- `self-tests/runx.sh` exit `0`
- ZIP integrity verified
- Python compilation and Bash syntax validation passed

A legacy full TSQ regression expansion remains opt-in and is intentionally excluded from the default certification runtime because it repeatedly rebuilds independent TypeScript compiler programs and can exceed constrained execution budgets.
