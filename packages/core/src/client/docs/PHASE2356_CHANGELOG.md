# Phase 2356 changelog

- Added `HttpRequestExecution<TBody>` as a single object contract for an already-classified HTTP operation.
- Strengthened the existing `HttpClient.request` method to consume that contract.
- Updated `defineApi` to forward URL, upstream method, body, and request config as one operation.
- Exported the operation type from the core package entry point.
- Added a QUERY transport regression fixture using the configured Axios adapter.
- Added static audit `scripts/audits/audit-phase2356-http-operation-contract.cjs`.
- Did not claim runtime verification or removal of the route scanner's pre-existing `semantic/relations` / subscanner dependencies.
