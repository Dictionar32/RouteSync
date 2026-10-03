# Phase 318 — Relational Witness Solver

## Objective

Raise semantic absence, candidate selection, equality and bound resolution from
language-level sentinels into explicit relations.

## Changes

- `relationalSequence.ts`
  - `RelationOption<T>` is the canonical presence relation.
  - `relationFirst()` returns a witness relation.
  - `relationChoose()` dispatches through relation selection.
  - map lookup is expressed as relation lookup rather than casts/sentinels.
- `requirementSolver.ts`
  - candidate solving returns `RelationOption<T>`.
  - requirement/exclusion/dependency evaluation remains recursive closure.
- `ConstraintSolver.ts`
  - constraint variables are projected through relation witnesses.
  - environment resolution consumes typed witnesses.
- `TypeEnvironment.ts`
  - variable resolution returns `RelationOption<SemanticType>`.
- `variableResolver.ts`
  - joins return typed witnesses.
- `constraintStep.ts`
  - property/equality/subtype/type constraints are rule-catalog entries.
  - no null/undefined/as/strict equality constructs on the semantic surface.
- `contractValidator.ts`
  - pass contract equality and dependency validation are relation folds.
- `typeMapper.ts`
  - SQL/cast mapping is a relation catalog with witness results.
- `ternaryHandler.ts`
  - branch and nullability selection use candidate/requirement relations.
- `SemanticResolutionKernel.ts`
  - plugin selection consumes a relation witness.
- audit roots now include parser/query and canonical relation engines.

## External architecture research

The design was cross-checked against declarative relational and rewrite systems
outside the previously surveyed set:

- Formulog: Datalog + SMT-oriented logical/functional reasoning.
- Scallop: relational Datalog with provenance semantics.
- Ruler / Enumo: equality-saturation-based rewrite-rule inference.
- Nemo/Datalog material: explicit fact/rule/fixpoint execution model.

The most useful additional idea is **rule synthesis over an equality-saturated
term space**: RouteSync can eventually infer or minimize semantic rewrites instead
of accumulating hand-written imperative dispatch rules.

## Audit frontier

The expanded audit intentionally reports the remaining legacy surfaces instead
of treating helper indirection as compliance. Current frontier:

1. `astClassifier.ts`
2. `queryProducer.ts`
3. `semanticRelationSolver.ts`
4. `semanticRewriteEngine.ts`
5. `semanticClosureEngine.ts`
6. `frameworkRuleSelection.ts`

These are the next migration targets. PHP semantic data such as a source-level
null value must eventually be represented by a tagged semantic atom rather than
JavaScript `null`, so the ban does not accidentally erase PHP meaning.
