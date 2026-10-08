# Phase 245 — Canonical Declarative Control Relations

The semantic engine now normalizes intermediate control relations into a
source-construct-neutral control relation layer before control versioning.

```text
choice / alternative / iteration / successor
                    |
                    v
          declarative relation solver
                    |
        +-----------+-----------+
        |                       |
        v                       v
control_transition       control_cycle
        |                       |
        +-----------+-----------+
                    v
          semantic control state
        control_def / control_phi
             / loop_header
```

`if`, `switch`, `while`, and `for` are evidence-level constructs only. The
versioning layer consumes `control_transition`, `control_join`, and
`control_cycle`, not source-language constructs or their intermediate names.

The new relations are produced only by declarative rewrites:

- `control_edge -> control_transition`
- `fixed_point + loop_edge -> control_cycle`

The relation solver remains the generic execution mechanism: indexing, delta
agenda, joins, derivation provenance, and fixed-point saturation are mechanics;
semantic meaning is defined by the relation catalog.
