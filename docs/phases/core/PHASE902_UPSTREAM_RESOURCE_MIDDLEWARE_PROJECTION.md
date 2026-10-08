# Phase 902 — Upstream Resource Middleware Projection

Route resource middleware evidence is now projected into the canonical route middleware contract.

- `middleware` becomes `RouteMiddlewareContract` with `source: resource` and `scope: all`.
- `middlewareFor` becomes `RouteMiddlewareContract` with `scope: only`.
- `withoutMiddlewareFor` becomes `RouteMiddlewareExclusionContract` with `scope: only` because Laravel excludes the named middleware only for the specified resource actions.
- Middleware parameters after `:` are preserved as `StringValue[]`.
- Multiple middleware values in one Laravel call produce multiple canonical relations.
- The resolver remains AST-free; this phase only performs semantic projection.
