# Phase 33 — Controller Dependency Resolution as Upstream ADT

Laravel 13 documents controller dependencies as service-container resolution. Contextual attributes and contextual bindings can refine how the container supplies a dependency, while route/model binding is a separate routing concern.

RouteSync therefore keeps these concepts separate:

```text
PHP parameter AST
  -> controller dependency resolver
  -> ControllerDependency (semantic interface)
       - parameter: VariableName
       - type: ClassName
       - injection: ControllerDependencyInjection ADT
       - resolution: ControllerDependencyResolution ADT
  -> ControllerActionFlowContract
  -> LaravelSemanticContractCatalog
  -> dumb consumer
```

`ControllerDependencyResolution` currently has the canonical `container` case. This is intentionally an ADT so future contextual/container variants can be added upstream without exposing PHP attributes, tokens, or parameter positions to consumers.

Implicit model binding remains on `RouteParameterBinding` and is not folded into `ControllerDependency`; Laravel's routing semantics establish it from route parameters and type-hinted models.

The controller high-level union now preserves `ControllerActionFlowContract`, preventing generic consumers from losing the dependency-flow capability.
