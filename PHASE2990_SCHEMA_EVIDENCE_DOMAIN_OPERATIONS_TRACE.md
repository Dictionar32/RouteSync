# Phase 2990 — Schema Evidence Domain Operations

## Goal

Move inline-validation schema presence from a generic relation helper into an upstream-owned, typed domain judgment that carries an operation for continuing from the result. Preserve the public schema derivation ADT and exact source identity.

## Runtime trace

```text
FormRequestSource evidence ───────────────┐
                                         ▼
Inline validation RouteSchemaPayload → controllerActionSchemaSemanticJudgmentAuthority.judge
                                         │
                                         ▼
                         InlineSchemaEvidenceJudgment
                           ├─ empty_inline_schema
                           └─ present_inline_schema
                                         │ continueWith(...)
                                         ▼
                         ControllerActionSchemaDerivation
                           ├─ form_request_schema
                           └─ form_request_and_inline_validation_schema
                                         │
                                         ▼
                         completed judgment + sourceIdentity
                                         │
                                         ▼
                         CLI manifest scan operation
                                         │
                                         ▼
                         manifest composition continuation
```

The source authority is `packages/core/src/types/upstream/controllerActionSchemaSemanticJudgmentAuthority.ts`. The CLI scan entry point is `packages/cli/src/commands/scan.ts`, with its operation contract in `packages/cli/src/manifestScanOperationInterface.ts`. The PHP manifest composition continues a `ManifestBuilderJudgment` in `packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts`.

This proves the named component boundaries and code-level invocation patterns, not per-field provenance from this schema judgment all the way to serialized manifest or IR. That needs a dedicated consumer/projection trace.

## Changes

- Removed direct imports of `relationEqual` and `relationGate` from the schema authority.
- Added `InlineSchemaEvidenceJudgment`, with `empty_inline_schema` and `present_inline_schema` variants.
- Both variants provide `continueWith(onEmpty, onPresent)`.
- The request/inline merge policy remains upstream-owned; merged schema fields, messages, attributes, validation entries, and source identity remain represented.
- Runtime export remains `export const ...: ControllerActionSchemaSemanticJudgmentAuthorityInterface<SourceFile> = Object.freeze({...})`.
- No deleted relation foundation was recreated; `packages/core/src/types/upstream/collections.ts` remains untouched.

## Audit boundary

The audit records the remaining imports of the removed relation foundations across `packages/` so the next migration can be selected from actual evidence. A passing Phase 2990 structural audit is not a full repository build. Full typecheck and tests remain unverified because the workspace dependency installation is absent and other source files still reference deleted relation modules.

## Recommended next steps

1. Migrate the next upstream authority with the smallest domain-local dependency surface, keeping one owner for each judgment.
2. Continue tracing schema source identity and schema fields through manifest projection into the final serialized output and IR.
3. Classify remaining deleted-relation imports by runtime path (upstream, PHP frontend, CLI, manifest, IR) and migrate the highest-impact path first.
4. Run full build/typecheck/test suite after the remaining imports have been migrated; do not treat structural audits as substitutes.
