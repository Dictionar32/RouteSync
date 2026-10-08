# Phase 44 — Container Resolution Elevation

Laravel container resolution is now represented upstream as semantic contracts.

## Semantic boundaries

- `make` / `makeWith` → `ProviderContainerResolution`
- `alias` → `ProviderContainerAlias`
- `call` → `ProviderContainerInvocation`
- lifecycle operations remain `ProviderContainerLifecycleHook`
- raw `ProviderContainerOperation` remains compatibility/source trace, not the downstream contract

Laravel 13 documents `make` as container resolution and `makeWith` as resolution with explicit constructor parameters; `call` invokes a callable with container injection.
