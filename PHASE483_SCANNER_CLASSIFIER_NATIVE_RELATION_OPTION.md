# Phase 483 — Scanner classifier native RelationOption cutover

## Authority change

The scanner AST classifier frontier is moved further from sentinel-based dispatch to native relational candidates.

Migrated classifiers:

- `match` expression classifier → `RelationOption<PhpAstValueNode>`
- interpolated-string classifier → `RelationOption<PhpAstValueNode>`
- class-constant classifier → `RelationOption<PhpAstValueNode>`
- class-reference classifier → `RelationOption<PhpAstValueNode>`
- `new` expression classifier → `RelationOption<PhpAstValueNode>`
- anonymous-class classifier → `RelationOption<PhpAstValueNode>`

The rule catalog now consumes these native options directly instead of wrapping these classifiers in the legacy sentinel adapter.

The source-language token catalog remains data: PHP tokens such as `===`, `&&`, `||`, and `??` are lexical facts and are not treated as host-language control authority.

## Validation

- TypeScript parser diagnostics for `astClassifierEvidence.ts`: 0.
- No full `tsc` claim: workspace dependency/type-definition installation is not available in the checkpoint environment.

## Remaining frontier

The same file still contains legacy statement classifiers (`conditional`, iteration, selection, try/catch) and additional ternary/sentinel expressions. These require native relational option/candidate migrations rather than blanket textual replacement.
