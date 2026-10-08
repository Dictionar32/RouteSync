# Phase 369 — Relational Construct Cutover

The semantic kernel now treats unknown as an explicit tagged semantic relation rather than a TypeScript escape hatch.

## Authority rule

Host-language branching, host absence sentinels, host equality operators, and TypeScript assertion syntax are not semantic authority.

The canonical path is:

`evidence -> facts -> requirements/exclusions -> solver -> rewrite -> fixed point -> semantic IR`

## Evidence boundary

`astClassifierEvidence.ts` and `queryEvidenceProducer.ts` remain syntax-evidence adapters. They are not allowed to become semantic authorities. Their outputs are lifted through `semanticEvidenceRelations.ts` before consumption by canonical semantic layers.

## Construct vocabulary

- conditional
- iteration
- selection
- projection
- aggregation
- expansion
- absence
- fallback
- equality
- inequality
- refinement
- unknown

PHP source tokens such as `if`, `for`, `while`, `switch`, and `null` remain data-level syntax evidence. They are not host control flow or host absence values.
