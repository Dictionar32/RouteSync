# Phase 550 — Scanner / Resolver Relational Frontier

## Direction

The scanner/resolver layer is being moved from host-language semantic dispatch toward a higher semantic substrate:

- semantic relations as the authority for equality, presence, selection, projection and folding;
- recursive relation closure instead of host `for` / `if` / `switch` dispatch;
- relation rewrite/candidate selection for semantic alternatives;
- fixed-point/recursive relation primitives remain centralized in the semantic kernel;
- source-language syntax remains evidence: PHP `if`, `switch`, `&&`, `||`, `===`, `??`, `null`, etc. are preserved as AST/token vocabulary rather than used as TypeScript semantic control.

## Research-derived architectural basis

The direction follows the stronger parts of scope-graph/constraint and declarative rewrite systems: name-resolution facts are represented as scopes, edges and declarations and solved through constraints; pattern matching and rewrites are represented declaratively rather than as handwritten semantic dispatch; executable semantics are expressed as rewrite rules over structured configurations.

## Phase 550 changes

Migrated scanner/resolver semantic machinery in these areas:

- relation factory cardinality/shape selection;
- HTTP error descriptor defaults;
- broadcast-channel descriptor defaults;
- model-column descriptor type/nullability selection;
- form-field presence/default selection;
- attribute producer constructor/type selection;
- DTO producer type/sequence construction;
- controller scanner collection/action processing;
- migration AST method/file traversal;
- semantic derivation context construction and model indexing;
- expression AST surface classification;
- model-column cast correlation;
- query evidence non-equality predicates;
- request producer boolean/path selection;
- route middleware applicability/authorization knowledge;
- resource invocation presence checks;
- response-property traversal/type rejection handling;
- controller action contract optional-presence handling (`void 0` removed).

A new `relationFoldRight` primitive was added to the semantic relation sequence kernel so scanner sequence construction no longer needs `reduceRight`.

## Audit

Phase 550 scans all non-test TypeScript files under `packages/core/src/compiler/scanner` with TypeScript AST inspection. It detects host semantic/control leakage rather than string-grep false positives.

Current result:

- scanner source files scanned: **388**
- host semantic/control leaks remaining: **76**
- leaking files: **34**
- TypeScript transpile diagnostics: **0**

The remaining 76 are the next scanner/resolver frontier, concentrated in route factories/declarations, AST canonicalizers, channel/model/controller producers, resource binders, and a small number of lexer/model-vocabulary files.

`null` occurrences that are part of the PHP AST/semantic value vocabulary are reported separately and are not treated as host-control leakage; PHP `null` must remain representable as source evidence.

## Validation limitation

A full project `tsc --noEmit` could not be executed in this workspace because the checkout has no installed `node_modules` and the configured `node` / `vitest` type definitions are unavailable. All 388 scanner TypeScript files were nevertheless passed through TypeScript transpilation with zero diagnostics.
