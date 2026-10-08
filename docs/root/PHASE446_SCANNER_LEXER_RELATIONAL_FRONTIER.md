# Phase 446 — Scanner/Lexer + Resolver Relational Frontier

## Objective
Continue the declarative cutover beyond parser adapters: scanner/lexer and remaining resolvers must expose semantic relations and solver/rewrite boundaries rather than imperative control-flow authority.

## Architecture decision
The scanner frontier is split into four relation layers:

1. **Lexical facts** — character/token observations are facts, not dispatch branches.
2. **Candidate relations** — token/AST interpretations are generated as competing candidates.
3. **Constraint solving** — requirements select admissible candidates.
4. **Rewrite/fixed-point closure** — nested expressions, captures, paths and resolver dependencies are closed recursively until stable.

Absence is represented by explicit algebraic option relations at the new boundary. Legacy producers remain compatibility sources until their callers are migrated; they are not treated as the new semantic authority.

## Evidence from external systems
- egglog unifies Datalog-style fixed-point reasoning with equality saturation, rewriting, congruence closure and extraction.
- Flix provides first-class fixpoint computation over relations and lattices.
- Soufflé models computation as typed relations with rule-oriented execution.
- Scannerless SDF-style approaches model lexical/context-free syntax declaratively instead of relying on a separate imperative lexer.

## Phase 446 frontier
The next authority migration is ordered:

1. `scanner/lexer/astClassifierEvidence.ts`
2. `scanner/subscanners/queryEvidenceProducer.ts`
3. `scanner/lexer/controllerDataflowAnalyzer.ts`
4. `scanner/subscanners/RouteScanner.ts`
5. remaining `scanner/subscanners/*Resolver.ts`
6. CLI/domain resolvers that still consume sentinel-based scanner output

## Non-negotiable rule
Do not hide forbidden control flow behind helper names. A replacement is considered successful only when semantic choice is represented by relation facts, candidate requirements, rewrite rules, or fixed-point closure.

## Forbidden host-authority surface
`if`, `for`, `while`, `switch`, `map`, `filter`, `reduce`, `flatMap`, `undefined`, `??`, `null`, `===`, `as unknown`, `||`, `&&`, `trim`, and `slice` must not be used as semantic control authority in the migrated scanner/resolver boundary. Source-language spellings such as PHP `===`, `&&`, `||`, `null` are retained only as lexical data.
