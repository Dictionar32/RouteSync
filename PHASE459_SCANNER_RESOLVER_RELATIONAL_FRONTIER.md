# Phase 459 — Scanner/Resolver Relational Frontier

Baseline: Phase 456.

Research direction: lexical productions from SDF3, declarative match/constraint/rewrite separation from MLIR PDLL/PDL, and Datalog + equality saturation from egglog.

Frontier measured in scanner production code remains concentrated in queryEvidenceProducer and astClassifierEvidence, followed by resource/controller/provider canonicalization. This checkpoint deliberately does not perform regex-based replacement of source-language vocabulary: PHP tokens such as `null`, `??`, `&&`, `||`, and `===` remain valid lexical/AST data. The next cutover must move their host-language control authority to typed Option/Candidate/Constraint relations and a fixed-point solver.

No false claim of full eradication is made in this phase.
