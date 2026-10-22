# Phase 2468 — Laravel Model Key Upstream Authority

## Baseline and scope

- Baseline archive: `RouteSync-Phase2466-Model-Relation-Upstream-Authority.zip`.
- Phase 2467 model-property authority changes are retained as the immediately preceding focused phase; no source files were relocated.
- This phase addresses one traced semantic responsibility: Laravel model primary-key type inference when `$keyType` is not explicitly declared.
- This phase is intentionally not presented as completion of the entire Laravel scanner/subscanner retirement.

## Trace and root cause

Before this phase, `subscanners/model/modelParser.ts` owned `inferKeyTypeFromSchema(...)`. That scanner-local function traversed schema columns, classified database column types into model key kinds, and emitted boundary errors for missing or unsupported primary-key columns. The same file separately mapped model key kinds to semantic types. These are upstream semantic decisions, not syntax scanning or runtime execution.

Phase 2468 adds an explicit upstream evidence/authority/judgment contract:

`ModelKeyFactsEvidence → modelKeyFactsAuthority.judge → ModelKeyFactsJudgment → modelParser projection`

The judgment is closed: `resolved_model_key`, `missing_model_key_column`, or `unsupported_model_key_column_type`. Both model key kind and semantic type now come from the upstream judgment. The scanner no longer defines `inferKeyTypeFromSchema` or `modelKeySemanticType`.

## Changes

- Added `types/upstream/modelKeyFactsAuthorityInterface.ts` with typed evidence, closed judgment ADT, and authority interface.
- Added `types/upstream/modelKeyFactsAuthority.ts`, exported as `export const modelKeyFactsAuthority: ModelKeyFactsAuthorityInterface = Object.freeze(...)`.
- Exported the authority and interface from `types/upstream/index.ts`.
- Wired `subscanners/model/modelParser.ts` to submit primary-key evidence to the upstream authority and consume the resolved judgment.
- Added phase audit and smoke scripts plus npm scripts.
- No files moved.

## Validation evidence

- Phase 2467 audit: 13/13 passed.
- Phase 2467 smoke: 7/7 passed.
- Phase 2468 audit: 10/10 passed.
- Phase 2468 smoke: 6/6 passed.
- TypeScript transpile syntax checks for four changed TypeScript files: 4/4 passed.
- Full package typecheck, full Vitest, package build, and end-to-end CLI were not run; this report does not claim they pass.

## Remaining architecture work

The full Laravel scanner is not yet free of `semantic/relations` or `subscanners`. After this change, model key inference is upstream-owned, but `modelParser.ts` still uses relation combinators for source-semantic projection and still has a local judgment executor. Other model modules still import relation utilities (`modelCanonical.ts`, `propertyProducer.ts`, `semanticTypeCanonical.ts`, `columnInferrer.ts`). The wider scanner tree also contains many relation imports. `semantic/foundation` has no direct import in the model subdirectory, but this does not establish that the whole scanner tree is foundation-free.

Next audit should trace each remaining responsibility to an existing upstream owner before adding any new contract. In particular, inspect the existing model/source semantic contracts and existing closed ADTs before migrating the remaining model canonicalization and property projection paths. Do not remove or move `subscanners` wholesale while production consumers still depend on them.
