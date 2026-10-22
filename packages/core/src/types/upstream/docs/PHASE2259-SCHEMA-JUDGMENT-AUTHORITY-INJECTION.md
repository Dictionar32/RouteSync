# Phase 2259 — Schema Judgment Authority Injection

## Trace

`LaravelControllerActionSemanticJudgmentAuthorityInterface.judge(...)` → `resolveControllerActionContract(...)` → `controllerActionSchemaSemanticJudgmentAuthority.judge(...)` was previously a hidden concrete dependency inside the resolver. That meant the resolver owned the choice of schema authority despite an existing upstream `ControllerActionSchemaSemanticJudgmentAuthorityInterface` and a source-correlated closed schema judgment.

## Change

- `ControllerActionContractResolverContext` now requires the existing `ControllerActionSchemaSemanticJudgmentAuthorityInterface<SourceFile>`.
- `resolveControllerActionContract(...)` invokes `context.schemaSemanticJudgmentAuthority.judge(...)` instead of importing the concrete singleton.
- `LaravelControllerExecutionDependencies` exposes the same interface and passes it into the resolver context.
- Production composition binds the existing `controllerActionSchemaSemanticJudgmentAuthority` implementation.
- The compatibility action scanner and resolver tests supply the same existing authority contract.

No second schema authority or new semantic classifier was added. Schema merge policy remains owned by the upstream schema judgment authority.

## Remaining ownership debt

This change closes one hidden authority selection; it does **not** retire `resolveControllerActionContract(...)`, the controller/resource `subscanners`, or transitive `semantic/relations` dependencies. The resolver still derives response-reference judgment, runtime return projection, resource evidence-to-judgment composition, and dependency products. The next substantive cutover should publish a complete source-correlated action judgment from existing upstream judgments and move only AST evidence projection to the scanner boundary.

## Validation

`scripts/audits/audit-phase2259-schema-authority-injection.cjs` performs source-level assertions for the injection path. No build, typecheck, or Vitest result is claimed in this phase.
