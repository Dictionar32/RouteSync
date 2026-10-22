# Phase 2356 — Closed HTTP Operation Input Contract

## Audit and root cause

Phase 2355 connected the SDK to `HttpClient.request`, but the call still used four positional arguments. The operation's URL, method, body, and transport config were therefore not represented as one inspectable instruction. That weakens the runtime-executor boundary even though the upstream route method itself was preserved.

## Contract decision

Strengthen the existing `HttpClient` rather than create a QUERY-specific interface or a second executor. `HttpRequestExecution<TBody>` represents one already-classified transport operation. It groups the final URL, upstream `HttpMethod`, body, and Axios request config. The interface intentionally contains no method classifier or payload-location policy.

`HttpClient.request<TResponse, TBody>(operation)` is the single executor entry point for this operation. It applies the existing `prepareRequest` transformation and calls the existing configured Axios instance, preserving configured interceptors. The SDK forwards `route.method` directly in the operation object.

## Regression fixture

`HttpClient.query-operation.phase2356.test.ts` installs an adapter on the configured Axios instance and asserts that `QUERY`, the URL, and the transformed body reach that transport path. This is a test fixture added to the repository; it has **not** been executed in this environment because workspace dependencies are not installed.

## Remaining architectural blockers

This phase does not claim full RouteSync completion. The active Laravel route scanner still imports `semantic/relations` and `subscanners`, and `laravelSourceAstPipeline.ts` still wires several subscanner producers. Those dependencies require a separate upstream ownership migration; merely changing HTTP transport does not remove them. No TypeScript typecheck, Vitest execution, full build, or CLI end-to-end run was performed.
