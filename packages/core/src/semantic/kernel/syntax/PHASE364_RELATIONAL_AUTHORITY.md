# Phase 364 — Relational Authority Hardening

This phase tightens the semantic kernel boundary before the next scanner cutover.

## Authority rule

Source syntax is evidence. Semantic decisions are represented by relations, presence witnesses,
constraint requirements, fixed-point closure, and rewrite rules.

The parser adapter no longer uses a host-language ternary expression for evidence classification.
The distinction between EOF/absence and a concrete token is resolved through relationResolve.

The semantic atom `semantic_null` remains a tagged value where PHP null is actual source data.
It is not an absence sentinel.
