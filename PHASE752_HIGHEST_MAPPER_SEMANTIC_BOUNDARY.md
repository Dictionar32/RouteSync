# Phase 752 — Highest Mapper Semantic Boundary

## Build frontier

The authoritative local build frontier was:

`packages/core/src/compiler/passes/mapper/readMapperBuilder.ts`

The DTS compiler reported `ResourceName` and `PropertyName` being passed into APIs that still demanded free `string` values.

## Structural correction

This phase does not restore a legacy string overload.

The mapper boundary now consumes canonical semantic name objects:

- `ResourceName` → `toPascalResourceName`
- `PropertyName` → `toCamelPropertyName`
- `PropertyName` → `propertyNameText` only at the final generated-code emission boundary

Field traversal and selection use the canonical relation algebra rather than host `map`/`filter` traversal.

`buildReadMapperFromFields` now requires the resolved API response type explicitly instead of using a nullable/default host parameter. The caller already owns that semantic fact.

The unused `resolveResourceBaseName` descriptor projection was removed after production-reference audit showed no consumer.

## Legacy authority

No `ParsedField` symbol remains in the mapper production boundary. The Phase 751 canonical `PhpAstNode` authority remains intact.

The old field reservoirs remain empty only where the reference audit proves they are no longer production authorities:

- `packages/core/src/types/field.ts`
- `packages/core/src/types/domain/fieldCatamorphism.ts`

## Declarative architecture

The mapper now follows:

`canonical semantic names → relation traversal → typed mapping intent → target-code emission`

rather than:

`semantic wrapper → implicit string coercion → host collection traversal → target code`.

This is consistent with the larger RouteSync direction of relation facts, typed bindings, fixed-point semantic closure, and centralized rewrite authority.

## Verification

- Phase 750 audit: PASS
- Phase 751 audit: PASS
- Phase 752 audit: PASS
- TypeScript syntax tooling available, but the checkpoint has no installed `node` / `vitest` type definitions, so a local `tsc --noEmit` cannot establish the full DTS build.
- The user's local `npm run build` remains the authoritative build verification.
