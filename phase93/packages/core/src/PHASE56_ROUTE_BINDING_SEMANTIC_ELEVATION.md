# Phase 56 — Route Binding Semantic Elevation

Laravel route URI binding syntax is now preserved in the route AST and elevated
upstream into `RouteBindingContract`.

`RouteAst` is not removed. `RouteProducer` remains an upstream AST producer.
The new semantic contract only projects facts that are already known from the
URI; it does not guess that a parameter is an Eloquent model.

Laravel's implicit model binding requires the URI parameter name to match the
controller / route callback type-hinted model. Custom `{post:slug}` keys are a
separate URI fact. `scopeBindings`, explicit bindings, and model resolution
remain additional upstream facts and are not conflated with URI parsing.

Flow:

Laravel source -> RouteDeclarationAst -> RouteProducer -> RouteAst
-> RouteBindingContract -> CompleteLaravelSourceModel -> RouteSyncManifestFlow
