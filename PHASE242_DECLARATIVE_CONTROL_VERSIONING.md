# Phase 242 — Declarative Semantic Control-State Versioning

Control constructs remain syntax evidence only. The semantic layer now derives
control-state versions from relation facts:

- `branch(...) -> control_def(...)`
- `merge(...) + control_def(...) -> control_phi(...)`
- `fixed_point(...) + backedge(...) -> loop_header(...)`

This is inspired by LLVM MemorySSA's version/def/phi idea, but is a RouteSync
semantic overlay rather than an LLVM IR clone.

The solver remains generic. All domain meaning is encoded by relation schemas
and declarative rewrites.
