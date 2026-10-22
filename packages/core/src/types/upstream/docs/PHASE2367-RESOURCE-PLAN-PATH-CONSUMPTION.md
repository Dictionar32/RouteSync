# Phase 2367 — Resource Plan Path Consumption

The resource judgment executor no longer reparses the planned URI through `resolveRoutePath`. It consumes the path, resource identity, and parameter-name judgment already supplied by `RouteResourceFlowJudgment.plan`. The upstream plan also aligns shallow item parameter names with the shallow path shape.

This is a bounded correction to the active execution path, not a complete interface-first migration. The active scanner still imports a subscanner emitter, the resource authority still depends on `semantic/relations`, and target projection fields are still materialized by the executor. Type-check and CLI end-to-end execution remain unverified in this archive environment.
