# Phase 1698 — Laravel Scanner Interface Closure

## Scope

Interface-first contract correction only. No scanner wiring was changed in this phase.

## Trace findings

1. `laravelSourceAstPipeline` consumes both `routeBundle.asts` and `routeBundle.flows`, but the route scanner interface exposed only `RouteAst[]`. That interface could not represent the actual complete product of one route scan. It now returns a closed `LaravelRouteScanJudgment` containing both ASTs and semantic route flows.
2. The FormRequest scanner implementation's canonical bundle preserves `sources`, `asts`, and `definitions`. Controller semantic derivation consumes `FormRequestSource` evidence. The public FormRequest judgment previously omitted that source evidence, making the contract insufficient to wire controller scanning without reaching around the interface. The judgment now preserves all three products.
3. Invocation semantics already have a distinct upstream pipeline: `invocationSemanticPipeline` delegates to `invocationSemanticRuntimeExecutor`, and `controllerDataflowAnalyzer` consumes `analyzeKnowledge`. Do not create a second invocation resolver inside Laravel scanner wiring.
4. The legacy Route/Controller/Model/FormRequest/Resource/Channel scanner classes remain. They are not deleted or emptied because interface wiring and consumer migration are not complete.

## Remaining contract gap before wiring

- Route: current interface input uses `ControllerActionFlowContract[]`, while the legacy implementation consumes a nested `RelationIndex` of `ControllerActionInfo`. The migration must establish a typed upstream binding judgment/adapter; do not cast or reconstruct meaning in the facade.
- Resource: current interface input does not yet equal the legacy scanner's `ModelSymbolTable` + `ControllerResourceDataflow` input. Establish a high-level closed resource-binding knowledge contract from model relations and controller action judgments before wiring.
- Controller: its public input carries `FormRequestSource[]`; index construction is mechanical preparation, but request/controller semantic resolution must remain owned by the relevant semantic authority.

## Verification

- `npm run audit:phase1698-laravel-interface-closure`: static contract audit.
- Full build/typecheck not claimed by this phase. The existing environment previously lacked `tsdown` and required ambient type packages.

## Next order

1. Close route-controller binding judgment contract.
2. Close resource-model/controller binding judgment contract.
3. Wire subscanner implementations to interfaces without semantic reclassification.
4. Migrate all consumers and verify source evidence / judgment identity.
5. Only then empty legacy scanner entrypoints in place; delete only after consumer search proves they are unused.
6. Run build, typecheck, tests, and ecommerce fixture end-to-end.
