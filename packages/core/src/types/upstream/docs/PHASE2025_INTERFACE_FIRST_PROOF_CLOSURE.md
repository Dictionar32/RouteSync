# Phase 2025 — Interface-first proof closure

## Source change

The existing `astClassificationRuleAlgebra` now has an explicit `AstClassificationRuleAlgebraInterface` contract. This is the contract of the existing algebra, not a second AST classifier authority.

`verifyProof` now checks more than rule identity and proof labels. It verifies that:

- the attempt list ends exactly at the selected rule;
- each preceding attempt matches the corresponding policy rule in order;
- each preceding rule was actually rejected (`not_applicable` / `not_attempted`, or `applicable` / `not_resolved`);
- the selected attempt is applicable and resolved.

This closes a proof-validation gap where a fabricated attempt list could claim an earlier rule had been rejected without checking its recorded outcome.

## Remaining boundary

`astClassifierRuntime.ts` still adapts parser helpers that return `RelationOption`. The rule arbitration algebra itself is relation-free, but the whole parser is not. The next migration must change parser capability outputs to AST-specific judgment ADTs, without adding `relation` or `foundation` subscanners and without pretending `AstClassifierEvidenceInterface` is a semantic arbitration interface.

## Laravel path retained

The existing four-outcome invocation ADT remains canonical. Controller scanner wiring continues to carry the exact invocation judgment and associated integrated response judgment into AST projection. The invocation executor continues to delegate to the upstream authority. No duplicate invocation authority or response model was introduced.

## Static verification

The Phase 2025 audit checks the proof-closure conditions and the Laravel invocation/response boundaries. It is a source audit, not a full TypeScript build or runtime test.
