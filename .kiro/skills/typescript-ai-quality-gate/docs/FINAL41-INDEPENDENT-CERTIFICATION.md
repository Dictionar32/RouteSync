# Final41 — Independent Certification Audit

## Verdict

**BLOCKED — NOT A RELEASE CANDIDATE**

Final40's bundled runners can complete their current stabilization path, but the independent adversarial audit found a concrete false-positive security condition. Therefore Final41 cannot certify V28.4 for release.

## Audit model

This audit intentionally invokes `bin/quality-run.py` as an external process and consumes its raw JSON output. It does not import the production TypeScript security analyzer or trust the analyzer's attestation as evidence of correctness.

The independent checks cover:

- raw security finding/evidence inspection;
- verifier tamper rejection;
- reproducibility of security findings/metrics;
- adversarial source-to-sink flows;
- false-positive isolation;
- Final39 vs Final40 total runtime regression.

## Adversarial coverage

Covered positive flows:

- `Promise.then().then()`;
- `Promise.catch()` rejection propagation;
- `Promise.finally()` with a direct independent source;
- Promise object/property propagation;
- async return object;
- cross-file class method;
- callback return;
- method chaining;
- alias chain;
- destructuring;
- object mutation;
- cross-file re-export chain.

The positive fixture produced concrete `TSQ-SEC-003` findings for the proven flows, including explicit `promise-chain-parameter` and `cross-file-class-method` evidence.

## Blocking finding

### FP-41-001 — unrelated function parameters can taint a later safe sink

Fixture shape:

```ts
export function unrelated(req: any) {
  const x = req.body.x;
  Promise.resolve("safe").then(v => v).then(v => exec(v));
}

export function finallySafe(req: any) {
  Promise.resolve(req.body.command).finally(() => exec("safe"));
}
```

There is no data-flow from `req` to the first `exec()` argument. The Promise value is the constant string `"safe"`, and `finally()` does not receive the settled value.

Final40 nevertheless emits:

```text
TSQ-SEC-003
severity: critical
sink: process-execution
source: request-or-input
```

This violates the Final41 false-positive gate.

The finding is particularly significant because the same unrelated fixture can be clean when isolated, indicating cross-function/file aggregation contamination rather than a genuine source-to-sink path.

## Independent verifier tamper test

A raw attestation was modified after generation by changing the decision. The independent verifier rejected it with:

```text
VERIFY_FAIL
attestation-digest-mismatch
errors-mismatch
failure-types-mismatch
failures-mismatch
trust-state-mismatch
```

**PASS.**

## Reproducibility

The certification harness is designed to compare canonical security findings, severity/evidence fields, and TSQ metrics across repeated identical runs. The release is not allowed to pass certification unless those values remain identical.

## Performance

Same small repository, three runs each:

| Release | Median quality-run |
|---|---:|
| Final39 | 3.497 s |
| Final40 | 3.374 s |

Final40 is approximately **3.5% faster** on this controlled smoke workload; no >15% regression was observed.

Phase-level timing is not exposed by the existing attestation, so discovery/data-flow/verifier phase timing is not claimed as independently measured. Total process timing is measured externally.

## Runner status

Directly executing the two current runners under a 30-second outer timeout produced exit code 0:

```text
run.sh  → 0
runx.sh → 0
```

Both printed their PASS markers. This does **not** override the independent false-positive failure.

## Release decision

| Gate | Result |
|---|---|
| Independent audit | **BLOCKED** |
| Adversarial regression | PASS for covered proven flows |
| False-positive gate | **FAIL** |
| False-negative gate | PASS for covered proven flows |
| Verifier tamper rejection | PASS |
| Reproducibility | not used to override blocker |
| Performance regression | PASS |
| `run.sh` | EXIT 0 |
| `runx.sh` | EXIT 0 |
| Release candidate | **NO** |

## Required remediation before Final41 certification

The security data-flow engine must scope taint propagation to the actual function/control-flow graph. In particular, a request-derived value in one function must not contaminate a constant sink in another function merely because both functions share a file or analysis pass.

After remediation, rerun the complete independent certification suite from a clean checkout. Do not create a release candidate until FP-41-001 is absent and all gates pass.
