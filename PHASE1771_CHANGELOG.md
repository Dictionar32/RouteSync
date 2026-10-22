# Phase 1771 Changelog

- Tightened `PhpFunctionNameResolutionInput` to consume an explicit `PhpFunctionResolutionEnvironmentJudgment`.
- Added source-bound completeness witness for namespace, function-import, and function-declaration inventory.
- Distinguished complete and incomplete function-resolution environments so empty collections cannot imply completeness by accident.
- Added `scripts/audits/phase1771-function-resolution-environment-closure.mjs` and npm audit script.
- Preserved existing invocation judgment and integrated publication/response contracts without introducing a new projection layer.
- Recorded the remaining active Laravel scanner limitation: function-call AST still reduces the callee to one `AstIdentifier`, and the resource mapper still calls the legacy name-only function-call authority.
