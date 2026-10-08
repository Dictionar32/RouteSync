# Phase 365 — AST Classifier / Query Producer Relational Boundary

`astClassifier.ts` and `queryProducer.ts` are now canonical semantic boundaries.

Concrete syntax extraction is quarantined in `astClassifierEvidence.ts` and
`queryEvidenceProducer.ts`; downstream semantic consumers must depend on the
relation boundary rather than treating syntax extraction as semantic authority.

The canonical boundaries contain no host control-flow, host absence sentinel,
coalescing, strict equality, or TypeScript assertion constructs. PHP source
keywords such as `if`, `for`, `while`, and `switch` remain data-level evidence
inside the evidence layer; they are not host-language control flow.
