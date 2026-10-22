# Phase 2111 — Typed ClassName Judgment

## Finding
Phase 2110 introduced a discriminated judgment but used `string` for its resolved class name. That weakened an existing semantic contract: `ClassName` already exists in `packages/core/src/types/upstream/names.ts`.

## Change
`ControllerParameterClassNameJudgment` now carries `ClassName`. The resolver constructs this semantic type at the model/request interpretation boundary and dependency construction forwards `typeJudgment.name` directly. It no longer unwraps the name into a raw string and re-wraps it downstream.

## Scope
This is a focused scanner correction. It does not claim that the complete scanner dependency graph is free from legacy subscanners, `semantic/relations`, or `semantic/foundation`. The adapter and remaining resolver dependencies still require further migration.

## Verification
The Phase 2110 audit was strengthened to require `ClassName` preservation and reject the previous string intermediate. Static audits only; build, typecheck, and Vitest were not run.
