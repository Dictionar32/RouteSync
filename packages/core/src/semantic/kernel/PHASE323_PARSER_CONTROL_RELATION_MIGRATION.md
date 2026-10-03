# Phase 323 — Parser Control Relation Migration

## Objective

Move parser control decisions out of imperative `if`/`for`/`while`/`switch` statements and into the existing semantic relation substrate.

## Applied migration

`astClassifier.ts` and `queryProducer.ts` were lowered with a TypeScript-AST-aware transformation for continuation-shaped guards:

```text
if (condition) return witness
continuation
```

becomes:

```text
return relationChoose(
  condition,
  () => witness,
  () => continuation,
)
```

The transformation also handles a guarded block whose final statement is a return. This is deliberately AST-based rather than a regex substitution because a naive textual replacement can change continuation semantics.

Remaining compound parser decisions were then migrated manually to relation candidates/choice expressions. Static-property owner selection now uses `solveCandidate`, and query operation alternatives use relation choice.

## Result

AST-level control construct audit:

| File | if | for | while | switch |
|---|---:|---:|---:|---:|
| `compiler/scanner/lexer/astClassifier.ts` | 0 | 0 | 0 | 0 |
| `compiler/scanner/subscanners/queryProducer.ts` | 0 | 0 | 0 | 0 |
| `compiler/scanner/lexer/routeAst/syntaxErrorRelationCore.ts` | 0 | 0 | 0 | 0 |
| `compiler/constraints/ConstraintSolver.ts` | 0 | 0 | 0 | 0 |
| `compiler/constraints/solver/constraintStep.ts` | 0 | 0 | 0 | 0 |
| `semantic/plugins/expression/ternaryHandler.ts` | 0 | 0 | 0 | 0 |

Both migrated parser files have zero TypeScript parser diagnostics.

## Important boundary

This phase removes imperative control-flow constructs from the targeted parser surfaces. It does **not** yet claim that the parser is fully free of `undefined`, `null`, strict equality, or TypeScript `as` assertions. Those are the next semantic migrations and require witness/type-relation conversion rather than lexical replacement.

## Architectural consequence

The parser now has the following control model:

```text
syntax evidence
    -> candidate relations
    -> requirements / exclusions
    -> relation choice
    -> continuation relation
    -> AST witness
```

The next step is to make absence uniformly `RelationOption<T>` and then replace type assertions with explicit relation refinements, followed by a repository-wide AST-level ban audit.
