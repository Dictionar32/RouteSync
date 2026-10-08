# Phase 250 — Unified Declarative Control Program

Phase 250 unifies syntax/evidence relations with the canonical semantic control relation program.

## Architecture

```text
parser / language evidence
        |
        v
control relations
        |
        v
unified declarative relation program
        |
        v
fixed-point relation solver
        |
        +--> choice / alternative / predicate
        +--> iteration / successor
        +--> fixed_point / backedge
        v
canonical control relations
```

The semantic layer no longer needs a dedicated procedural call that interprets a source control construct. Evidence is supplied as relations and the same generic solver derives canonical semantic facts.

## Research basis

MLIR PDLL explicitly separates pattern matching from rewrite, and PDL represents rewrite patterns as IR that can itself be verified and transformed. LLVM MemorySSA similarly introduces a semantic memory IR with Def/Use/Phi versions instead of repeatedly recovering meaning directly from instructions. These designs motivate treating RouteSync control evidence as relation data and deriving its semantic representation through a reusable rewrite engine.

## Boundary

The PHP AST adapter still recognizes parser node kinds because it is an evidence provider. That boundary is intentionally outside the semantic authority. Once emitted, the information is relation data and is processed by the generic solver.

`Map`/`Set` remain implementation indexes/materialization helpers only; they are not semantic truth.

## Phase 251 — Declarative Control Materialization

- Added `semanticControlMaterializer.ts` as the rewrite/materialization boundary after the declarative relation solver.
- Conditional, multiway, condition, iteration, and counted control are materialized only from normalized relation facts.
- Removed direct semantic normalization/materialization logic from the `if`/`while`/`foreach`/`for`/`switch` handlers; those handlers now emit evidence and delegate construction to the relation materializer.
- Added a derived `KnowledgeId` lookup index solely for resolving relation keys back to canonical typed identities; it is not semantic source-of-truth.
- Added Phase 251 regression coverage for conditional choice and counted repetition materialization.
