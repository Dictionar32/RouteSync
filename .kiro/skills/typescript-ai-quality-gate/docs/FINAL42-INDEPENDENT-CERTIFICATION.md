# Final42 — Independent Certification Result

Final42 is the remediation release for FP-41-001. The independent audit was run
from a clean unpacked checkout and did not import the primary analyzer/verifier
implementation for its gate logic.

## Results

- Independent audit: PASS
- False-negative gate: PASS
- False-positive gate: PASS
- Independent attestation tamper rejection: PASS
- Reproducibility: PASS
- Performance regression: PASS
- `self-tests/run.sh`: EXIT 0
- `self-tests/runx.sh`: EXIT 0

## FP-41-001 remediation

The sink scanner now rejects TypeScript declaration/signature contexts before
runtime-call extraction. A declaration such as `declare function exec(x: string):
void` is not a runtime sink and cannot create a source-to-sink edge.

## Performance measurement

Measured in independent child processes on the same tiny benchmark repository:

- Final39 median: 3.152770505999797 s
- Final40/Final42 median: 3.1787794490001033 s
- Regression ratio: 1.0082495516089136 (0.82%)
- Gate threshold: <= 15%

## Release decision

Final42 is the certification remediation candidate for V28.4. No new security
capability was added in this remediation; the change isolates runtime sink
evidence from declaration syntax and hardens certification execution.
