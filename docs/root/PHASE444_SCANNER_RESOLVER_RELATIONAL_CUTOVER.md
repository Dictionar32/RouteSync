# Phase 444 — Scanner/Resolver Relation Authority Cutover

## Objective

Close the remaining scanner/lexer and resolver control-flow leaks identified after
Phase 443. Source-language operators remain lexical data; host-language branching
used to interpret that data is moved into relation catalogs, relation gates,
recursive closure, and ADT-style presence.

## Cutover

### Scanner / lexer

- `packages/core/src/compiler/scanner/lexer/tokenizer.ts`
  - removed the imperative `while` + `switch` scanner driver;
  - introduced a declarative lexical rule catalog;
  - dispatch is `relationFirstOption` + relation selection;
  - traversal is recursive relation closure;
  - EOF is an explicit lexical fact.
- `packages/core/src/compiler/scanner/lexer/SourceStream.ts`
  - comment/string traversal remains recursive;
  - conjunction/disjunction selection is expressed with `relationAll`/`relationAny`;
  - direct `.slice()` authority is delegated to `relationTextSlice`.
- `packages/core/src/compiler/scanner/lexer/tokenize/characterPredicates.ts`
  - character classification is relation-based;
  - keyword resolution uses a tuple catalog rather than object-membership branching.
- `packages/core/src/compiler/scanner/lexer/tokenize/compoundScanners.ts`
  - transition dispatch uses relation predicates;
  - direct operator lookup is a relational catalog;
  - lexical `&&` and `||` remain immutable source-token vocabulary, not host control flow.

### Resolver

- `packages/core/src/compiler/scanner/resolvers/RouteSecurityResolver.ts`
  - middleware classification is catalog/fold driven;
  - policy expansion uses relation projection;
  - rate-limit absence is an ADT (`{ kind: 'none' }`) instead of `null`;
  - no host `if/for/while/switch/map/filter/reduce/flatMap/??/undefined/===/||/&&`
    remains in the resolver.
- `packages/core/src/compiler/scanner/resolvers/boundary/capabilityResolution.ts`
  - optional boundary evidence is resolved through relation gates;
  - content type, payload, errors, hook kind and execution signature are relation-selected;
  - schema validation/file-rule detection uses relational projection.

## Result

The Phase 385 scanner/resolver audit, rerun after this cutover, reports:

- `while`: 0
- `reduce`: 0
- `flatMap`: 0
- `undefined`: 0
- `nullish`: 11
- `strictEquality`: 315
- `if`: 180
- `for`: 26
- `switch`: 10

These are whole-root residual counts, not claims that the entire repository is
already construct-free. Remaining authority is concentrated in legacy parser/
resolver families and should be migrated by the same relation-program boundary.

## Architectural direction

The scanner is now treated as an evidence relation producer rather than a
semantic decision engine. This is aligned with scannerless/declarative syntax
systems such as SDF3, where lexical and context-free syntax can be defined in a
single declarative formalism, and with relational fixed-point/equality-rewriting
systems such as Flix and egglog.

The next migration target should be the remaining `controller*Parser`,
`controllerDataflowAnalyzer`, `phpAstAlgebra`, and CLI resolver families. Do
not reintroduce host branching while closing those boundaries.
