# Phase 1838 — Controller Integrated Response Preservation

Date: 2026-10-13

## Interface-first finding

`LaravelControllerInvocationSemanticJudgmentInterface` already binds one canonical `sourceFile` to one `PhpSourceInvocationSemanticPipelineIntegrationResult`. The integration result is a closed discriminated union that preserves `not_connected`, `source_binding_rejected`, `complete`, and `blocked` as distinct outcomes.

The gap was at the outer source-AST contract: `LaravelSourceAstPipelineInterface.execute(...)` accepted the authority-closed controller inventory receipt, but `SourceAsts` did not expose that receipt. The pipeline projected ASTs/actions while dropping the integrated invocation-response inventory from its public result. Downstream consumers therefore could not access the exact closed response through `SourceAsts` without returning to another pipeline boundary or reconstructing a mapping.

## Changes

- `packages/core/src/types/upstream/collections.ts`: `SourceAsts` now requires `controllerInvocationSemanticInventory`, typed as the existing `LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt`.
- `packages/core/src/types/upstream/laravelSourceAstPipelineInterface.ts`: documents that the returned `SourceAsts` preserves the authority-closed inventory and each source's integrated response.
- `packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts`: forwards the exact input receipt into `SourceAsts`; it does not map, rebuild, reclassify, or infer the integrated responses.
- `scripts/audits/audit-phase1838-controller-integrated-response-preservation.cjs`: static checks the typed output contract and exact receipt forwarding.
- `package.json`: registers `audit:phase1838-controller-integrated-response-preservation`.

## Verification

- Phase 1838 integrated-response preservation audit: 8/8 passed.
- Phase 1837 required inventory receipt audit: 14/14 passed.
- Phase 1836 controller downstream interface-first audit: 17/17 passed.
- Build, TypeScript typecheck, and end-to-end tests were not run.

## Remaining migration boundary

This phase fixes a contract/output loss; it does **not** claim the production controller, route, or resource subscanners have been retired. `laravelSourceAstPipeline.ts` still calls the legacy `ControllerScanner`, `ResourceScanner`, and `RouteScanner` entry points. The next interface-first phase must implement the existing `LaravelControllerScannerInterface` against source-correlated artifacts and closed judgments, then migrate route/resource consumers to those interfaces before deleting the old subscanner path.

## External contract references

- TypeScript Handbook, Interfaces: https://www.typescriptlang.org/docs/handbook/interfaces.html
- PHP-Parser lexer / AST source positions: https://github.com/nikic/PHP-Parser/blob/master/doc/component/Lexer.markdown
- PHP-Parser project documentation: https://github.com/nikic/PHP-Parser
