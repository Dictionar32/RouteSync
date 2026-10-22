# Phase 1392 — Runtime projection trust boundary

The upstream manifest and its internal semantic manifest surface retain the precise `SemanticDataflowQueryPolicyContract` type: materialization is a typed upstream responsibility. The runtime-facing `RouteSyncManifestDataflowSurface`, however, exposes policy payloads as `readonly unknown[]`. This is intentional: a projection can cross serialization, persistence, plugin, or JavaScript caller boundaries, and a TypeScript annotation cannot establish runtime validity.

`analyzeRouteSyncManifestDataflowWithPolicy` selects a candidate by its guarded identity matcher. `createSemanticDataflowAnalysisPolicy` then decodes the candidate against the exact closed judgment, validates version and semantic membership, snapshots it, and freezes the snapshot before execution. Thus the runtime-facing boundary does not falsely promise that external payloads are already trusted, while the upstream producer still owns the precise contract type and semantic classification.

No producer-domain reclassification or semantic closure is added to runtime. Unknown contract versions and malformed payloads fail closed. Contract version changes must be explicit and must not be silently interpreted as version 1.
