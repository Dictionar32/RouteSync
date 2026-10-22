# Phase2438 — Upstream Operation Preparation; Runtime Has No Input

## Root cause

The prior runtime contract was a generic function from source input to derivation result. The runtime executor invoked the semantic pipeline, checked contract closure, compared input/proof evidence, validated the assessment, and dispatched the judgment. This made the runtime boundary own orchestration and exposed semantic input as a runtime parameter.

## Upstream correction

- Replaced the generic runtime executor contract with a concrete RequestType-domain interface whose `execute()` takes no arguments.
- Added the concrete `RequestTypeDerivationOperationPreparationInterface` and `RequestTypeDerivationPreparedOperation` contracts to the existing upstream contract owner.
- Moved pipeline derivation and assessment validation into `requestTypeDerivationOperationPreparation.ts`, before an operation crosses the runtime boundary.
- Runtime executor now accepts only the prepared operation and invokes its no-argument `execute()` operation. It has no semantic-pipeline dependency and receives no source input.
- Removed generic projection and execution-result parameters from this RequestType runtime boundary. The judgment consumer is now concrete to `readonly RequestType[]`.
- Updated manifest authority wiring to prepare the operation first and then invoke the runtime executor without arguments.

## Boundaries

This change does not claim that the full production reasoning/verifier/decision/authority pipeline exists or that the legacy CLI manifest path has been cut over. It corrects the authority-backed operation boundary. The semantic reasoning/verifier/decision/authority/pipeline capability declarations still contain legacy generic parameters. Therefore this phase closes the runtime-operation boundary without claiming that the entire upstream semantic capability chain has been fully migrated away from generics; that remains an explicit upstream contract migration, not a reason to reintroduce generic runtime abstractions.

## Verification

Run `node scripts/audits/audit-phase2438-upstream-operation-preparation-no-runtime-input.cjs` and the retained manifest/authority audits. Full typecheck/build is not asserted; the available global TypeScript compiler is older than the repository's configured target and the repository contains pre-existing parse errors in `effectiveControllerActionPolicyResolver.phase921.test.ts`.
