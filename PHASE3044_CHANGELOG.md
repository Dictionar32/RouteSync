# Phase 3044 changelog

- Added closed `SemanticModRefFact` source-backed effect ADT to upstream semantic knowledge.
- Added interface-backed `semanticModRefFactFactory` and simplified mod/ref operations to consume already classified effect facts.
- Wired assignment, invocation, access, and unset effect evidence at PHP semantic fact construction sites.
- Added `modRefFacts` to the canonical semantic knowledge model and updated typed fixtures.
- Updated the object identity mod/ref consumer to consume the canonical effect projection rather than reclassify `SemanticFact`.
- Added Phase 3044 static audit and runtime trace documentation.
- Did not restore deleted relation foundation modules; retained `collections.ts` one-newline invariant.
