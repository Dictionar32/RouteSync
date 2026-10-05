# Phase 900 — Upstream HasMiddleware Evidence

- Controller method AST now preserves `instance | static` storage evidence.
- Controller declaration preserves interface evidence sufficient to recognize `HasMiddleware`.
- Static `middleware()` is excluded from action-method projection when the controller implements `HasMiddleware`.
- Return-array middleware evidence is projected into existing `ControllerMiddlewareRelation` with `origin: has_middleware`.
- `new Middleware(..., only: [...])` and `except: [...]` retain action applicability.
- Middleware targets remain expressions when they cannot be safely reduced to a `MiddlewareName`.
- Route middleware remains the effective-policy authority; this phase only adds a controller evidence producer.
