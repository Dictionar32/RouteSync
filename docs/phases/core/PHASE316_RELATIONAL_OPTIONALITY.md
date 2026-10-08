# Phase 316 — Relational Optionality and Nullish-Syntax Elimination

Phase 316 continues the Phase 315 candidate/requirement model by removing nullish-selection syntax from the semantic execution substrate and constraint kernel.

## External design basis

- MLIR PDLL separates declarative matching, constraints, and rewrite sections; constraints are attached to semantic entities rather than encoded as an imperative dispatcher.
- Soufflé models facts as relations and constraints as rule predicates; negated/exclusion conditions are evaluated through relational rule semantics.
- Constraint Handling Rules (CHR) gives a direct model for simplification, propagation, and simpagation over a constraint store.
- egglog combines Datalog-style reasoning with equality saturation, making fixed-point relational inference and rewriting a single execution model.

## Changes

### Relational sequence substrate

Added relation-native optionality primitives:

- `RelationOption<T>` — `none | some`
- `relationFirstOption`
- `relationOptionValue`
- `relationOptionMap`
- `relationFirstOr`
- `relationMapValueOr`

`relationFirst` now uses relational optionality and returns `T | null` rather than encoding absence with an `undefined` sentinel.

### Candidate solver

`requirementSolver.ts` now evaluates candidate requirements/exclusions/dependencies through relation closure and exposes `solveCandidateOption` / `solveCandidateId` as relation options.

The legacy `solveCandidate` value API remains temporarily as a compatibility boundary for existing parser/query callers; it is the next migration target and is deliberately isolated from the new option-based substrate.

### Generic constraint solver

The following are now free of `if`, `for`, `while`, `switch`, `map`, `filter`, `reduce`, `flatMap`, `??`, and explicit `undefined` identifiers:

- `ConstraintSolver.ts`
- `UnionFind.ts`
- `solver/constraintStep.ts`

Map fallback is represented by `relationMapValueOr`; side-effect branches use relation selection with a neutral value rather than `undefined`.

### Adapter / syntax-error / ternary surfaces

The following remain free of the banned imperative constructs and nullish syntax:

- adapter `outputApplicator.ts`
- adapter `contractValidator.ts`
- adapter `cacheCoordinator.ts`
- `syntaxErrorRelationCore.ts`
- `ternaryHandler.ts`

### Parser/query surfaces

Removed implementation-level `??` from:

- `astClassifier.ts`
- `queryProducer.ts`

PHP syntax evidence such as the strings `"??"` and `"??="` is intentionally preserved because those are source-language facts that the parser must recognize.

## Remaining migration boundary

`astClassifier.ts` and `queryProducer.ts` still contain legacy `undefined`-based optional APIs and guard chains. These are not replaced with cosmetic `relationChoose` calls. The next phase must convert those APIs themselves to relation options / requirement relations and then eliminate the compatibility boundary.

The target remains:

```text
syntax evidence
  -> semantic candidates
  -> requirements / exclusions / dependencies
  -> relation constraint store
  -> propagation + simplification
  -> fixed-point closure
  -> rewrite
  -> proof-carrying semantic result
```
