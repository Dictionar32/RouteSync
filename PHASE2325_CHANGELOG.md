# Phase 2325 — Authorization Evidence Precision

- Reused the existing upstream authorization judgment interface and scanner wiring contract.
- Fixed prefix collision: `authorization`, `authenticated`, and `authorizer` no longer count as `auth` middleware.
- Kept recognition of `auth` and parameterized `auth:...` middleware.
- Added regression tests for exact recognition and mixed evidence.
- Documented limits: this does not yet resolve custom aliases/groups or prove a route is universally protected.
- No new `semantic/foundation` or `semantic/relations` dependency introduced.
- Tests/build not executed because dependencies are not installed in the provided archive.
