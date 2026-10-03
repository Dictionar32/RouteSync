# Phase 649 — Scanner Character Relations + Graph Constraint Witnesses

## Scope

Phase 649 continues the declarative semantic cutover after Phase 648. The target is the remaining scanner/lexer and graph-resolver frontier, while preserving PHP/Laravel syntax as source evidence rather than treating it as TypeScript semantic authority.

## Changes

### 1. Scanner character classification

`packages/core/src/compiler/scanner/lexer/tokenize/characterPredicates.ts`

- Replaced numeric `charCodeAt` range comparisons with explicit lexical character relations.
- Digit and identifier-start membership are now expressed through the shared `relationTextCharIn` relation primitive.
- Identifier continuation remains a relation composition over identifier-start, digit, and `$` evidence.
- PHP lexical vocabulary such as `null` remains intentionally preserved as source-language evidence.

### 2. Scanner dispatch frontier

`packages/core/src/compiler/scanner/lexer/tokenizer.ts`

- Removed the unconditional terminal predicate from the lexical rule catalog.
- Unknown/unclassified lexical evidence now reaches the relational fallback of `selectAction` after the explicit rule catalog is exhausted.
- Recursive scan closure remains the execution mechanism; semantic dispatch is selected through relation witnesses.

### 3. Resource graph resolver

`packages/core/src/semantic/plugins/ResourceGraphResolver.ts`

- Replaced rule-local boolean evidence predicates with a declarative `ResourceConstraint` catalog.
- Rules are now tuples of semantic identity, cardinality, description, and constraints.
- Rule satisfaction is computed through relation constraints and `relationEvery`.
- A `ResourceRuleWitness` carries the selected rule and its constraint provenance into resolution.
- The resolver remains a relation selection surface rather than owning semantic branching.

## Unused-file vacuum audit

A conservative production TypeScript basename-reference scan was run across `packages/`, excluding tests and the file itself. No additional non-empty production file was proven unused in this phase.

Therefore no file was truncated in Phase 649. The standing policy remains: when a file is proven unused, preserve its path and truncate its contents to zero bytes; never delete the file merely because it is legacy-looking.

## Authority boundary

The following source vocabulary remains legitimate evidence and is not treated as host-language semantic authority:

- PHP token `NULL` / source `null`.
- PHP constructs represented in AST/upstream algebra such as conditional and recurrence forms.
- TypeScript target syntax such as `undefined` where it is required by the target dialect representation.

The target of eradication is TypeScript implementation authority: imperative semantic dispatch, ad-hoc host collections/control flow, unchecked boundary casts, and free-form fallback semantics.

## Validation

- The three touched TypeScript files passed TypeScript `transpileModule` syntax diagnostics.
- Full repository `tsc --noEmit` remains blocked by the existing environment because `node` and `vitest/globals` type definitions are not installed.
- Touched production files contain no matches for the banned implementation-token audit set: `if`, `while`, `for`, `switch`, `.map(`, `.filter(`, `.reduce(`, `.flatMap(`, `undefined`, `??`, `===`, `as unknown`, `Set`, `any`, `new`.

## Research basis

The design follows the same separation used by declarative compiler systems: relation/constraint catalogs provide semantic evidence, while a separate solver/rewrite layer performs selection and closure. MLIR canonicalization applies rewrite patterns to a fixpoint and requires repeated rewrites to converge; MLIR's pattern infrastructure separates pattern definitions from their application. Circular Reference Attribute Grammars explicitly model non-local dependencies and recursive fixed-point equations. Egglog combines Datalog-style fixed-point reasoning with equality-saturation rewriting.
