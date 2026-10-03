Phase 448 scanner/resolver semantic cutover

This phase converts controllerDataflowAnalyzer from imperative statement/dataflow authority to relational projection over canonical semantic knowledge/data-flow facts. Legacy payload recovery is retained only as compatibility projection.

Design frontier:
- scanner facts are authoritative;
- legacy definitions/references are projections;
- candidate resolution uses requirementSolver;
- absence migration continues toward RelationOption rather than undefined/null sentinels;
- scannerless SDF3 and Datalog/equality-saturation research are reference architecture, not copied implementation.

Validation note: repository dependencies are absent in the extracted checkpoint, so full TypeScript validation cannot run (`node` and `vitest/globals` type definitions unavailable). Static source inspection remains available.
