# Phase2464 — Model Accessor Upstream Authority

## Scope

Promote accessor classification and result judgment from the scanner-local `modelAccessorFactsDerivation` into the upstream owner, while keeping PHP AST extraction in the compiler scanner.

## Ownership chain

`ModelDeclarationAst -> modelAccessorEvidenceProducer -> ModelAccessorMethodEvidence -> modelAccessorFactsAuthority -> ModelAccessorFact`

The upstream evidence contract contains named method identity, visibility, a closed return-type evidence ADT, canonical upstream expressions, and source provenance. It does not import compiler AST types.

## Changes

- Added `ModelAccessorFactsAuthorityInterface` and `ModelAccessorMethodEvidence` in `types/upstream`.
- Added `modelAccessorFactsAuthority` with the `export const name: Interface` pattern.
- Added scanner-owned `modelAccessorEvidenceProducer` to translate parser-owned AST into upstream evidence.
- Rewired `laravelModelScanner` to call evidence producer then upstream authority.
- Removed scanner-local `modelAccessorFactsDerivation.ts`.
- Reused the existing `PhpAstExpressionSemanticAuthorityInterface` directly from the evidence producer and retired the redundant `modelAccessorExpressionMapper.ts` function wrapper.
- Removed direct `semantic/relations` dependency from `types/upstream/modelVocabulary.ts` by replacing its cardinality operation with an exhaustive kind-keyed closed mapping.

## Known open dependency

`modelAccessorEvidenceProducer` now calls the existing `phpAstExpressionSemanticAuthority.derive` contract directly. Its concrete implementation still has direct `semantic/relations` imports. This phase removes the extra function wrapper and direct relation/foundation imports from the new upstream accessor authority and model vocabulary, but does **not** claim the transitive accessor expression path is relation-free.

## Validation boundary

The Phase2464 static audit checks contract ownership and wiring. Full typecheck, tests, package build, and end-to-end CLI must still be run in a workspace with project dependencies installed.
