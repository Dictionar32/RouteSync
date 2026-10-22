# Phase 2358 changelog

- Tightened the existing upstream route-method judgment ADT: standard and QUERY judgments now carry one resolved HTTP method as a tuple rather than an unconstrained list.
- Removed irrelevant `targetMethods` from standard judgments; match judgments retain target evidence.
- Advanced method authority contract version to 8 and scanner/scan outcome contracts to version 24.
- Updated regression expectations and current static audit assertions to match the evolved contract.
- Added `scripts/audits/audit-phase2358-closed-standard-route-method-contract.cjs`.
- Did not claim semantic-relations/subscanner migration or runtime/CLI E2E completion.
