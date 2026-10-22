# Phase 2355 — QUERY HTTP Executor and CLI Wiring

## Root cause

Phase 2354 closed the Laravel source judgment and projected `QUERY` into the route/IR vocabulary, but the real SDK executor still narrowed the method to GET/POST/PUT/PATCH/DELETE and invoked a method-name lookup. `HttpClient` had no unified typed operation capable of executing every method already represented by the upstream `HttpMethod` contract. The semantic contract therefore stopped before actual request execution.

## Contract decision

The existing `HttpClient` is the transport owner, so this phase strengthens it with one typed `request` operation instead of introducing a QUERY-only interface or a parallel executor abstraction. The SDK passes the already-classified `route.method` unchanged. The executor forwards that method to the configured Axios instance and applies the existing `prepareRequest` transformation; it does not infer verb meaning or select a payload policy by inspecting the method.

## Wired path

1. Laravel route-method authority emits the closed QUERY judgment.
2. `laravelRouteScanner` consumes that judgment and emits the `HttpMethod.QUERY` route.
3. The source-AST pipeline and manifest builder remain the active scanner-to-manifest path.
4. CLI `apiObjectEmitter` serializes the classified `route.method` into the generated endpoint.
5. Generated endpoint code calls `defineApi`.
6. `defineApi` passes `route.method`, body, and request config to `HttpClient.request` without lowercasing, narrowing, or method-based branching.
7. `HttpClient.request` invokes the same configured Axios instance, preserving its request/response interceptors and request preparation.

## Scope and limits

- No new per-verb interface was introduced; the existing HTTP method vocabulary is the operation contract.
- No dependency on `core/src/semantic/foundation`, `semantic/relation`, or subscanner was added to the SDK executor/CLI emitter path.
- Legacy convenience methods (`get`, `post`, etc.) remain for compatibility; generated `defineApi` execution now uses the unified operation.
- This phase has structural audit evidence only. The environment has no installed root `node_modules`, so no TypeScript typecheck, Vitest run, live Axios request, generated-client integration test, or full CLI E2E was executed. Do not interpret static checks as runtime proof.

## Remaining blockers before claiming full architectural completion

The focused SDK transport path does not add forbidden dependencies, but the broader active source-scanning pipeline still has pre-existing imports of `semantic/relations` and scanner submodules from `laravelRouteScanner.ts`; `laravelSourceAstPipeline.ts` also uses several subscanner producers. This phase does not claim those are removed. A separate upstream-contract migration is still required to satisfy a repository-wide no-relation/no-subscanner policy. Likewise, the 18/18 audit proves source wiring shape only, not successful TypeScript compilation or a real QUERY request.
