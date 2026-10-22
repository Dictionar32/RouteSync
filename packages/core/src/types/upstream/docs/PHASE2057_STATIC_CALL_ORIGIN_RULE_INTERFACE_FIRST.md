# Phase 2057 — Static-Call Origin Rule Interface First

## Trace finding

`controllerStaticCallOriginAuthority.ts` previously embedded `DB::table` recognition and fallback model-origin classification in relational helper expressions. That made the supported cases implicit in the authority implementation and classified every non-`DB::table` static call as a model origin, including other database-facade calls such as `DB::select`.

## Change

- Added `ControllerStaticCallOriginRulePattern`, a closed pattern ADT: `class_method`, `class`, or `fallback`.
- Added `ControllerStaticCallOriginRuleInterface`, which pairs a declarative pattern with its typed judgment implementation.
- Changed the existing `ControllerStaticCallOriginAuthorityInterface` to contract version 2 and exposed its ordered rule registry.
- Registered `DB::table` first, all other `DB` facade calls second, and generic class-model origin as fallback.
- Replaced `relationAll`, `relationGate`, `relationOptionFold`, `relationRefine`, and `relationEqual` usage in this authority with direct typed ADT elimination and the rule-pattern evaluator. No relation/foundation subscanner was introduced.
- Added a `not_applicable` result for database-facade calls without table-origin semantics. The existing resource authority closes that result to `unresolved`, rather than misclassifying the facade as a model class.
- Preserved the existing specialized static-call origin authority and the existing resource binding authority; no parallel authority was added.

## Authority chain

`PHP AST → ControllerStaticCallOriginInput → ordered declarative rule patterns → ControllerStaticCallOriginJudgment → ControllerResourceModelOriginJudgment → resource binding judgment`

The runtime scanner remains an evidence projector. Invocation, integrated response, response attribute, and AST classification authorities are unchanged.

## Verification limits

The Phase 2057 audit checks contract shape, ordered rule precedence, the database-facade regression, scanner boundary, and the absence of relation/foundation imports from the static-call origin authority. Full TypeScript build, full typecheck, and Vitest execution are not claimed unless run in the project environment.
