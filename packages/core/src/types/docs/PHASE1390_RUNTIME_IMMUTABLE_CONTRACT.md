# Phase 1390 — Runtime immutable contract boundary

## Ownership

Upstream remains the only owner of producer classification and semantic policy materialization. Runtime validates the received representation and executes the selected facts and capabilities; it does not derive source/sink roles.

## Contract ingress

`decodeSemanticDataflowQueryPolicyContract(candidate, judgment)` accepts an untrusted runtime value, validates its actual structure and semantic closure, snapshots it through JSON serialization, validates the snapshot again, and recursively freezes the snapshot. A contract with an unknown `contractVersion`, malformed identity/fact, foreign fact, extraneous selected fact, duplicate selection, unknown barrier/flow-step endpoint, or duplicate capability entry is rejected.

The executor consumes this immutable snapshot rather than retaining the caller-owned contract object. This prevents a caller from mutating policy arrays after validation. The version is deliberately closed at `1`; an unsupported version fails closed. Migration between versions belongs in an explicit compatibility stage before Runtime execution, not in the executor.

## Scope

This phase does not introduce a generic schema framework and does not change package version or build command. JSON Schema can be added at a serialization boundary if the manifest is externally persisted, but it does not replace RouteSync's judgment/fact invariant checks.
