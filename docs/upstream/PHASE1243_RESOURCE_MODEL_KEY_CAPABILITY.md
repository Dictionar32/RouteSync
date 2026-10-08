# Phase 1243 — Upstream Resource → Model → Key Capability

## Boundary

The remaining primary-key semantic reconstruction in the CLI was traced to `resolveItemPrimaryKeyType()`. The old path matched generated `titleName` against model names and then read `model.semantic.key.semanticType`.

That is now replaced by an upstream closed capability:

```text
ResourceAst.semantic.model
        ↓
ModelAst.semantic.key.semanticType
        ↓
ResourceModelKeyCapabilityContract
        ↓
RouteManifest resourceModelKeyCapabilities
        ↓
CLI projection
```

The downstream resolver identifies the resource using the already-closed route identity and reads the capability. It no longer performs model-name matching or reads `ModelAst` directly.

## Algebra

```text
SemanticReasoningAlgebra
        ↓
SemanticReasoningContract
        ↓
SemanticCapabilityAlgebra
        ↓
SemanticCapabilityContract
        ↓
ResourceModelKeyCapabilityContract
        ↓
UpstreamWiring / manifest transport
        ↓
CLI projection
```

This keeps semantic authority upstream and preserves the existing `DataFlowInterface` separation: generic dataflow execution remains distinct from semantic authority.

## External alignment

MLIR interfaces deliberately let analyses operate against capability interfaces instead of concrete operation semantics. CodeQL separates data-flow graph representation from AST representation. Clang models dataflow as lattice propagation to a fixed point. These support the same architectural rule: derive meaning once, expose a stable capability, and let downstream consumers project it.

## Audit

Active audit remains `scripts/audit/routesync-architecture.cjs`. No build is required for this architectural gate.
