# Phase 2058 — Static-Call Origin Argument Rule Interface First

## Trace finding

The Phase 2057 static-call authority had a declarative ordered rule registry for class/method applicability, but `DB::table` still interpreted table-argument variants inside one callback. This left argument semantics less explicit than the parent static-call rule contract.

## Change

- Added `ControllerStaticCallOriginArgumentRuleInterface` with a closed rule identity and typed `evidenceKind`.
- Extended each `ControllerStaticCallOriginRuleInterface` with an explicit `argumentRules` collection.
- Registered the three DB table argument cases: static string literal, absent argument, and unsupported argument shape.
- Kept `controllerStaticCallOriginAuthority` as the sole static-call origin authority and bumped its contract version to 3.
- Preserved `controllerResourceBindingAuthority`, invocation authority, integrated response authority, and AST rule algebra. No relation/foundation subscanner or parallel authority was introduced.
- Added focused regression coverage for rule registration and all three argument outcomes.

## Boundary

The scanner continues to project PHP AST facts into typed evidence. The authority selects the applicable class/method rule and the DB table argument subrule. The remaining discriminated-union elimination inside the literal rule is type narrowing over the evidence ADT, not a second scanner-level classification.

## Intended flow

`PHP AST → typed static-call input → registered static-call rule → registered argument subrule → closed origin judgment → resource model-origin judgment → resource binding judgment`

## Verification boundary

The structural audit and parser checks are not substitutes for full typecheck, build, or Vitest execution. Those full project commands were not run in this environment.
