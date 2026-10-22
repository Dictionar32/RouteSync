# Phase2457 — Resource Evidence Ownership Trace

`LaravelResourceScannerInterface` already owns the `relationEvidence` input. Before this phase, the pipeline passed an empty list and the scanner appended relation evidence discovered internally. That made the semantic authority's actual input differ from the declared input boundary.

The pipeline now gathers source-backed resource relation evidence and passes it through the existing contract. The scanner's binding authority receives only that supplied evidence. This is an ownership correction, not a new interface or a claim that `subscanners` / `semantic/relations` have been retired.

Remaining blockers: source evidence is parsed again for AST projection; channel client-subscription evidence and its classification authority are not supplied; legacy scanner calls and transitive relation dependencies remain open.
