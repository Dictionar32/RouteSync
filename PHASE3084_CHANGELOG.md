# Phase 3084 Changelog

- Replaced the duplicated stored `readResults` array on identity-binding batch outcomes with the domain operation `readResults()`.
- Derived the ordered result projection from authoritative `bindings` using an explicit typed sequence loop; removed `.map()` from the identity-binding authority.
- Updated the CLI composition boundary to call `boundBatch.readResults()`.
- Added a focused audit with runtime projection scenarios and repository invariant checks.
- Preserved monotonic rejected state, source identity evidence, existing CLI terminal ownership, and the deleted relation-foundation constraint.
- Full workspace typecheck, full tests, and end-to-end PHP → CLI → manifest → generator remain unverified.
