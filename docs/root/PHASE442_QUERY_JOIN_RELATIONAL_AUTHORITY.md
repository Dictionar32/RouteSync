# Phase 442 — Query Join Relational Authority

This phase moves query-join semantic dispatch from nullable/imperative descriptor handling to declarative relation records and RelationOption.

## Changes
- QueryJoinDescriptor optional indices are represented as RelationOption<number>.
- Query join catalog is immutable relational tuples, not Map authority.
- Argument lookup is relation-based.
- Query join construction returns RelationOption<QueryJoin>.
- Join constraint selection uses solveCandidate.
- Join target construction uses relational option folding.
- Named join resolvers consume RelationOption without undefined-based absence.

## Validation
- Target TypeScript transpile: 0 diagnostics.
- This phase intentionally does not claim global scanner cleanliness; queryEvidenceProducer still contains legacy authority outside the migrated join region.
