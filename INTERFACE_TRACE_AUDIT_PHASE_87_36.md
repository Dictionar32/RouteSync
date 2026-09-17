# RouteSync Phase 87.36 — Upstream Framework ADT Trace

## Objective
Move framework method registry output from porous legacy fields (`type`, `model?`, `collection?`, `fields?`) into a closed ADT at the semantic origin boundary.

## Flow
Laravel AST → ResolverMeta → FrameworkRegistry ADT → SemanticResolution → Bound AST → downstream.

The registry now describes exactly one return family:
- scalar + SemanticType
- model + ModelName/cardinality/pagination
- object + typed fields

No downstream resolver reads optional legacy return properties.

## Important boundary
Legacy scanner input may remain flexible before verification. Once data crosses the semantic boundary it must be represented by closed ADTs.

## Remaining migration targets
1. `FieldNode.resolved?` still mixes syntax and semantic state.
2. `FrameworkRegistry.ts` still uses string-keyed tables as an origin registry. The values are now semantic ADTs.
3. `ResolutionContext` still exposes string-keyed maps for compatibility.
4. Some unrelated expression plugins still use `unknown` as parser-error/internal compatibility values.

## Verification
Targeted TypeScript check was run against `tsconfig.phase87.33.narrow.json`; no diagnostics were emitted for FrameworkRegistry, FrameworkRegistryResolver, ModelNode, semantic resolution, bound AST, semantic values, semantic context, or context builder modules.
