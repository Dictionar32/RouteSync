# Phase 32 — Controller Dependency Parameter Identity Elevation

## Laravel semantic basis

Laravel 13 resolves controller dependencies through the service container. Constructor dependencies are resolved when the controller is instantiated; method dependencies are resolved when the controller action is invoked. Laravel also supports interface bindings and contextual/attribute-based resolution.

## Upstream boundary

`ControllerDependency` remains the semantic interface. Its injection mode remains the `ControllerDependencyInjection` ADT:

- `constructor`
- `method`

The interface now also exposes `parameter: VariableName`.

This is intentional: downstream consumers may need stable parameter identity, but they must not inspect `ControllerParameterAst`, parameter positions, or PHP AST names themselves.

## Flow

PHP AST parameter
→ controller dependency resolver
→ `ControllerDependency` interface
→ `ControllerAction.dependencies`
→ `ControllerActionFlowContract`
→ semantic source model / manifest
→ dumb consumer

## Non-goals

- Do not expose PHP AST from the semantic dependency interface.
- Do not turn constructor/method injection into a string discriminator.
- Do not classify route/model bindings as service-container dependencies.
