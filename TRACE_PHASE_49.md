# RouteSync Phase 49 — AST Boundary Hardening / No Free Expression Data

## Objective
Continue the upstream-first dataflow repair. The previous phase removed raw expression text from `PhpAstValue`, but `PhpArrayEntry` and legacy binders still transported `rawExpression` as a second channel. That created two sources of truth: the typed AST and the original expression string.

## Trace: before Phase 49
```text
Laravel PHP source
  ↓
tokenizer
  ↓
PhpAstValue
  + PhpArrayEntry.rawExpression
  ↓
resource/form/model binders
  ├─ typed AST
  └─ raw string reparsing / regex
```

The second branch was the architectural leak. A semantic consumer could still ask for the string instead of consuming the AST.

## Trace: after Phase 49
```text
Laravel PHP source
  ↓
tokenizer
  ↓
Laravel PHP AST
  ├─ Literal
  ├─ VariableReference
  ├─ PropertyAccess
  ├─ MethodChain(arguments)
  ├─ StaticCall(arguments)
  ├─ ClassReference
  ├─ ResourceSingle
  ├─ ResourceCollection
  ├─ Ternary
  ├─ NestedArray
  └─ Unknown
  ↓
semantic contracts / binders
  ↓
RouteSync domain vocabulary
  ↓
Manifest / IR
  ↓
pure lowering
```

## Concrete fixes

### 1. `PhpArrayEntry` is now single-source
Removed:
```ts
rawExpression: string
```
An array entry now carries only:
```ts
interface PhpArrayEntry {
  readonly key: AstIdentifier;
  readonly value: PhpAstValue;
}
```

The parser may inspect source text while parsing, but the source text is not transported as semantic data.

### 2. Method calls became structurally complete
`method_chain` now contains:
```text
 target
 method
 arguments: PhpAstValue[]
 nullsafe
```

This allows Laravel constructs such as:
```php
$model->whenLoaded('profile')
$response->json([...])
```
to be consumed from AST structure rather than searching a source string.

### 3. Class references became an explicit ADT
Added:
```text
class_reference { className: AstIdentifier }
```
This supports expressions such as:
```php
SomeCast::class
```
without parsing `::class` from a raw string later.

### 4. `whenLoaded` no longer uses regex
The binder now reads the first method-call argument and requires a string literal relation name.

```text
MethodCall
  method = whenLoaded
  arguments
    └─ Literal<String>(relation)
```

Invalid structure fails at the boundary instead of fabricating an `unknown` relation from text.

### 5. Model casts consume AST
Model cast extraction now accepts only:
```text
Literal<String>
ClassReference
```
Unsupported cast expressions are rejected rather than converted through a raw-expression fallback.

### 6. Validation rule collection consumes AST
Validation rule strings are reconstructed only from typed string-literal AST nodes and nested arrays of those nodes. The collector no longer consumes `rawExpression`.

## Ecommerce-shop trace
For `AuthController::register`:

```text
return response()->json([
    'success' => true,
    'message' => 'Register berhasil. Silakan login.',
    'data' => null,
]);
```

The important path remains:

```text
PHP tokens
  ↓
NestedArray AST
  ├─ success → Literal<Boolean>
  ├─ message → Literal<String>
  └─ data → Literal<Null>
  ↓
ControllerExpressionContract
  ↓
ControllerActionContract
  ↓
Route contract
  ↓
Manifest / IR
```

There is now no parallel `rawExpression` channel on the array entries used by this path.

## Remaining high-level architectural debt
This phase deliberately does not claim that the entire repository contains no free data. Several older domain/client/emitter structures still use `Record<string, unknown>`, optional metadata, or string-shaped semantic fields. Those are separate boundaries and should be lifted only after their actual origins are traced.

The next upstream target is the member-expression model itself. `PhpPropertyPath` still compresses a member chain into `root + steps`; it should eventually become a recursive expression AST so constructs such as nested calls and chained accesses retain their exact structure without flattening.

## Verification
- AST-related changed files were checked with TypeScript 5.8.3 using a focused `tsc --noEmit` invocation.
- No diagnostics were emitted from the Phase 49 AST/binder files in that focused check.
- The repository-wide type surface still contains unrelated pre-existing barrel/type errors, so this is not reported as a full repository typecheck.
- Static scan of `packages/core/src/compiler/scanner` shows no remaining `rawExpression`, `raw_expression`, or `PhpExpressionSource` references.
