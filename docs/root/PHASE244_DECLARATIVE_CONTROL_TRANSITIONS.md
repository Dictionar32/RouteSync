# Phase 244 — Declarative Control Transition Normalization

RouteSync's semantic control model now has a canonical transition layer between
control algebra (`branch`, `merge`, `backedge`) and state versioning.

```text
choice / iteration evidence
        ↓
branch / merge / backedge
        ↓ declarative rewrites
control_edge / control_join / loop_edge
        ↓
control_def / control_phi / loop_header
```

The source constructs `if`, `switch`, `while`, and `for` are not semantic
entities in this layer. They are evidence that gets projected into relations.

## Rewrites

- `branch(C,K,O,P,T) -> control_edge(C,O,T,P)`
- `merge(C,L,R) -> control_join(C,L,R)`
- `backedge(B,I) -> loop_edge(B,I)`

The versioning layer consumes only canonical transition relations.

This keeps the solver generic: matching, indexing, agenda processing and
fixed-point saturation remain mechanics; control meaning is represented by the
relation program.

## Research basis

The design follows the separation used by MLIR declarative pattern rewriting,
where matching and rewriting are represented declaratively, and the generic
rewriter applies the patterns. It also borrows the idea of versioned state and
phi-like joins from LLVM MemorySSA, without importing LLVM's memory ontology.
