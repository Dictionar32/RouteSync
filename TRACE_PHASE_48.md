# RouteSync Phase 48 — Upstream AST / No Free Semantic Data Trace

## Goal
Raise the Laravel/PHP expression model so semantic downstream layers consume typed ADTs rather than free-form strings.

## Before
```text
PHP → tokenizer → PhpAstValue
                 ├─ resourceName: string
                 ├─ argument: string
                 ├─ target: string
                 ├─ property: string
                 ├─ condition: string
                 └─ raw_expression: string
```

This allowed later scanners/binders to re-parse or regex semantic meaning from strings.

## After
```text
PHP
 ↓
tokenizer
 ↓
Laravel PHP AST
 ├─ Literal
 ├─ VariableReference
 ├─ PropertyPath
 ├─ MethodChain
 ├─ StaticCall
 ├─ ResourceSingle
 ├─ ResourceCollection
 ├─ Ternary
 ├─ NestedArray
 └─ Unknown
 ↓
semantic resolver
 ↓
ControllerExpressionContract
 ↓
ControllerActionContract
 ↓
Route Contract / Manifest / IR
 ↓
pure lowerers
 ↓
emitter
```

## Changes
- Removed `raw_expression` from `PhpAstValue`.
- `resourceName` is `AstIdentifier`.
- resource arguments are `PhpAstValue`, not strings.
- member targets are `PhpPropertyPath` (`root + steps`).
- member properties are `AstIdentifier`.
- ternary condition is `PhpAstValue`.
- added structured `static_call` AST.
- unknown expressions become explicit `{ kind: 'unknown' }`.
- `PhpArrayEntry.rawExpression` remains only as **syntax provenance** for legacy adapters; it is explicitly not part of the semantic AST value and must be removed from binder APIs in the next phase.
- `ControllerExpressionContract` now directly projects the structured AST and no longer reparses expression strings.
- exhaustive AST algebra now handles the ADT directly and no longer has a `rawExpression` branch.

## Ecommerce-shop register trace
```text
AuthController::register
  ↓
ControllerDeclarationAst
  ├─ parameter: named(RegisterRequest)
  ├─ response: declared(RegisterResponse)
  └─ return: NestedArray
       ├─ success → Literal(Boolean)
       ├─ message → Literal(String)
       └─ data → Literal(Null)
  ↓
ControllerActionContract
  ↓
RuntimeReturnContract
  ↓
Route semantic contract
  ↓
Manifest / IR
```

No downstream layer needs to inspect the original PHP return expression to understand these three fields.

## Remaining boundary
`PhpArrayEntry.rawExpression` and legacy resource binder parameters still exist for compatibility with older scanners. They are now explicitly marked as syntax provenance, but they are not yet fully eliminated from every legacy adapter.

Next architectural step: replace those binder `rawExpression` parameters with typed expression ADTs and model `whenLoaded`, validation rules, casts, and resource/model invocations as explicit Laravel syntax/semantic nodes.
