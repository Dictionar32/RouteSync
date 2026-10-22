# Phase 1394 — Runtime Lossless Array Boundary

Runtime contract decoding must reject payload shapes whose meaning would change during JSON snapshotting. JavaScript sparse arrays serialize holes as `null`; JSON serialization also ignores non-index own properties on arrays. The runtime preflight now requires dense arrays with exactly the standard `length` property and one own index per element before contract validation and snapshotting.

This is a representation-integrity check, not semantic classification. Upstream continues to own source/sink materialization and policy meaning. Runtime validates the incoming data shape, supported contract version, closed judgment membership, and invariants, then executes an immutable snapshot.

The package version and build command remain unchanged. Source audit does not substitute for integration tests or a successful package build.
