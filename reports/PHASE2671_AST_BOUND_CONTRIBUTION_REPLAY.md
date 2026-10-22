# Phase 2671 — AST-bound contribution replay

## Root cause

Phase 2670 correlated incoming RequestType identity/source with route and RequestAst evidence, but it did not independently prove that `incoming.actions` and `incoming.response` were derivable from the route capability/schema and the original ResourceAst. A receipt could therefore preserve valid identity/provenance while carrying a forged action or response payload.

## Implementation

- Added the upstream `RequestTypeDerivationIncomingContributionAstVerificationInterface` port and connected `requestTypeDerivationIncomingContributionMatchesAst` in `requestTypeDerivationProofVerifier.ts`.
- Action contributions are independently checked against `route.capability.actionKind` and `route.binding.schema.fields`: create/update require the corresponding FormAction; read/delete require no FormAction.
- Resource response contributions are checked against the referenced ResourceAst: resource identity, cardinality-derived response shape, ordered field names, semantic field types, and response-contract field names.
- Empty response contributions are accepted only for explicit empty/no-content source judgments. Unsupported projections fail closed.
- The verification gate now requires group replay, input identity/provenance correlation, and AST action/response correlation before returning the existing `verification_incomplete` result.
- The verifier does not call `deriveRouteAction`, `deriveActionResponseData`, or the producer group-fold algebra to justify its checks.

## Audits run

- Phase 2665 CLI → manifest → upstream source-path audit: 9/9 structural assertions passed.
- Phase 2666 assessment witness / closure audit: 8/8 structural assertions passed.
- Phase 2667 receipt-derived closure audit: 6/6 structural assertions passed.
- Phase 2668 mixed-outcome contribution ledger audit: 8/8 structural assertions passed.
- Phase 2670 source-bound incoming receipt audit: 10/10 structural assertions passed.
- Phase 2671 AST contribution replay audit: 12/12 structural assertions passed.

These totals are source-structure assertions, not semantic law proofs.

## TypeScript and integration status

A targeted TypeScript check of the modified verifier reported no diagnostics in `requestTypeDerivationProofVerifier.ts`. The wider dependency graph still fails typechecking in existing modules, including `PrimitiveKind` imported as a type but used as a value, missing `ControllerActionSchemaRequestEvidence`, controller-expression algebra generic mismatches, and other domain type errors.

Vitest dependencies and `examples/ecommerce-shop-source/vendor/autoload.php` are absent, so Vitest and Laravel runtime/`artisan route:list` could not be executed. The fixture's route files and manifest were inspected structurally, but no claim is made that the current manifest exactly matches a fresh Laravel scan.

## Remaining gaps

- The 34 canonical semantic laws remain `verification_incomplete`; this phase does not claim full verification.
- Response contract value/nullability semantics need deeper independent checks beyond the current field identity/type checks.
- Full inventory/identity collision closure and the final decision → authority → integrity → manifest path still require runtime tests.
- Full project typecheck and end-to-end `scan`/`sync` against the Laravel fixture remain open.
