# Phase 497 — Scanner/Lexer + Resolver Relational Authority Hardening

## Objective
Advance the post-Phase-496 frontier by removing remaining host-language decision authority from scanner/resolver paths while preserving source-language spellings as lexical facts.

## External design evidence

- Tree-sitter remains an incremental concrete-syntax parser; its value is resilient incremental parsing, not semantic authority. The RouteSync boundary therefore treats parser output as evidence and moves semantic choice into relations.
- CodeQL separates AST structure from semantic data-flow nodes. RouteSync follows the same separation: lexical/AST observations become facts, while semantic resolution is performed over candidate relations.
- Souffle models analysis as typed relations and rules; egglog combines Datalog-style relations with equality saturation/rewrite closure. RouteSync uses the same separation of facts, constraints, closure, and rewrite.
- MLIR's declarative rewrite infrastructure makes pattern matching and replacement explicit as rewrite rules rather than imperative dispatch.
- Statix models static semantics as constraints over terms and scope graphs, with name resolution deferred to constraint solving. This is the model used for remaining resolver authority.
- Flix and Datafrog reinforce the fixed-point direction: recursive relation computation should converge over monotone facts rather than be encoded as host loops.
- SeaHorn demonstrates a further useful separation: source semantics can be lowered to a relation/constraint representation and discharged by a solver backend.

## Authority changes in this phase

1. `InvalidationResolver` now derives invalidation targets through relation projection/folding and explicit candidate options.
2. Controller-body error resolution now uses a typed error catalog plus relation lookup/expansion rather than switch/loop dispatch.
3. Resource semantic resolver compatibility surfaces are projected onto the upstream relational authority.
4. Resource nesting/action selection no longer uses host `slice`, `filter`, `??`, or boolean short-circuiting as semantic choice.
5. Middleware resolver selection uses relation gates/all and relational text slicing rather than host `&&`, `!`, ternary dispatch, or array `slice`.
6. Ternary/resource binding selection uses relation predicates and candidate resolution; source-language `null`, `??`, `===`, `&&`, and `||` remain lexical/semantic vocabulary data, not host dispatch operators.

## Remaining scanner/lexer frontier

`astClassifierEvidence.ts` is still the largest unresolved parser-adapter surface. Its statement grammar (`if`, `foreach`, `for`, `while`, `switch`, try/catch), optional parser returns, and several host ternary/absence expressions still need conversion to native `RelationOption` candidates and recursive grammar closure.

This is deliberately not claimed as complete. The next migration should replace the remaining parser-local optional returns with relation options and move statement production into a relation grammar catalog whose candidates are solved by the requirement engine.

## Non-negotiable invariant

PHP spellings such as `if`, `for`, `while`, `switch`, `null`, `??`, `===`, `&&`, and `||` may exist as source-language evidence. They must never be the host-language mechanism that selects semantic meaning.
