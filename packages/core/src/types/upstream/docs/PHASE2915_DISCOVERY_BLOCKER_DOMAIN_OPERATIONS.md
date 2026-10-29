# Phase2915 — Discovery Blocker Domain Operations

## Trace

`controllerSourceDiscovery.discover` -> filesystem adapter -> `filesystemFailureCodeJudgmentFactory` -> `laravelControllerSourceDiscoveryBlockerFactory` -> `laravelControllerSourceDiscoveryJudgmentFactory.blocked` -> CLI manifest composition.

## Existing upstream contract evolved

The existing `LaravelControllerSourceDiscoveryBlocker` contract in `laravelControllerInvocationSemanticJudgmentInventoryInterface.ts` now carries `continueWith` operations for each variant. Its existing factory is exported from the core barrel and used by the CLI. No parallel blocker authority or generic collection ADT was added.

A distinct `controller_source_discovery_failure_code_unrecognized` variant retains the observed error code as `StringValue`. It is no longer collapsed into `directory_unreadable`. Known `ENOENT`, `ENOTDIR`, `EACCES`, and `EPERM` codes retain their existing domain paths.

## Boundary that remains

The filesystem adapter still receives `unknown` and extracts `error.code` with `Reflect.get`; it normalizes that boundary value to `StringValue`. This phase preserves unknown-code evidence after extraction, but does not claim all primitive interpretation has been eliminated. Missing `error.code` is represented by the adapter's `UNKNOWN` sentinel and remains a follow-up design concern because it is not a literal observed code.

## Validation scope

Run `npm run audit:phase2915-discovery-blocker-domain-operations`. This structural audit does not substitute for project-wide typecheck, build, unit tests, or CLI end-to-end tests.
