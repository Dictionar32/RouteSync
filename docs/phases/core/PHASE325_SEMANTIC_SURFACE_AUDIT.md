# Phase 325 — Semantic Surface Audit and Migration Queue

Date: 2026-09-30

## Purpose

Make the banned-construct migration measurable at TypeScript AST level. This phase does not claim repository-wide elimination. It extends `tools/audit-semantic-bans.cjs` to report parse diagnostics, total source-file count, per-file counts, nullish-coalescing operators, and optional-chain property access, then records the current baseline and the next migration order.

## Current baseline

Command:

```sh
node tools/audit-semantic-bans.cjs packages/core/src
```

The current scan covers 1,369 `.ts`/`.tsx` files and reports zero TypeScript parse diagnostics. Counts include tests under `packages/core/src`, so they are a repository-surface baseline rather than a production-only metric.

| Construct | AST occurrences |
|---|---:|
| `if` statements | 1,764 |
| `for` / `for..in` / `for..of` | 434 |
| `while` / `do..while` | 92 |
| `switch` statements | 198 |
| `.map()` | 732 |
| `.filter()` | 156 |
| `.reduce()` | 16 |
| `.flatMap()` | 60 |
| `undefined` identifier | 1,139 |
| `null` literal | 161 |
| `??` | 301 |
| optional-chain property access | 544 |
| `===` / `!==` | 3,670 |
| TypeScript `as` assertions | 2,236 |

## Highest-priority semantic files

1. `compiler/scanner/subscanners/queryProducer.ts`
2. `compiler/scanner/lexer/astClassifier.ts`
3. `compiler/scanner/subscanners/providerAstCanonical.ts`
4. `compiler/scanner/subscanners/controller/controllerAstCanonical.ts`
5. `compiler/scanner/lexer/controllerMethodParser.ts`
6. `compiler/scanner/subscanners/migrationProducer.ts`
7. `compiler/scanner/subscanners/resource/resourceFieldProducer.ts`
8. `compiler/scanner/subscanners/resourceProducer.ts`
9. `compiler/scanner/binders/resource/resourceBinder.ts`
10. `compiler/scanner/subscanners/ResourceScanner.ts`

## Migration policy

Do not perform token replacement or blanket codemods. Each migration must preserve the original parser's continuation and error behavior, and must be validated with parser diagnostics plus relevant tests.

- Absence: replace nullable/sentinel APIs with explicit `RelationOption<T>` witnesses and exhaustive eliminators.
- Narrowing: replace `as` assertions with relation refinement that produces a typed witness.
- Equality: centralize semantic equality in relation predicates, while retaining identity/equality distinctions where required.
- Branching: encode semantic alternatives as candidate relations and constraints; do not hide imperative branching inside renamed helpers.
- Collections: replace collection methods with relation operators only when order, multiplicity, short-circuiting, and side effects are preserved.
- Recursion: use fixed-point closure only for monotone or otherwise proven convergent rules; bounded termination must be reported as non-convergence, not success.
- Rewrite: separate match constraints from rewrite production and preserve provenance for each derived fact.

## Research mapping

- MLIR PDLL/PDL: explicit match and rewrite phases, with patterns represented as transformable IR.
- Statix/Spoofax: static semantics as constraints and name resolution through scope graphs.
- Datalog/fixed-point systems: relational facts and recursive rules are appropriate for reachability, dependencies, and monotone closure.
- Equality saturation: retain equivalent semantic forms until a separately specified extraction policy chooses a target representation.

These are architectural references, not evidence that RouteSync is equivalent to those systems or formally verified.
