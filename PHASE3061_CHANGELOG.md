# Phase 3061 changelog

- Added upstream `ControllerDataflowAnalysisOutcome` completed/blocked ADT and explicit domain operations.
- Gated controller semantic judgment derivation on the producer outcome.
- Updated the interface-backed scanner runtime binding to return the typed outcome.
- Added blocked controller-body AST cases preserving source evidence, violations, payloads and integrated response judgment where applicable.
- Updated the Phase 3060 regression audit to distinguish the newly closed controller-body gate from the still-open CLI/manifest terminal gate.
- Added Phase 3061 structural audit and package script.
- No deleted relation foundation was restored; `collections.ts` invariant retained.
