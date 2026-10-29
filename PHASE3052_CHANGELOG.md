# Phase 3052 Changelog

- Replaced the semantic validator's imports of deleted relation membership/sequence helpers and the upstream typed-relation facade with direct validation over canonical semantic facts and edges.
- Preserved duplicate identity, unknown endpoint, self-reference, unknown guard predicate, and derived-edge provenance invariants.
- Added a Phase 3052 audit and npm script.
- Did not restore deleted relation modules, add kernel re-exports, or create a generic relation foundation.
- Runtime remains blocked by deleted-foundation imports in the PHP AST adapter and compiler sequence facade; full strict typecheck and CLI-to-manifest E2E are not claimed as passing.
