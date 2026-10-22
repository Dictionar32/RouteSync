# Phase 1960 Changelog

- Removed overloaded `classify(request)` signatures from the AST classifier contract.
- Split existing syntax capabilities into named `expression(tokens)` and `block(tokens)` operations.
- Removed semantic request/result variants from the syntax classifier.
- Routed semantic evidence through the existing `AstSemanticEvidenceProducerInterface` and `AstSemanticStageInterface`.
- Replaced `syntaxKind: string` with the canonical upstream `PhpAstExpressionKind` ADT and reused it in the PHP expression AST variants.
- Added a typed `syntax` variant to the existing `AstSemanticTerm` and retained syntax kinds as typed semantic terms instead of flattening them to generic text.
- Updated legacy architecture audits to validate the current boundary instead of the retired overload design.
- Added `audit:phase1960-existing-ast-authority-no-overload-interface-first`.
- Fixed a missing object-literal closing brace in the Laravel route scanner closure target discovered by the targeted TypeScript syntax/typecheck pass.
