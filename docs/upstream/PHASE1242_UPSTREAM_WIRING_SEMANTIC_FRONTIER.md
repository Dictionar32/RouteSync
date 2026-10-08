# Phase 1242 — Upstream Wiring Semantic Frontier

## Canonical audit

The active architecture gate is `scripts/audit/routesync-architecture.cjs`.
`scripts/audits/` remains historical/specialized evidence and is not the active audit lane.

## Canonical boundary

```text
Laravel evidence
  -> semantic reasoning algebra
  -> proof / derivation / provenance / closure
  -> closed semantic capability/dataflow contract
  -> UpstreamWiringInterface
  -> manifest / graph / IR / CLI projection
```

## Trace conclusion

- `SemanticReasoningAlgebraInterface` is the reasoning mechanism.
- `SemanticReasoningContractInterface` is the proof-carrying closed reasoning result.
- `SemanticCapabilityAlgebraInterface` and `SemanticDataflowAlgebraInterface` carry upstream authority.
- Capability/dataflow contracts are consumed through directional wiring.
- Manifest is seed transport; graph and IR are downstream projections.
- CLI route CRUD decisions consume `crudRole`/`actionKind` from the closed route capability.
- `ResourceModelResolver` remains upstream semantic reasoning; CLI does not invoke it.
- `MswGenerator` uses HTTP method only as transport lowering, not as semantic classification.

## Remaining frontier

`resolveItemPrimaryKeyType()` still performs a limited downstream lookup by matching `titleName` against model names and then reading `model.semantic.key.semanticType`.

This is not a CRUD classifier, but it is still a semantic reconstruction boundary. The correct next elevation is **not another generic interface**. The preferred shape is:

```text
Resource/model association evidence
        -> upstream resource-model capability
        -> model-key semantic contract
        -> UpstreamWiringInterface
        -> ResourceGroup primaryKeyType projection
```

The migration should preserve the existing model key contract and eliminate name-based matching from the downstream builder once an authoritative resource-model identity is available upstream.

## External alignment

- MLIR interfaces decouple analyses/transforms from concrete operation semantics and support interface inheritance.
- CodeQL separates AST representation from its data-flow graph and performs local/global flow reasoning over that graph.
- Clang dataflow propagates facts through CFG edges to a fixed point using lattice/join reasoning.
- Laravel route model binding is semantic source evidence connecting route parameters to model types.
- TypeScript 7 preserves compiler semantics while replacing the implementation foundation with a native Go compiler, reinforcing stable semantic contracts across implementation changes.
