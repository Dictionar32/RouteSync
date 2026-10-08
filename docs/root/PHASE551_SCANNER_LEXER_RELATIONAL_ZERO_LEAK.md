# Phase 551 — Scanner / Lexer Relational Zero-Leak Cutover

## Objective

Continue the declarative semantic cutover after Phase 550. The remaining production scanner/lexer leakage was converted to relation selection, recursive relation folds, presence/option folds, and relation gates. Source-language syntax remains evidence; the audit is TypeScript-AST based.

## Research direction

The architecture follows the useful combination of:

- Scope graphs / Statix: declarations, references, scopes, edges, resolution paths and constraint solving as a declarative name-resolution substrate.
- MLIR PDLL/PDL/DRR: pattern matching and rewrites represented declaratively and applied by a rewrite driver.
- K: structured semantic configuration transformed by rewrite rules.
- egglog: equality saturation combined with Datalog-style relational reasoning.
- Flix: relational and lattice fixed-point computation.
- Rascal: relations, algebraic data types, pattern matching, provenance and structured fixed-point computation.

RouteSync's target is not to clone any of these systems. The higher-level architecture is a semantic relation graph whose facts are closed by recursive/fixed-point solving and transformed by declarative rewrite rules. Scanner/lexer code is only the evidence extractor and canonical fact producer.

## Phase 551 changes

The scanner/resolver frontier was cut over in these areas:

- resource binding sequence construction;
- when-loaded relation argument accumulation;
- broadcast channel pattern/property resolution;
- model relation foreign-key selection;
- controller action handler selection;
- controller expression algebra dispatch;
- route request binding dispatch;
- closure/synthetic/controller-reference optional field resolution;
- request descriptor projection;
- controller producer sequence/projection;
- channel producer kind/authentication selection;
- controller action request selection;
- route scanner parameter sequence construction;
- attribute/DTO/middleware canonical scanner traversal;
- middleware method selection;
- Eloquent relation vocabulary fallback;
- model relation result traversal;
- model property semantic alternatives;
- semantic type sequence construction;
- resource resolver lattice join selection;
- route semantic flow construction;
- route controller identity selection;
- upstream manifest completeness selection;
- model scanner traversal;
- PHP syntax-evidence absence contracts;
- semantic behavior constraint selection.

## Audit

Production scanner TypeScript files scanned: **388**.

AST-level host semantic/control leakage after Phase 551:

- `if`: 0
- `for`: 0
- `while`: 0
- `switch`: 0
- ternary: 0
- `map`: 0
- `filter`: 0
- `reduce`: 0
- `reduceRight`: 0
- `flatMap`: 0
- `undefined`: 0
- `??`: 0
- `===`: 0
- `!==`: 0
- `||`: 0
- `&&`: 0
- `trim`: 0
- `slice`: 0
- `never`: 0

The scanner production surface therefore has no occurrences of the banned host constructs under the AST audit. Test sources are intentionally excluded from this semantic-production audit.

All 493 scanner TypeScript files pass TypeScript transpilation with **0 diagnostics**.

## Resolver check

The 19 production files under `packages/core/src/compiler/scanner/resolvers` were separately AST-audited. The same banned-host construct set is **0** there.

## Architectural consequence

The scanner/lexer and scanner resolver boundary is now a relation-only semantic surface. Remaining work should move upward/downstream rather than re-opening scanner control flow:

1. unify the relation solver with scope/declaration/reference resolution;
2. make resolution witnesses/provenance first-class closure facts;
3. expose declarative rewrite rules for semantic normalization;
4. audit non-scanner compiler layers that still contain imperative machinery, especially analysis/lowering/generator code, without confusing target-language syntax with host-language control.
