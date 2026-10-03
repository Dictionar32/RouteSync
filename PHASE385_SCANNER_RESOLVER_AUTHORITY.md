# Phase 385 — Scanner/Lexer + Resolver Authority

Phase 385 continues the declarative semantic migration at the two remaining high-leverage boundaries: source evidence production and semantic resolution.

## Research direction

The architecture treats Tree-sitter-style parsing as syntax transport, while the semantic authority is relation-oriented. MLIR's PDLL/DRR demonstrate declarative match/rewrite programs; Soufflé demonstrates monotone Datalog fixed points; egglog combines equality saturation with Datalog; JastAdd expresses circular fixed-point computation declaratively. These ideas are used as architectural constraints rather than copied implementations. citeturn0search0turn0search1turn0search5turn0search6

## Phase 385 changes

- Added `semantic/authority/declarativeDispatch.ts` as a shared candidate/dispatch relation primitive.
- Removed the `switch` authority from `resourceModelMethodResolverMeaning.ts`; method meaning is now a declarative semantic table.
- Began moving projection resolution behind relation-gated semantic witnesses rather than host branching.
- Added `audit-phase385-scanner-resolver.cjs` covering scanner/lexer, scanner semantic relations, core semantic plugins, CLI resolvers, and semantic generators.
- Kept source lexer/parser implementations as evidence transport only; their legacy imperative code is not treated as semantic authority.

## Target model

`source text -> token evidence -> syntax evidence relations -> semantic facts -> candidate constraints -> fixed point -> rewrite closure -> canonical projection`

The scanner must not decide domain meaning. Resolver plugins must not encode source-language control flow as the semantic model. Absence is represented through explicit relation/presence witnesses, and recursive semantic dependencies are closed through monotone fixed points.

## Migration rule

A file is considered migrated only when its semantic decision logic is expressible as facts, candidates, guards, relations, solver closure, or rewrite rules. Cosmetic substitutions such as replacing `if` with a ternary expression do not count.

## Measured frontier

The Phase 385 audit scans 179 authority files. At this checkpoint, 97 are zero-violation and 82 remain. The remaining set is intentionally visible rather than hidden behind a renamed imperative construct. The next migration should start with `SourceStream`, `arrayParser`, `astClassifierEvidence`, scanner semantic route resolvers, and the remaining CLI resolver plugins because these sit directly on the evidence-to-semantics boundary.
