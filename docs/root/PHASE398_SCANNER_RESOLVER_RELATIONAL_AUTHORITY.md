# Phase 398 — Scanner/Lexer Relational Authority

## Scope

Phase 398 continues the scanner/lexer migration from imperative traversal toward the canonical semantic relation kernel. The selected boundary is `arrayParser.ts`, where array-opening discovery, nested-bracket depth, entry segmentation, key classification, and scalar-value extent are now expressed as recursive relation closure.

## Architectural change

The parser remains an evidence adapter: tokens are still recognized as source evidence, while traversal and semantic selection are delegated to relation primitives.

The migrated authority uses:

- recursive relation closure for token traversal;
- `RelationOption` witnesses for optional key/opening/value boundaries;
- `relationResolve` for branch selection;
- `relationFirst` and `relationOptionFold` for witness elimination;
- `relationEqual` for semantic equality;
- recursive depth closure for nested array/subscript and scalar-expression boundaries.

This follows the broader architecture established by declarative rewrite systems and relational evaluation: match evidence, derive constraints/witnesses, then project a canonical result. MLIR PDLL explicitly models constraints and rewrites declaratively, while egglog combines equality saturation with Datalog-style relations. JastAdd's circular attributes provide a related fixed-point evaluation model for recursively defined semantic values. citeturn0search2turn0search0turn0search4

Soufflé likewise treats relations as typed tuples and rules as Horn-style derivations; RouteSync's relation kernel applies the same semantic separation while retaining TypeScript AST compatibility at the scanner boundary. citeturn0search1turn0search5

## Verification

Using the same lexical target expression used for the Phase 397 comparison:

`if|for|while|switch|map|filter|reduce|flatMap|undefined|null|??|===|as unknown`

- `arrayParser.ts`: **0 → 0** target hits after migration.
- scanner baseline: **3637 → 3608** matches.
- affected scanner files: **338 → 337**.
- delta: **−29 matches, −1 file**.

The full project TypeScript check remains blocked by the existing environment-level missing definitions for `node` and `vitest/globals`; this phase does not claim a repository-wide type-clean state.

## Remaining frontier

The next high-pressure scanner/resolver authorities remain `astClassifierEvidence.ts`, `controllerDataflowAnalyzer.ts`, `phpMethodParser.ts`, `queryEvidenceProducer.ts`, and the remaining resolver/subscanner boundaries. Source-language constructs appearing purely as PHP syntax evidence must remain evidence; the migration target is their use as semantic control authority.
