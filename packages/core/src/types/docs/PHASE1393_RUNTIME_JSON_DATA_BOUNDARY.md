# Phase 1393 — Runtime JSON Data Boundary

## Ownership

Upstream remains authoritative for semantic classification and policy materialization. Runtime only checks that the received payload is inert JSON-shaped data, validates the versioned closed contract against its judgment, snapshots it, and executes the validated snapshot.

## Boundary hardening

`decodeSemanticDataflowQueryPolicyContract` now runs `isJsonDataValue` before inspecting contract fields. The preflight rejects accessor properties, symbol properties, custom prototypes, cyclic object graphs, non-finite numbers, and non-JSON primitive values. This matters because TypeScript annotations are erased at runtime and property access on arbitrary objects can invoke getters.

After the preflight, the existing structural and semantic invariants still apply: supported contract version, judgment identity, fact membership, exact selected-fact union, and known barrier/flow-step identities. The decoder then snapshots and validates the snapshot again before recursively freezing it.

## Non-goals

This does not add a second source/sink classifier, infer policy from producer domains in Runtime, or introduce a general-purpose schema framework. Unsupported contract versions continue to fail closed.

## Verification

Run `npm run audit:phase1393-runtime-rejects-executable-payloads` and the prior Phase 1386–1392 audits. These are source-level architectural audits; they are not a substitute for executable integration tests or a successful package build.
