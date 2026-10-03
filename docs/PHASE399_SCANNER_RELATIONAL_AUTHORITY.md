# Phase 399 — Scanner Relational Authority

Phase 399 continues the scanner/lexer/resolver migration from Phase 398.

## Research basis

The architecture is aligned with declarative pattern/rewrite systems: MLIR PDLL separates matching from rewriting; MLIR PDL represents patterns as IR; Soufflé makes relations and Horn rules the semantic unit; egglog combines equality saturation with Datalog. These systems motivate keeping syntax adapters as evidence producers and moving semantic decisions into relations, constraints, fixed-point closure, and rewrite rules.

## Changes

- Normalized `relationEqual` imports to the canonical `semanticRelations` vocabulary.
- Removed the accidental split-brain where resolver/scanner modules imported the equality relation from `relationalSequence` even though its semantic authority is `semanticRelations`.
- Preserved `relationalSequence` as the sequence/fold/query execution layer and `semanticRelations` as the relation vocabulary layer.
- Continued scanner authority audit with `astClassifierEvidence.ts` and `phpMethodParser.ts` as the next migration frontier.

## Boundary

This phase does not claim that all scanner host-language control flow is eliminated. The remaining high-count frontier is intentionally left intact rather than replaced with a regex codemod that would damage parser contracts. The next coordinated migration is the `phpMethodParser` RelationOption contract and its seven callers.
