# Phase 1362 — Canonical Schema Shape Ownership

## Finding

The public `RouteSchemaPayload` contract defines request schema shape as ordered `fields`, `messages`, and `attributes`. It does not define a `rules` map. Three CLI paths nevertheless tested `schema.rules`:

- custom/singleton resource-group classification;
- form payload type resolution;
- SDK API body-mapper emission.

Those checks were a stale parallel representation. In particular, a schema with canonical `fields` could be treated as absent by consumers still looking for `rules`.

## Change

`hasCanonicalRequestFields(schema)` is now exported from the upstream route capability semantic authority and uses only `RouteSchemaPayload.fields`. The existing route capability authority uses the same predicate internally, so capability reasoning and target projection share one schema-shape fact.

The three CLI consumers call that predicate. No Laravel rule parsing, `schema.rules` fallback, or second classifier was added. Enum constants remain based on the canonical `ValidationRuleNode` ADT from Phase 1361.

## Boundary

```text
Laravel FormRequest / controller evidence
  -> canonical RequestField + ValidationRuleNode ADT
  -> RouteSchemaPayload.fields
  -> hasCanonicalRequestFields (upstream schema-shape fact)
  -> CLI form/group/API mapper projection
```

Operation identity remains a separate capability: route identity and reasoning are sealed upstream, then projected by CLI → SDK → React. Semantic dataflow remains distinct from AST and structural graph relations; IR consumes semantic dataflow while graph projection consumes structural relations.

## Validation

Run:

```sh
npm run audit:phase1362-canonical-schema-shape-ownership
```

The audit checks the public schema contract, authority reuse, all three CLI consumers, absence of `schema.rules` in those production consumers, operation identity, manifest/dataflow/IR/graph boundaries, and preservation of the build/toolchain declarations.

Full build remains unverified because this workspace has no installed `node_modules/tsdown`; do not interpret this static audit as a build pass.

## Related compiler/framework references

- MLIR Interfaces: https://mlir.llvm.org/docs/Interfaces/ — analyses/transforms should query a stable interface instead of special-casing each concrete operation.
- CodeQL JavaScript/TypeScript data flow: https://codeql.github.com/docs/codeql-language-guides/analyzing-data-flow-in-javascript-and-typescript/ — AST nodes and dataflow nodes are related but not interchangeable representations.
- TypeScript 7.0 announcement: https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/ — 7.0 does not ship a programmatic compiler API; tooling that needs it should use the compatibility arrangement documented there.
- Laravel validation: https://laravel.com/framework/docs/validation — `FormRequest::rules()` is source evidence; RouteSync parses it at scanner origin and lowers it to typed rule ADTs.
- Next.js type safety: https://nextjs.org/docs/app/api-reference/config/typescript — end-to-end type safety depends on preserving typed boundaries through data flow.
- Zod: https://zod.dev/basics — runtime parsing/validation belongs to the generated target contract, not to Laravel semantic authority.
- Axios instances: https://axios-http.com/docs/instance — target HTTP client configuration remains a runtime concern.
- TanStack Query TypeScript: https://tanstack.com/query/latest/docs/framework/react/typescript — inferred result types depend on well-typed query functions and keys.
