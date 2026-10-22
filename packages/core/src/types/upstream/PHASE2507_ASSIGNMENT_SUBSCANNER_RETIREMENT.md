# Phase2507 — Assignment Subscanner Retirement

## Goal

Retire the assignment-specific subscanner instead of continuing to evolve a component under `compiler/scanner/subscanners`, which is scheduled for removal.

## Trace and root cause

`compiler/semantic/sourceAstSemanticProducer.ts` was the active consumer of `compiler/scanner/subscanners/assignmentProducer.ts`. The latter owned a local `AssignmentProducer` interface and constructed the upstream `AssignmentAst`, while the enclosing source-AST semantic producer already owns the upstream `SourceAstSemanticProducerInterface` and returns assignments as part of its closed `SourceAstSemanticProducts` contract.

That split made an implementation inside the retiring subscanner the owner of a transformation that belongs to the existing source-AST semantic production boundary.

## Change

- Integrated assignment AST construction into the existing `sourceAstSemanticProducer` implementation.
- Reused the existing assignment target/operator/reference mappings and canonical `expressionFromPhpAst` operation.
- Preserved the existing `SourceAstSemanticProducerInterface`; no duplicate assignment-producer interface was introduced.
- Deleted `scanner/subscanners/assignmentProducer.ts` after rewiring its only production consumer.
- Added a structural audit for the retired file, consumer wiring, and existing upstream interface.

## Verification boundary

This phase retires one assignment-specific subscanner. It does **not** claim that all `subscanners`, `semantic/relations`, or `semantic/foundation` dependencies are removed. The broader source-AST semantic producer still imports `semantic/relations`; a full dependency-graph closure, project typecheck, build, tests, and CLI end-to-end run remain outstanding.
