
## Phase 399 — Scanner relational authority

- Canonicalized `relationEqual` imports to `semanticRelations` across scanner/resolver/compiler modules.
- Kept relation vocabulary separate from relational sequence/fold machinery.
- Audited scanner frontier; next target is the coordinated `phpMethodParser` RelationOption migration.

## Phase 402 — Scanner Control Evidence Boundary
- Added a canonical PHP control-evidence relation boundary.
- Replaced direct source-keyword dispatch in `astClassifierEvidence.ts` with abstract control candidates and requirement solving.
- Made selected parser rewrites lazy so the solver admits a rule before applying its AST parser.
- Preserved raw source spellings only inside the lexer evidence catalog.

- Phase 403: added lazy relational rewrite candidates and migrated anonymous-class scanner dispatch from switch to solver-selected rewrite.

- Phase 406: query resolver model-static operation catalog moved to RelationOption semantic boundary; next target is named-method resolver catalog and operation dispatch.

## Phase 408 — Scanner/Resolver Relational Conjunction + String Normalization

- Added `relationAll` and `relationTrim` to the semantic relation kernel.
- Removed direct scanner `.trim()` usage.
- Migrated query resolver conjunction/equality/ternary boundaries to relational primitives.
- Preserved source-language AST vocabulary as data while removing host-language semantic control authority.

## Phase 410 — Scanner relational positional authority (2026-09-30)
- moved requirement-solver optional collection fallback into relational gating
- migrated route-binding semantic positional recursion to `relationAdvanceIndex`
- removed production `index + 123` positional authority
