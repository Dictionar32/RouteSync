# Phase 1869 — Laravel Invocation Judgment / Integrated Response Interface First

## Trace

The latest Library baseline was Phase 1868. The relevant upstream path is:

`InvocationSemanticJudgment` → `PhpSourceInvocationSemanticPipelineIntegrationResult` → `LaravelControllerInvocationSemanticJudgmentInterface.response` → `LaravelControllerScanArtifact.invocationJudgment` → `LaravelControllerScanJudgment` → `LaravelResourceIntegratedResponse.controllerScan`.

The existing resource response already retains the exact controller scan, closed resource-binding closure, and source-ordered artifact sequence. The gap was in the semantic model: `ResourceModelBindingSemanticJudgmentModelInterface.integratedResponse` described invocation preservation using a small inline set of string literals, while the resource response contract separately described the same intent. That split made the source-correlation, outcome-preservation, forbidden-join, and subscanner-retirement rules less explicit and duplicated.

## Interface-first change

- Added `ResourceModelBindingInvocationIntegrationModelInterface` and its declarative model constant in `packages/core/src/types/upstream/resourceModelBindingSemanticInterface.ts`.
- Made the existing resource-binding semantic judgment model reference that named contract rather than maintaining a weaker inline response description.
- Made `LaravelResourceIntegratedResponseContract` reuse the same upstream contract.
- Explicitly modeled exact controller artifact → invocation judgment → nested integrated response correspondence.
- Explicitly preserved all four invocation integration outcomes: not connected, source-binding rejected, complete, and blocked.
- Explicitly forbade index-based controller/resource joins, invocation-judgment reconstruction, detached response sidecars, and promotion of non-success outcomes.
- Added a subscanner-retirement gate: upstream source-correlated ownership must be complete before retirement; remaining scanner responsibilities are limited to consuming closed judgments and projecting artifacts.
- Exported the new type and contract constant through upstream and core public indexes.

## Scope boundary

This phase changes upstream contracts, public type/value exports, documentation, and a static audit only. It does **not** add or alter semantic runtime functions, scanner wiring, or subscanner implementations. It does not delete a subscanner. That is intentional: interface design and trace precede runtime realization.

## External semantic references

- TypeScript's discriminated unions provide a typed way to preserve distinct semantic outcomes: https://www.typescriptlang.org/docs/handbook/2/narrowing.html
- Laravel route model binding is source-framework behavior whose route/controller/model evidence should remain the compiler's source of truth: https://laravel.com/docs/13.x/routing#route-model-binding

These references support preserving outcome distinctions and source semantics; they do not prescribe RouteSync's internal architecture.

## Validation

- `node scripts/audits/audit-phase1869-laravel-invocation-integrated-response-interface-first.cjs`: **10/10 passed**.
- `node --check` for the new audit: passed.
- `package.json` JSON parse: passed.
- `audit-phase1838-controller-integrated-response-preservation.cjs`: **8/8 passed**.
- Existing `audit-phase1852-resource-binding-integrated-judgment-interface.cjs`: **10/11 passed**; its existing scanner-wiring expectation (`input.bindingAuthority`) does not match the current scanner source. This phase did not modify runtime/wiring to mask that mismatch.
- No full build or TypeScript compilation is claimed.
