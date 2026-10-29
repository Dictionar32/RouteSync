# Phase 2786 — Resource Group Capability Runtime Operations Trace

## Change scope

This phase closes the resource-group capability authority edge used by the upstream manifest builder. The builder previously imported `resourceGroupCapabilityAuthority` from `resourceGroupCapability.ts`, which defines the type contracts but not the runtime value. The import now points at `resourceGroupCapabilityAuthority.ts`, where the authority object delegates to the canonical `resourceGroupCapabilityAlgebra`.

The exported `resourceGroupCapabilitiesFromRoutes(...)` function declaration was replaced with an explicitly typed operation object:

- `ResourceGroupCapabilityAuthorityOperationsInterface`
- `resourceGroupCapabilityAuthorityOperations.fromRoutes(routes)`

The canonical authority remains `export const resourceGroupCapabilityAuthority: ResourceGroupCapabilityAlgebraInterface = Object.freeze({...})`.

## Runtime trace

```text
CLI scan/sync invocation
  -> controller invocation manifest composition
  -> manifestBuilderOperationPreparation.prepare(input)
  -> laravelSourceAstPipelineFactory.create(dependencies, pipelineInput)
  -> sourceAstPipeline.execute()
  -> LaravelSourceAstProjectionJudgment
       |- laravel_source_ast_projection_complete
       `- blocked
  -> completeLaravelSourceModelBuilder.build(...)
       |- source_model_build_complete
       `- source_model_build_blocked
  -> resourceGroupCapabilityAuthority.compose(completeAst.ast.routeFlows)
  -> resourceGroupCapabilityAlgebra.compose(routes)
  -> ResourceGroupCapabilityContract[]
  -> SemanticDataflowManifestSurface / manifest judgment
  -> manifest projection and lowering
  -> CLI SDK generation
```

The builder must not compose route-group capabilities from a blocked AST or blocked source model. Capability slot decisions retain the existing explicit ADT: `route`, `absent`, or `ambiguous`.

## Example public use

```ts
import { resourceGroupCapabilityAuthorityOperations } from '@routesync/core';
import type { RouteSemanticFlow } from '@routesync/core';

const capabilities = resourceGroupCapabilityAuthorityOperations.fromRoutes(
  alreadyClosedRouteFlows as readonly RouteSemanticFlow[],
);
```

Callers should provide already validated, closed route flows. The operation delegates to the canonical authority; it does not independently infer or reclassify route semantics.

## Constraints preserved

- `packages/core/src/types/upstream/collections.ts` remains 0 bytes.
- No `Sequence`, `readonly T[]` replacement for the erased collection abstraction, or generic collection wrapper was introduced.
- No new reasoning primitive was introduced.
- Existing semantic-reasoning fields elsewhere in the domain were not removed or redefined.

## Verification boundary

The Phase 2786 audit is structural. It does not establish a successful whole-repository TypeScript typecheck, build, complete test suite, or end-to-end CLI execution. Those must be run in an environment with the repository's declared dependencies installed.
