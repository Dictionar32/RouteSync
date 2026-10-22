# Phase 1911 — Laravel Controller Origin Judgment, Interface First

## Scope

Continue from Phase 1910 by closing one remaining semantic classification: the conversion from `SemanticBindingOriginCode` plus the matched source payload's statement index into canonical `ControllerVariableOrigin`.

## Trace

- `controllerDataflowAnalyzer.ts` builds source-specific PHP payload evidence and delegates source identity/span correspondence.
- Before this phase, the same analyzer also classified `parameter`, `assignment`, `iteration`, and `exception_handler` into canonical variable-origin ADTs through `canonicalVariableOrigin`.
- `ControllerVariableOrigin` and `StatementIndex` already exist in upstream types; no duplicate origin model is introduced.
- The production composition root already injects `ControllerDataflowBindingPayloadCorrespondenceAuthorityInterface`.
- `ControllerDataflowAst` retains the full matched/missing/ambiguous judgment, while the canonical invocation judgment and integrated response remain separate values.

## Change

The existing `ControllerDataflowBindingPayloadCorrespondenceAuthorityInterface` was strengthened (contract version 3). A matched judgment now carries `definitionOrigin`, derived from the semantic binding-origin code and the typed statement index of the matched payload. The source adapter still owns PHP AST traversal and only provides source-correlated payload evidence. The analyzer consumes `definitionOrigin`; its local `canonicalVariableOrigin` classifier was removed.

The upstream barrel now exports the correspondence contract and authority. The Laravel controller boundary contract is version 77 and records that binding correspondence and origin judgment are upstream-owned.

## What remains

This does **not** make `controllerDataflowAnalyzer.ts` wiring-only. It still traverses PHP AST to collect payloads, maps PHP AST expressions to upstream expressions, resolves variable semantic evidence, reconstructs identifiers from knowledge facts, and groups definitions. The `parameters` argument is passed through the call chain but is not consumed by the current analyzer body; its intended role must be traced before removing or wiring it differently.

The next phase should trace the existing expression projection and variable semantic authority contracts together with their production consumers. Do not introduce a second invocation judgment authority or merge `invocationJudgment` with `invocationSemanticIntegratedResponse`.

## Verification

- Static audit script: `scripts/audits/audit-phase1911-controller-origin-judgment-interface-first.cjs`
- Static audit result: 9/9 checks passed.
- ZIP integrity checked after packaging.
- Build, typecheck, and full tests were not run.
