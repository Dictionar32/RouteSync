# Phase 1574 changelog

- Replaced the public request-type authority's bare `derive -> judgment` boundary with `derive -> authority outcome`.
- Added a discriminated result coupling judgment and verification: `verified`, `input_rejected`, or `verification_failed`.
- Kept `verify` available for independent tests/audits without allowing the primary `derive` contract to silently bypass verification.
- Updated the Phase 1573 structural audit to recognize the stricter authority outcome contract.
- Added Phase 1574 contract audit and trace notes.
- Scanner aggregation and runtime executor intentionally unchanged; this phase establishes the contract before migration.
