# Phase 55 — Laravel Route Group Semantic Elevation

Laravel route-group syntax is interpreted upstream into `RouteGroupContext`.

The route declaration AST remains intact and continues to feed `RouteProducer`, which constructs `RouteAst`. The new group facts are additional semantic ADTs, not a replacement for AST.

Elevated facts:
- middleware inheritance
- URI prefix
- route name prefix
- group controller
- domain
- scoped / without-scoped model binding
- `where` constraints

Downstream `RouteSyncManifestFlow` remains AST-free. It consumes the completed semantic source model rather than interpreting Laravel syntax.
