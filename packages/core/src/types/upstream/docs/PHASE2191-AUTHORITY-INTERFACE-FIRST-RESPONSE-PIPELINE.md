# Phase 2191 — Authority Interface-First Response Pipeline

## Trace

The DTO response path is now explicitly interface-owned:

`Laravel DTO declaration judgment → property type-reference binding judgments → LaravelDtoResponseValueProjectionAuthorityInterface → LaravelDtoResponseContractProjectionAuthorityInterface → LaravelControllerResponseSemanticPipelineInterface.judgeIntegratedResponse → closed response semantic judgment → existing runtime executor / AST projection`.

The invocation judgment enters `LaravelControllerScannerExecutor.responseSemanticPipeline.judgeIntegratedResponse`; the response pipeline retains the closed response judgment and its runtime executor delegates to the response authority. `responseScanner.ts` now consumes `LaravelControllerResponseSemanticPipelineInterface` as an injectable dependency for method AST projection and framework compatibility judgment. The default composition remains the existing pipeline binding. No new relation, foundation, or subscanner authority layer was introduced.

## Changes

- Added explicit `LaravelDtoResponseValueProjectionAuthorityInterface` and `LaravelDtoResponseContractProjectionAuthorityInterface` authority contracts, extending the corresponding projection contract with the semantic-judgment ownership role.
- Concrete authority objects are typed against those authority interfaces rather than only the generic projection interfaces.
- `createLaravelDtoResponseContractProjectionAuthority` receives the value authority through its upstream interface; the default concrete binding is a composition-root choice.
- `createLaravelControllerResponseSemanticPipeline` receives the response-contract authority through its authority interface. The scanner-facing singleton is the default composition binding, while the pipeline contract remains injectable and testable.
- Runtime executor interfaces bind to the authority interface and continue returning the exact judgment without semantic reinterpretation.
- Bumped the integrated response pipeline contract version from 24 to 25 to reflect the authority ownership and dependency contract change.
- Exported the new authority interfaces and composition factory from public entry points.

## Semantic boundaries preserved

- The authority interface owns the decision contract; the concrete object implements it.
- DTO declaration resolution does not itself prove a response contract.
- Unsupported or ambiguous type semantics remain unresolved; no fallback-to-JSON inference was added.
- The integrated response retains DTO projection judgments and blocks unresolved projections.
- Existing invocation semantic judgment remains upstream input; this phase does not create a parallel invocation authority.
- No new relation/foundation/subscanner reasoning layer was added.

## Validation

- TypeScript syntax transpilation and static interface/wiring audit are run for this phase.
- Full Vitest and project build are not run in this environment; absence of a full dependency-backed build means no claim of full compile/test success is made.

## Remaining boundary

The DTO contract judgment is integrated into response evidence, but this phase does not yet replace the final method response product with a method-scoped canonical response contract. That requires tracing the method-product ADT and preserving per-method response-shape provenance before retiring the legacy descriptor path.
