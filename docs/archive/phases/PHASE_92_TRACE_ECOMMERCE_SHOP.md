# Phase 92 — ecommerce_shop upstream semantic-flow trace

## Trace

Basis: Phase 91.

### 1. SemanticTypeDeriver
`SemanticTypeDeriver.ts` still imported/re-exported the removed `fieldExtractors` API and the removed `resolveModelColumnTypeString` symbol. This left the upstream semantic boundary internally inconsistent after Phase 91.

**Fix:** keep the orchestrator dependent only on active semantic modules: `SemanticDerivationContext`, model extraction, and the three semantic type derivation passes.

### 2. Route response property derivation
`propertyProcessor.ts` rebuilt array semantics from `expression.element.semanticType` and only reused `field.semanticType` when nullable. This created two semantic authorities.

**Fix:** the response property pipeline now treats `field.semanticType` as the canonical bound semantic value for every leaf, including arrays. The expression remains syntax; it does not re-derive the type.

### 3. Resource type derivation
`resourceTypeDeriver.ts` was carrying an unused nullable-type import. No semantic behavior depended on it.

**Fix:** removed the dead dependency.

## Remaining upstream debt found

1. `DatabaseColumnKind.Unknown` still maps to `PrimitiveKind.STRING`, which is semantic information loss.
2. `matchDatabaseColumnKind()` still uses `??` plus `as any` to bridge registry correlation.
3. `EloquentCastKindRegistry` still represents JSON/object/collection/custom casts as string/unknown-shaped values instead of a closed semantic ADT.
4. `ScannedObjectProperty` still projects `nullable:boolean` alongside `SemanticType`; this is a duplicate semantic channel and needs a dedicated contract trace before removal.
5. The resource AST mapper still creates `ErrorType` for unresolved syntax in several cases. This is safer than fake primitive UNKNOWN, but it is still not the final verified-boundary model.

## ecommerce_shop implication

The important dataflow rule is now explicit: once a resource field has a verified `semanticType`, downstream response/resource derivation must consume that value directly. It must not reconstruct collection/object semantics from expression syntax.

## Validation

Static checks were run against the extracted Phase 91 basis. Full TypeScript build/test was not run because the Phase 91 ZIP does not contain the root `package.json`/`tsconfig.json` needed to execute the repository build.
