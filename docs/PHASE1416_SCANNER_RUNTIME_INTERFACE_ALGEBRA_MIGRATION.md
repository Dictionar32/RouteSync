# Phase 1416 — Scanner runtime to interface algebra trace

## Authority split

- `astClassifierRuntime.ts` remains the PHP grammar implementation: it recognizes syntax and constructs PHP AST nodes.
- `types/upstream/astClassifierRuleAlgebra.ts` owns ordered rule applicability, short-circuiting, and first-proven resolution.
- `astClassifierEvidence.ts` remains the typed request/result adapter, not the grammar or rule-selection authority.
- `astSemanticEvidenceProducer.ts` remains the upstream semantic-evidence producer; syntax classification does not manufacture semantic judgments itself.

## Migrated decision surfaces

1. Expression classification uses the applicability-bearing rule contract.
2. Structured statements use a declarative ordered rule catalog keyed by `PhpControlEvidence`; non-matching grammar productions are not executed.
3. Simple statements use the same algebra for return / assignment / expression precedence.

## Deliberately not moved

Grammar productions (`parseConditionalStatement`, `parseCollectionIterationStatement`, `parseCountedIterationStatement`, `parsePretestIterationStatement`, `parseSelectionDispatchStatement`, `parseTryStatement`, expression-specific `classify*`) remain language-specific parser capabilities. Moving these bodies into a generic interface would invert dependencies and make the contract PHP-specific. Next migration candidates are `findStatementEnd`/delimiter navigation, assignment-operator recognition, and expression operator precedence; each needs an explicit input/output relation contract and AST parity tests before replacement.

## Known residuals

- `parseStatements` still owns recursive sequence traversal and recovery/skip behavior.
- Grammar-specific rule bodies remain in `astClassifierRuntime.ts`.
- Full TypeScript build must be run in an environment with the repository's pinned `tsdown` dependencies installed.
