# RouteSync Phase 506 — Resource Field Relational Cutover

## Objective

Move the remaining `resourceFieldProducer.ts` scanner/resolver authority from host-language control flow to declarative semantic relations, candidate requirements, explicit option witnesses, recursive relation traversal, and rewrite-style semantic construction.

## Research synthesis

Phase 506 follows patterns found in declarative compiler/static-analysis systems:

- MLIR PDLL/PDL models pattern matching separately from rewrite and represents rewrite patterns as transformable IR.
- Statix models static semantics as constraints and name binding as scope graphs with relations, declarations, and queries.
- Rascal-style analysis separates extracted facts from closure/enrichment, constraint solving, and rewriting.
- Relational/fixed-point systems provide a better authority boundary than syntax-driven dispatch.

## Changes

`packages/core/src/compiler/scanner/subscanners/resource/resourceFieldProducer.ts`

- operation dispatch uses candidate requirements and relation gates;
- argument lookup uses relation options;
- closure-return extraction uses recursive relation selection;
- dynamic resource entries use rewrite candidates;
- field presence uses semantic operation relations;
- property meaning uses model relation lookup;
- operation typing uses candidate relations;
- literal/cast/binary/unary typing uses relation-driven semantic catalogs;
- nested array typing uses relation projection + recursive comparison;
- conditional/coalescing types use semantic union construction;
- sequence construction is recursive relation closure rather than host collection reduction;
- absence is represented through relation options rather than language-level absence sentinels.

## Validation

Phase 506 audit:

`npm run audit:scanner-lexer:phase506`

Result:

`closedSurfaceClean: true`

The Phase 506 closed surface contains zero occurrences for the targeted parser/control/absence/operator categories.

The target file also passes TypeScript `transpileModule` syntax diagnostics with zero diagnostics. Repository-wide typecheck is not claimed because the environment lacks the repository's `node` and `vitest/globals` type definitions and already contains unrelated baseline diagnostics.

## Next frontier

The largest remaining scanner/resolver surfaces are now:

1. `descriptors/validation/validationRuleEntry.ts`
2. `descriptors/manifest/resourceRouteGroupDescriptor.ts`
3. `subscanners/controller/responseAttributeScanner.ts`
4. `subscanners/resource/resourceUpstreamExpressionCanonical.ts`
5. `subscanners/resource/resourceBindingPathBuilder.ts`

The next high-value cluster is validation/resource descriptor authority, preferably migrated as relation catalogs plus candidate solver/closure rather than isolated keyword replacement.
