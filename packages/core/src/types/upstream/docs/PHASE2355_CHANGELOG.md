# Phase 2355 Changelog

- Strengthened the existing `HttpClient` with a typed unified HTTP request operation consuming the upstream `HttpMethod` vocabulary.
- Routed SDK `defineApi` calls through that operation and removed method lowercasing, method-union narrowing, and method-based GET/DELETE dispatch from this path.
- Preserved Axios instance configuration, interceptors, body preparation, headers, and query params.
- Added a CLI-to-executor static audit at `scripts/audits/audit-phase2355-query-http-executor-cli-wiring.cjs`.
- Did not add a QUERY-specific interface or introduce forbidden semantic/foundation/relation/subscanner dependencies on the modified SDK execution path.
- Runtime/type-level verification remains pending because dependencies are not installed in this workspace.
