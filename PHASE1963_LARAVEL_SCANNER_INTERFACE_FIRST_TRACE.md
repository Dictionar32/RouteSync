# Phase 1963 — Laravel Scanner Interface-First Trace and AST Path Convergence

## Trace findings

### AST classification

Before this phase, lexer consumers imported `astClassifier.ts`, which implemented a second classification path through `semanticEvidenceRelations`, while the Phase 1962 request/result ADT port lived in `astClassifierEvidence.ts`. That split meant the ADT interface was not the sole public classification route. The canonical `astClassifier.ts` exports now forward to the existing `AstClassifierEvidenceInterface` adapter, preserving consumer names while removing this duplicate relation-based path.

The remaining root issue is deeper: `astClassifierRuntime.ts` still discovers candidates, constructs `SemanticDecisionContract` rules, and resolves a semantic decision inside the runtime module. Therefore it is not yet a pure executor of a complete upstream AST classification contract. The next interface-first change should evolve the existing `AstClassifierRuleAlgebra` / `AstClassificationRule` model, not add a `relation` or `foundation` subscanner and not simply move the same runtime functions to another file.

### Invocation judgment and integrated response

The existing path is already represented by the canonical models:

`source-file input → PHP source invocation pipeline → source-binding judgment → integrated response ADT → LaravelControllerInvocationSemanticJudgmentAuthority → LaravelControllerInvocationSemanticJudgmentInterface → inventory closure receipt → LaravelControllerScannerInterface → controller scan artifact → resource integrated response`.

The integrated response preserves `not_connected`, `source_binding_rejected`, `complete`, and `blocked`. The controller scanner consumes the closed inventory correspondences and forwards each invocation judgment into the parser/producer. Do not add a parallel invocation authority, rejoin by array index, reconstruct a judgment from parser output, or collapse the outcomes into a boolean.

### Forbidden architecture

- No `semantic/relations` or `semantic/foundation` subscanner/layer introduced.
- No new parallel AST semantic authority.
- No runtime-owned construction of semantic rules as the final architecture.
- No invocation judgment reconstruction in the scanner or response projection.

## Recommended interface evolution (interface first)

1. Extend the existing upstream AST rule contract so it describes a *closed, already-complete classification judgment contract*: candidate evidence, precedence, applicable rule identity, and typed result disposition must be upstream-owned before runtime execution.
2. Reuse the existing AST rule algebra and candidate ADT where semantically compatible. Do not copy the same rules into a second interface.
3. Make the runtime executor accept that complete contract and execute it; it must not discover candidate meaning, manufacture rules, or reclassify an unresolved outcome.
4. Keep syntax AST output (`PhpAstValue` / `PhpBlock`) separate from semantic evidence production (`AstSemanticEvidenceProducerInterface` / `AstSemanticStageInterface`).
5. Preserve the current invocation judgment, integrated response, and inventory closure interfaces as the authority chain. Improve their integration only where trace evidence shows a broken boundary.
6. After interface closure, wire the executor and scanner, then verify the integrated response all the way to its downstream consumer.

## External references

- TypeScript discriminated unions and narrowing support explicit, distinct ADT outcomes: https://www.typescriptlang.org/docs/handbook/2/narrowing.html
- TypeScript function overloads can model input/output call signatures, but the implementation still must satisfy each signature: https://www.typescriptlang.org/docs/handbook/functions.html
- PHP-Parser documents source AST nodes and source-location attributes, useful as a reference for retaining syntax structure and provenance: https://github.com/nikic/PHP-Parser
- Laravel routing documents controller actions as route targets, reinforcing that route/controller meaning must come from Laravel source evidence: https://laravel.com/docs/13.x/routing

These references support type-level ADTs, syntax/provenance preservation, and source-of-truth boundaries; they do not define RouteSync's internal architecture.

## Verification boundary

This phase removes the duplicate relation-based facade path and adds static source checks. It does not claim a full TypeScript build, package build, or end-to-end Laravel scan. The deeper runtime-owned rule construction remains an explicit follow-up, not a hidden success claim.
