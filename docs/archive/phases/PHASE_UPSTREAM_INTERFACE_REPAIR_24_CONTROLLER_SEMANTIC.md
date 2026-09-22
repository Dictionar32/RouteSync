# Phase Upstream Interface Repair 24 — Controller Semantic Boundary

Date: 2026-09-19

## Scope

Interface/upstream only. No downstream implementation migration was performed in this phase.

## Root found

`packages/core/src/compiler/scanner/subscanners/controller/controllerDataflowContract.ts` was traced as an example of the problem class:

- `ControllerSemanticVariableIndex.get()` exposed `T | undefined`.
- `collectResourceBindings()` recursively traversed raw `PhpAstValue` and reclassified expression kinds.
- `resolveModelOrigin()` inferred `model_class` vs `table` from raw AST, parameters, and previous definitions.
- static-call fallback converted unknown static calls into `model_class`.
- the consumer therefore had to repeat semantic classification instead of receiving a completed upstream contract.

## Interface repair

`packages/core/src/types/upstream/controller.ts` now carries the semantic controller contract:

- `ControllerModelOrigin`
- `ControllerVariableOrigin`
- `ControllerDefinitionAvailability`
- `ControllerVariableSemantic`
- `ControllerVariableDefinition`
- `ControllerVariableBinding`
- `ControllerResourceBinding`
- `ControllerSemanticReturn`
- `ControllerSemanticDataflow`

`ControllerAction` now includes:

```ts
readonly semantic: ControllerSemanticDataflow;
```

The semantic contract carries model/table origin and resource bindings as ADTs rather than requiring consumers to rediscover them from raw PHP AST.

## Absence policy

The upstream controller interface contains no JavaScript/TypeScript `null`, `undefined`, `any`, `??`, or `?.`.

Absence is represented explicitly with closed ADTs such as:

- `RequestBinding.no_request`
- `ControllerSemanticReturn.absent`
- `ControllerVariableSemantic.external`

## Important distinction

Source-parser branching (`if`/`switch`) is not automatically a defect. The defect is a branch whose purpose is to reconstruct semantic information that should already have been emitted by the upstream contract.

This phase therefore raises the semantic facts first. The next migration phase must make the scanner populate this contract and remove `resolveModelOrigin()`/resource reclassification from the consumer boundary.

## Verification

Search over `packages/core/src/types/upstream` found no matches for:

- `null`
- `undefined`
- `any`
- `??`
- `?.`

`controller.ts` remains 76 lines, below the project's 100-line file target.

## Workspace

Active workspace remains:

`/mnt/data/routesync-active/RouteSync`

No ZIP/checkpoint archive was created.
