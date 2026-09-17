# Interface Trace Audit - Phase 40

## Scope
Laravel route semantic vocabulary and IR nominal vocabulary.

## Trace
Raw Laravel route method/path -> RouteScanner -> domain route vocabulary -> IR.

## Findings
1. `types/ir/endpointIrTypes.ts` declared its own `HttpMethod` union although the canonical domain vocabulary already exists in `types/domain/httpVocabulary.ts`.
2. `types/ir/nominalVocabulary.ts` declared a second `RoutePath` brand although the canonical domain `RoutePath` exists in `types/domain/routeEntityDefinition.ts`.
3. `createHttpVerb()` accepted arbitrary strings and asserted them into `HttpVerb` without validating the value.
4. `createRoutePath()` asserted arbitrary strings into `RoutePath` without validating the route-path invariant.

## Fix
- IR `HttpMethod` now aliases the canonical domain `HttpMethod` through an import.
- IR `RoutePath` now reuses the canonical domain `RoutePath`.
- `createHttpVerb()` resolves only the exhaustive canonical HTTP method set and throws for unknown values.
- `createRoutePath()` enforces the leading-slash route invariant before branding.

## Result
The IR no longer owns a duplicate HTTP-method or route-path vocabulary. Runtime values cross the raw-to-domain boundary through explicit constructors instead of unchecked semantic assertions.
