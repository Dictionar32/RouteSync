# Phase 297 — Executable Declarative Relational IR

Phase 297 moves RouteSync's semantic execution boundary one level above rewrite declarations.

## Architecture

```text
PHP syntax
  -> syntax/evidence boundary
  -> neutral semantic relations
  -> declarative relation schemas/constraints/rules
  -> executable relational IR (execution plans)
  -> indexed relation store
  -> delta-driven fixed point
  -> proof/provenance closure
  -> target lowering
```

## Key change

`semanticRelationalExecutionPlan.ts` is now an executable relational IR. A rewrite declaration is compiled into a closed plan containing:

- a positive anchor;
- `scan` / `join` / `anti-join` premise steps;
- `emit` head steps;
- the original typed relation patterns required for execution;
- rule identity and priority.

The semantic solver consumes the compiled plans. It no longer reconstructs executable rules from plan metadata.

Negative-leading declarations are normalized around a positive anchor before execution. This prevents a negative relation from becoming the entry point for binding discovery.

## Solver authority

The solver pipeline is:

```text
rewrite declarations
      |
      v
compileSemanticRelationExecutionPlans
      |
      v
SemanticRelationExecutionPlan[]
      |
      +--> indexed anchor lookup
      +--> relational pattern matching
      +--> anti-join constraints
      +--> delta agenda
      +--> fixed point
      |
      v
semantic derivations
```

The plan is the executable semantic representation; the source-language syntax is not inspected by this layer.

## Forbidden execution vocabulary audit

Canonical semantic production and the parser semantic adapter were audited for:

- `if`
- `for`
- `while`
- `switch`
- `map`
- `filter`
- `reduce`
- `flatMap`

Result: **0 lexical execution hits**.

Legacy semantic ontology was also audited:

- `SemanticChoice`
- `SemanticRepetition`
- `controlRelations`
- `semanticControl`
- `semanticRuleEngine`
- `statementKnowledge`

Result: **0 hits** in the audited semantic authority surface.

Concrete PHP grammar remains confined to the syntax/evidence boundary. The semantic manifest describes that boundary without making concrete parser constructs part of the semantic execution vocabulary.

## Validation

- `PHASE297-TSC-PASS`
- `PHASE297-PLAN-SMOKE-PASS`
- `PHASE297-BANNED-AUDIT-PASS`
- `BANNED_HITS 0`
- `LEGACY_HITS 0`

The smoke verifies both positive relational closure and a negative relational premise:

```text
precedes(a,b)
precedes(b,c)
    -> reaches(a,c)

candidate(x)
not blocked(x)
    -> permits(x)
```

## Research basis

The architecture is informed by relational and declarative systems including Differential Dataflow, Souffle/Datalog, Datafrog, Ascent, Eqlog, egglog, and MLIR's declarative pattern/rewrite infrastructure. These systems reinforce the separation between declarative relations/rules and the execution substrate. MLIR documents declarative rewrite patterns and a high-level pattern IR; egglog combines equality saturation with Datalog; Differential Dataflow provides incremental iterative declarative computation.
