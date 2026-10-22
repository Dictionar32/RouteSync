# Phase 2103 — Controller Executor Interface Boundary

## Change summary

The controller scanner now consumes an explicit `LaravelControllerActionExecutionInterface` rather than importing and invoking `scanControllerAction` directly. The interface carries the exact invocation judgment, and the adapter takes its source identity from that judgment rather than receiving an independently supplied source-file value. The current implementation remains bound in `laravelControllerExecutionDependencies.ts`, where legacy action execution, source reading, controller producer, and AST projection helpers are composed explicitly.

The controller scanner and controller producer no longer import `semantic/relations` directly. The producer's `actions` result is now a readonly array; the AST's `methods` field remains a `Sequence` because that is still the canonical AST contract.

## Important limitation

This phase creates a real dependency-inversion boundary and removes direct relation imports from two files, but it does not retire the old semantic implementation. The composition module still imports subscanners, and the broader core/CLI graph still has 377 files importing relation modules and 24 importing subscanners. Do not delete those directories yet.

## Validation

The Phase 2098–2103 static audits pass 73/73 checks. Build, typecheck, and Vitest were not run.
