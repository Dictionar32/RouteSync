# Phase 2279 — Upstream Action Authority Contract Closure

## Intent

This phase clarifies the existing upstream action contract before changing runtime behavior. It does not claim that the action pipeline is fully Interface First, and it does not move or rewrite runtime logic.

## Production path traced

`packages/cli/src/commands/scan.ts` → `packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts` → `packages/core/src/compiler/scanner/wiring/laravelControllerExecutionDependencies.ts` → `LaravelControllerActionSemanticJudgmentAuthorityInterface.judge(...)` → sibling `projection` from `LaravelControllerActionContractResolverInterface.resolve(...)` → manifest consumers.

## Interface correction

Evolved the existing `LaravelControllerActionSemanticJudgmentContract` from version 49 to 50. The contract now states the authority sequence explicitly and tracks two previously under-specified debts as closed discriminated-union obligations:

- `method_ast_semantic_derivation`: the action judgment authority still consumes parser method AST evidence to derive semantic products; target is the existing typed source-evidence and semantic-judgment contracts.
- `return_semantic_production_adapter`: the return semantic production interface still delegates to `controllerAstCanonical`; target is the existing upstream return-semantic contract.

Existing obligations for legacy action derivation and transitive `semantic/relations` dependencies remain. This prevents the interface contract from implying that merely calling an interface means semantic ownership has migrated.

## Scope boundary

No behavior in the CLI, scanner, or runtime executor was changed. The only non-upstream file changed is the composition's literal contract declaration, to keep its implementation aligned with the evolved upstream contract. `resolveControllerActionContract(...)`, `createControllerDataflowContract(...)`, `controllerAstCanonical` return production, and transitive `semantic/relations` usage are still outstanding; no subscanner/relation retirement is claimed.

## Validation

Run `node scripts/audits/audit-phase2279-upstream-action-authority-debt.cjs` from the repository root. This is a static architecture audit, not a TypeScript typecheck or build. No `npm run build` was run.

## Next interface-first step

Before touching runtime implementation, evolve the existing source-evidence contracts so the action authority consumes canonical typed method/body/return evidence and closed judgments instead of deriving those meanings from `ControllerMethodAst`. Then migrate the existing production composition to those contracts, verify the CLI call path, and only afterward retire legacy projections and the relation-backed dataflow path.
