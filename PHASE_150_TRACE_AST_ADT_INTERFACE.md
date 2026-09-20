# Phase 150 — Trace AST → ADT → Binding Origin

## Flow

`ecommerce_shop → PHP AST → ResourceFieldExpression → ResourceExpressionModel → ResourceBindingOrigin`

## Trace finding

`ResourceBindingRoot` already had `controller_this`, and provenance/path builders already preserved `$this` as `controller_this`. However `resourceBindingOriginResolver` converted `$this` into `unsupported_expression`.

The resolver also rejected several expression requirements even when their children already carried binding origin information:

- function_call
- computation
- nested_object
- nested_array
- unary
- match
- construct
- instance_of

This caused semantic information to be discarded before traversal/binding consumers received it.

## Interface elevation

`ResourceBindingModelOrigin` now explicitly contains:

- `controller_this`
- `model`
- `resource`
- `variable`
- `unknown`

`unknown.reason` now distinguishes:

- `external_variable`
- `no_binding_origin`
- `unsupported_expression`

`no_binding_origin` means the expression is valid semantic vocabulary but does not itself identify a model/resource binding origin (for example a class reference or closure). This is different from unsupported syntax.

## Resolver repair

Origin is now propagated through semantic children:

- function call → arguments
- computation → left/right operands
- conditional/null-coalesce → branches
- nested object → field values
- nested array → entry values
- unary → operand
- match → subject + arm conditions + arm values
- construct → constructor arguments
- instance_of → tested expression
- arrow function → body

`$this` now resolves to `controller_this` instead of `unsupported_expression`.

## Important architectural distinction

The resolver still contains centralized AST/ADT dispatch. That dispatch is an origin-boundary operation; it does not force downstream consumers to infer meaning from syntax.

The target remains:

`source syntax → semantic ADT → meaning-preserving binding model → dumb downstream`

not:

`source syntax → lossy interface → downstream re-classification`.

## Validation

Command:

`npx tsc -p tsconfig.phase87.33.narrow.json --noEmit`

Result: no new TypeScript errors. The only remaining compiler error is the pre-existing environment/dependency issue:

`packages/core/src/compiler/utils/Hash.ts(4,28): error TS2307: Cannot find module 'crypto' or its corresponding type declarations.`

## Next trace target

The next highest-value boundary is `resourceBindingTraversalBuilder`: its `BindingPath` still has a terminal `unsupported` state and its traversal construction contains fallback reconstruction. The next pass should elevate path/traversal state so resolved semantic targets are represented directly rather than recovered from `step.kind`/fallback state.
