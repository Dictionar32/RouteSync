# Phase 305 — Core-Wide Declarative Relational Eradication

## Objective

Raise the RouteSync semantic/compiler core from a routeAst-only declarative
boundary to a **core-wide relational authority boundary**.

The target is not to cosmetically replace `if` with a helper. The target is:

```text
PHP / Laravel syntax
      |
      v
syntax evidence
      |
      v
Typed syntax relations
      |
      v
semantic relation program
      |
      +--> constraints
      +--> dependencies
      +--> candidates
      +--> guards / requirements / exclusions
      +--> transitions / joins / recurrence / backedges
      |
      v
constraint handling
      |
      +--> propagation
      +--> simplification
      +--> simpagation
      |
      v
rewrite / closure / fixed point
      |
      v
proof-carrying semantic artifact
      |
      v
lowering / emission
```

`if`, `for`, `while`, `switch`, `.map()`, `.filter()`, `.reduce()`, and
`.flatMap()` are not semantic primitives. PHP constructs with those names remain
syntax evidence only.

## Research basis

The design combines several complementary ideas rather than treating one tool
as the authority:

- CodeQL models extracted program information as relations and evaluates a
  Datalog-derived query language over those relations.
- Flix provides relation and lattice fixpoints and first-class constraints.
- MLIR PDL/PDLL makes pattern matching and rewrites declarative artifacts.
- egg/egglog demonstrates equality saturation coupled with rewrite rules and
  relational reasoning.
- K and rewriting logic provide executable rule-based semantics.
- Statix/Spoofax demonstrate typed constraints and declarative static semantics.
- WebAssembly's specification is especially relevant: validation is stated as
  declarative constraints, while an implementation algorithm is derived from
  those rules.
- CompCert/Alive2 are verification/refinement references rather than the
  semantic authority of RouteSync.

## Verified current state

A TypeScript compiler-API audit was run over `packages/core/src`, so comments and
string literals do not create false positives.

### Before Phase 305 edits

- source files scanned: **1,365**
- files containing banned AST/call constructs: **593**
- banned statement/conditional nodes: **4,377**
- banned collection calls: **1,064**

### Current Phase 305 audit

- source files scanned: **1,366**
- files containing banned AST/call constructs: **581**
- banned statement/conditional nodes: **4,321**
- banned collection calls: **1,021**

The reduction is deliberately small because this phase does not perform a
blind repository-wide destructive truncation. It replaces active parser/fact
adapters and the conditional binder while preserving their public contracts.

A second production-only audit excluding tests and archived sources currently
reports:

- source files: **1,096**
- files with banned constructs: **500**
- banned statement/conditional nodes: **4,125**
- banned collection calls: **832**

This is the remaining migration surface, not a claim of completion.

## Changes in this phase

### 1. Conditional/ternary binder

`compiler/scanner/binders/resource/composite/literalTernaryBinders.ts`

The binder no longer uses host-language conditional expressions or an `if`.
Operator/type selection is represented by immutable catalogs and relation-style
case selection. PHP ternary and short-ternary remain syntax evidence and are
bound into the existing semantic relation model.

### 2. Route-resource adapters

The descriptor/upstream/semantic route-resource adapters now use:

- immutable dispatch catalogs for resource method and middleware scope;
- relation projection for collection conversion;
- explicit presence ADTs instead of branch-based optional handling.

### 3. Route-binding adapters

The descriptor/upstream/semantic route-binding adapters now use relation
projection and recursive relation traversal rather than `for`, `if`, and
conditional expressions.

### 4. Generic solver boundary

The Phase 303 solver, rewrite engine, syntax-error relation core and route
boundary adapter were re-audited. They already satisfy the structural rule for
the forbidden constructs in their production implementations.

## Why files are not blindly emptied

An active file that still contains legacy constructs is not automatically an
unused file. Some are exported through `packages/core/src/index.ts`, some are
compiler pipeline dependencies, and some are compatibility surfaces.

Truncating all matching files would remove public types and dependency edges
rather than perform semantic migration. Therefore Phase 305 treats an active
file as replaceable only after its semantic contract has a relation-native
replacement. A legacy file that is genuinely unreachable can then be emptied
or removed safely.

## Enforcement

The executable audit is:

```text
scripts/audit-core-declarative.cjs
```

It uses the TypeScript compiler API and checks the AST for:

- `IfStatement`
- `ForStatement`
- `ForInStatement`
- `ForOfStatement`
- `WhileStatement`
- `DoStatement`
- `SwitchStatement`
- `ConditionalExpression`
- calls to `.map()`, `.filter()`, `.reduce()`, `.flatMap()`

The audit is intentionally stronger than grep and can distinguish source
syntax from comments/strings.

## Next migration strata

The remaining core should be migrated in this order:

1. parser/lexer adapters and syntax classifiers;
2. scanner/subscanner producers;
3. semantic resolver plugins;
4. `types/domain` semantic collections and resolvers;
5. IR/graph/routing semantic projections;
6. legacy `compiler.ts` / v6 compatibility surface;
7. non-semantic client/runtime code only if the same prohibition is intended
   for runtime implementation code.

The semantic layers should be migrated before deleting their old files so that
relation contracts, imports, and generated artifacts remain coherent.


## Phase 305 continuation — relational sequence substrate

The next stratum adds `semantic/kernel/relationalSequence.ts` as the execution
substrate for semantic selection/projection/fold/first. It is used by the
semantic expression/method resolver catalogs, verified model graph projection,
and graph-node index/graph assembly. The point is not to hide ordinary control
flow in a generic helper: these operations are relation algebra primitives and
are the only execution boundary for those projections.

External design references reinforce this split. CodeQL defines QL over named
relations with Datalog-derived semantics; Soufflé defines relations as sets of
tuples; MLIR PDL/PDLL makes matching and rewriting declarative; egglog combines
equality saturation with Datalog; K uses rewrite rules as executable semantics;
and WebAssembly explicitly specifies validation as declarative constraints with
an implementation algorithm derived from them.
