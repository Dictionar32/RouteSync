
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

## Phase 1770 — PHP Function Name Source Evidence Interface First

- Replaced the prematurely canonicalized function-name syntax input with a closed lexical evidence ADT that preserves unqualified, qualified, fully-qualified, and malformed name forms.
- Resolution input now requires `syntaxEvidence`; canonical qualified identity remains an output of resolution rather than a substitute for parser evidence.
- Added `scripts/audits/phase1770-php-function-name-source-evidence.mjs` (10/10 static checks).
- Laravel scanner still uses the legacy raw-name builtin classifier; AST producer wiring and resolver implementation are explicitly outstanding.
- No TypeScript typecheck, Vitest, or full build was run.


## Phase 1772 — PHP function-call callee source evidence

- Added typed scanner AST evidence retaining every callee token for PHP function calls.
- Made the AST factory require that evidence and updated the structure projector to forward the full callee sequence instead of projecting only token zero.
- Kept the legacy short identifier explicitly as a compatibility projection pending migration of semantic consumers.
- Added `scripts/audits/phase1772-function-call-callee-source-evidence.mjs`.

## Phase 1773 — PHP function callee source-span contract (2026-10-12)

- Extended `PhpFunctionNameSourceEvidence` to carry the exact callee `SourceRange` in addition to the complete token sequence.
- Made the AST factory require the callee span and populated it from the first and final callee tokens in the structure projector.
- Added `scripts/audits/phase1773-function-callee-source-span-contract.mjs` to protect source provenance and explicitly track the still-legacy resource consumer.
- Name-resolution authority integration, full scanner consumer migration, and resource subscanner retirement remain outstanding.
- No TypeScript typecheck, Vitest, or full build was run.

## Phase 1774 — Invocation semantic judgment interface first (2026-10-12)

- Evolved the existing invocation judgment so the resolved target remains owned by the name-resolution judgment instead of being duplicated into an independently constructible `Expression`.
- Simplified invocation authority to close resolved/unresolved outcomes only; expression/AST construction is deferred to a downstream projection boundary.
- Preserved ambiguous, unresolved, and PHP namespace-fallback-deferred outcomes as explicit judgments.
- Added `scripts/audits/phase1774-invocation-semantic-judgment-interface-first.mjs`.
- Raw-name builtin classification, resolver implementation, scanner wiring, and resource subscanner retirement remain outstanding.
- No TypeScript typecheck, Vitest, or full build was run.
