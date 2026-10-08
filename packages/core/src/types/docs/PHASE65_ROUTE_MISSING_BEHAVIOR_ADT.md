# Phase 65 — Route Missing Behavior ADT

Laravel 13 documents `Route::missing(...)` as customization for the behavior when an implicitly bound model is not found; without customization Laravel normally returns a 404.

This phase elevates that fact upstream:

```text
Route AST
  -> missingHandler fact
  -> RouteMissingBehaviorFlow
  -> RouteSemanticFlow
  -> downstream interface
```

The downstream flow does not inspect PHP tokens or closures. It only receives either `default_404` or `custom_handler`. The implementation deliberately does not attempt to reconstruct or execute the closure body.
