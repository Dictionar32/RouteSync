# Phase 1368 — Upstream Schema Parser Contract Adoption

## Finding

The SDK-local `ParserSchema<T>` duplicated the already stronger `RouteParserSchema<T>` contract while making both `parse` and `safeParse` optional. `parseWithSchema()` also accepted an absent schema and returned an arbitrary `unknown` value through `as T`. That meant a malformed configured schema could silently act like a successful parse.

## Change

- Moved the canonical `RouteParserSchema` and `SafeParseResult` declarations into `core/src/types/upstream/runtimeSchemaParser.ts`.
- Kept the historical `types/request` export as a compatibility re-export; there is one declaration and one owner.
- Made the SDK `ParserSchema<T>` an alias of the upstream contract. A schema object must implement both `parse` and `safeParse`.
- Made `parseWithSchema()` require a configured schema. It uses the canonical `safeParse` result and throws its error on failure; there is no unvalidated `as T` fallback inside the parser helper.
- Added `isSchemaLike()` at the untyped route boundary. `parseRouteSchema()` explicitly distinguishes a missing schema (preserve the raw `unknown` value) from a malformed configured schema (throw) and a valid parser contract (parse). `undefined` values are no longer skipped when a schema is configured; the schema itself decides whether that value is valid.
- Schema-part selection uses `Partial<RouteSchemaMap>` and checks the parser contract before interpreting an object as a schema map.
- When `GenericService` has a list schema, it validates the collection. If only an entity schema is configured, each list item is passed through that entity parser. A missing schema remains an explicit compatibility path at the service boundary rather than hidden inside `parseWithSchema()`.

## Flow

```text
Laravel validation / response evidence
    -> canonical route schema projection
    -> RouteParserSchema (upstream contract)
    -> SDK schema-part selection
    -> runtime contract guard
    -> parseWithSchema
    -> mapper / endpoint consumer
```

The runtime parser contract is separate from Laravel's static `RouteSchemaPayload` validation ADT: one describes generated domain semantics, the other is a runtime parser capability. They are related at the projection boundary but are not interchangeable types.

## Verification

- `audit:phase1368-upstream-schema-parser-contract`: 22/22 static source-contract and cross-layer trace checks passed.
- ZIP integrity and extracted-root checks are performed separately.
- Full typecheck/build/runtime test status must be reported separately; the supplied workspace has no local `node_modules` or `tsdown` executable.

## External design references

- MLIR Interfaces: https://mlir.llvm.org/docs/Interfaces/ — generic transformations should consume declared interfaces instead of duplicating operation-specific reasoning.
- CodeQL JS/TS data flow: https://codeql.github.com/docs/codeql-language-guides/analyzing-data-flow-in-javascript-and-typescript/ — AST nodes and data-flow nodes are different representations; retain the boundary.
- TypeScript 7.0: https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/ — compiler modernization does not replace project-specific typecheck/build verification.
- Laravel validation: https://laravel.com/framework/docs/11.x/validation — validation includes rule objects and closures, so preserve semantic rule provenance rather than assuming string-only rules.
- Next.js fetching data: https://nextjs.org/docs/app/getting-started/fetching-data — Server and Client Components have different data-fetching boundaries.
- Zod parsing: https://zod.dev/basics — `parse` and `safeParse` expose explicit success/failure semantics and inferred output types.
- Axios instances: https://github.com/axios/axios/blob/v1.x/docs/pages/advanced/create-an-instance.md — transport configuration belongs to the HTTP client boundary.
- TanStack Query keys: https://tanstack.com/query/latest/docs/framework/react/guides/query-keys — query keys must uniquely identify the data and include variables that affect the result.
