# Phase 1391 — Untrusted Runtime Contract Boundary

The runtime orchestration boundary now treats policy-contract inputs as `unknown` until the contract decoder validates them. Static TypeScript annotations are not a runtime trust boundary: TypeScript compatibility is structural and type annotations do not validate JSON or other runtime values.

The identity matcher first verifies the complete contract shape and only then reads the judgment identity. The execution policy accepts an unknown candidate and decodes it against the already-closed judgment, producing an independent immutable snapshot. This keeps Runtime in the executor role: it validates protocol shape, version, judgment association, membership, and closure invariants, but does not reclassify producer domains or regenerate source/sink policy.

Contract evolution remains explicit through `contractVersion`. Unsupported versions fail closed. When the contract shape or semantics change incompatibly, introduce a new version and an explicit decoder/migration policy rather than silently widening the existing version.

Validation: source audits cover the upstream materializer, contract wiring, versioned policy execution, immutable decoding, and the untrusted boundary. A source audit is not a substitute for running the package build and integration tests with the repository's pinned dependencies.
