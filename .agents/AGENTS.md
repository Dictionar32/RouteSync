# RouteSync Agent Operating Flow

## Ground Truth

For Laravel scanner/AST/ADT work, the authoritative source is the actual Laravel project in the Library, specifically the `ecommerce_shop` source archive when that project is the requested fixture. Never treat `routesync.manifest.json` or another generated manifest as the source of truth for syntax or response semantics.

## Mandatory Repair Flow

When asked to `trace`, `saran perbaikan`, or `perbaiki`, execute this order:

1. **Trace source first**
   - Locate the actual Laravel source.
   - Enumerate constructs actually used by controllers, resources, requests, models, and routes.
   - Record examples of every construct that affects generated dataflow/contract.

2. **Trace the complete dataflow**
   ```text
   Laravel source
     -> lexer/token ADT
     -> expression AST ADT
     -> statement/dataflow AST
     -> semantic/controller contract ADT
     -> domain graph/IR
     -> lowerer
     -> emitter
   ```
   At every boundary ask: **what information was present upstream and is missing downstream?**

3. **Repair interfaces before implementation logic**
   - Prefer closed ADTs with explicit domain vocabulary.
   - Do not introduce `Record<string, unknown>` as a substitute for missing vocabulary.
   - Do not use `unknown`, `any`, `null`, `undefined`, optional `?`, or defensive fallback to represent a semantic case that can be modeled by an ADT.
   - Do not use a free `string` discriminator such as `kind: string`.
   - Do not use boolean flags when the states are semantically distinct, e.g. `isDefault`; use ADT variants.
   - Do not duplicate the same semantic data under two fields, e.g. `arguments` plus `argumentDescriptors`. Choose one SSOT representation.

4. **No semantic information loss**
   Every source construct observed in the fixture must map to an explicit AST/ADT variant. If a construct is genuinely unsupported, keep a closed `unsupported` variant with a typed reason and trace it. Never silently convert a known construct to `unknown`.

5. **Special AST rules**
   - PHP arrays must preserve positional, keyed, and computed keys.
   - Match expressions must distinguish conditional arms from the default arm.
   - Assignments must preserve target and value so later variable references can be resolved by dataflow.
   - Array access, function calls, null coalesce, short ternary, binary/unary expressions, casts, and match must remain explicit through every required boundary.
   - PHP `=>` is array/match structure, not a binary expression operator.
   - Lexer operators must use a closed operator vocabulary rather than `OPERATOR + string`.
- Verify `??`, `?:`, `??=`, `===`, `!==`, comparison, arithmetic, logical, and concatenation operators as distinct token variants against real fixture snippets.

6. **Trace consumers after changing an upstream interface**
   Search every consumer of changed fields. Examples: `entry.key`, `keyExpression`, `isDefault`, `argumentDescriptors`, and AST `kind`. Fix all consumers instead of weakening the interface to preserve old code.

7. **Verify against the real fixture**
   Regression tests must include constructs taken from the actual `ecommerce_shop` source, especially:
   - `?->`
   - `??`
   - `?:`
   - array access
   - nested arrays
   - function calls
   - casts
   - arithmetic/comparison/logical expressions
   - `match`
   - assignments used by later expressions

8. **Report remaining loss explicitly**
   The trace must state:
   - source construct count/sample,
   - AST variant produced,
   - semantic variant produced,
   - any remaining `unsupported`, `unknown`, `any`, or free string boundary,
   - exact next repair phase.

## Invariants

```text
SOURCE CONSTRUCT
  -> EXACT TOKEN/AST VARIANT
  -> EXACT SEMANTIC VARIANT
  -> NO OPTIONAL SEMANTIC FIELD
  -> NO UNKNOWN FALLBACK FOR KNOWN CONSTRUCT
  -> NO RECORD/ANY AS DOMAIN MODEL
  -> NO STRING RE-CLASSIFICATION DOWNSTREAM
  -> PURE DOWNSTREAM TRANSFORMATION
```

## Agent Rule

Never stop after changing one interface. After every repair, immediately re-trace downstream consumers and the real Laravel fixture. The goal is not merely a type-checking interface. The goal is a **complete, information-preserving dataflow model** from Laravel source to generated output.

## Mandatory Post-Repair Trace Loop

After each repair phase, run this exact loop before declaring the phase complete:

```text
1. Re-scan real ecommerce_shop source
2. Enumerate source constructs actually observed
3. Map each construct -> token variant
4. Map token sequence -> exact AST variant
5. Map AST variant -> exact semantic ADT variant
6. Trace every changed field consumer
7. Search for information collapse: unknown / any / Record / optional / boolean-state / string discriminator
8. Repair the next boundary that loses information
9. Add regression coverage for the observed source construct
10. Repeat until no known ecommerce_shop construct is silently downgraded
```

### Phase Exit Criteria
A phase is not complete merely because TypeScript compiles. It is complete only when the trace proves:
- every changed upstream field has all consumers updated;
- every known `ecommerce_shop` construct reaches a typed downstream representation;
- generic `OPERATOR` tokens are not used for known operators;
- assignments needed by later expressions remain in the statement/dataflow model;
- `unsupported` is limited to genuinely unimplemented constructs and is listed explicitly;
- generated manifests are never used to invent missing source semantics.


## Phase 103 Rule: Semantic Expression Preservation

For the Laravel source fixture `ecommerce_shop`, the resource semantic boundary must never replace a known scanner expression with `unsupported_syntax` merely because its semantic type is not yet resolved.

Known expression flow:
```text
PHP source
  -> PhpAstValue
  -> Controller/Resource semantic expression ADT
  -> verified semantic type or explicit semantic-absence state
```

The following observed constructs must remain explicit through the resource expression boundary:
- array access
- function call
- short ternary
- null coalesce
- ternary
- binary expression
- unary expression
- cast
- nullsafe/direct property access
- nullsafe/direct method call

A syntax expression may carry a temporarily unresolved semantic type, but its syntax must not be destroyed. `unsupported` is reserved for a construct for which the parser genuinely has no AST vocabulary.

When changing scanner AST fields such as `access`, `operator`, or `arguments`, search every consumer before changing the interface. Do not restore the old interface merely to make legacy consumers compile.

### Phase 103 Source Gate

Use the real Library `ecommerce_shop` source as the regression fixture. The observed baseline in the scanned archive includes approximately:
- 42 nullsafe operators `?->`
- 62 null-coalesce operators `??`
- 15 short ternaries `?:`
- 6 `match` expressions
- 27 array-access expressions
- 48 explicit scalar/object/array casts
- 229 assignment occurrences
- 93 `if` occurrences
- 3 `foreach` occurrences
- 3 `for` occurrences
- 1 `try` and 1 `catch`

These counts are source observations, not generated-manifest facts. If the fixture changes, re-scan and update the trace rather than copying old counts.

## Phase 104 Rule: Statement/Dataflow Preservation

When a Laravel expression is assigned and referenced later, the scanner must preserve both sides of the dependency:
```text
assignment target -> origin expression -> later variable reference -> origin binding
```

Controller body AST must preserve the control-flow constructs observed in the real fixture when they can affect dataflow:
- `if` / `else` / `else if`
- `foreach`
- `for`
- `try` / `catch` / `finally`
- `throw`

Do not flatten these constructs into unrelated expression statements. Do not treat a parser success with a trailing `expression_statement` for `EOF` or `}` as valid; structural delimiters must be consumed by the enclosing block parser.

Variable origins are explicit states:
- parameter
- local assignment
- external

An assignment must not resolve its own definition as the origin of its right-hand side. Loop and catch bindings are introduced by their owning control-flow statement and must be visible to the statements inside that block.

For `for` clauses, an assignment initializer/update is an assignment clause, not an arbitrary expression string.

After changing statement/dataflow ASTs, re-trace:
```text
source statement
 -> statement ADT
 -> expression ADT
 -> variable definition
 -> later reference
 -> origin
```

Do not claim dataflow completeness merely because the AST parser recognizes the outer control-flow keyword. Verify the bindings created and consumed inside the construct.


## Phase 105 Rule: Dataflow Must Cross the Semantic Boundary

Controller body dataflow is not complete when it exists only in `ControllerBodyAst`. The semantic controller contract and scanned action descriptor must carry the same dataflow without flattening it into `Map<string, string>`.

The controller resource binding vocabulary is closed: a resource binding carries its resource identity and a model origin ADT (`model_class` or `table`). Resource-model resolution may interpret that ADT against `ModelSymbolTable`, but must not reconstruct it from an untyped string map.

The controller dataflow contract must preserve the original AST dataflow plus explicit resource bindings derived from the return expression and its variable origins. Direct resource construction and static `Resource::collection(...)` forms must remain distinguishable. Typed controller parameters are valid origins for resource arguments.

Relation propagation remains a separate relation-graph concern and may retain its explicit resource-to-model graph representation; it must not be confused with controller-origin dataflow.

After this repair, trace: `controller source -> PhpStatement -> ControllerBodyAst -> ControllerDataflowAst -> ControllerDataflowContract -> ControllerResourceBinding -> ResourceModelResolver -> ModelSymbolTable`. Report any remaining branch-sensitive dominance/merge limitation instead of silently guessing.

## Phase 106: Method-Chain Origin Preservation
- Controller model-origin resolution must traverse `method_chain.receiver` back to the originating static call or parameter.
- `$query->paginate()` must preserve the model origin carried by `$query = Model::query()`.
- `DB::table(...)->...` must preserve the explicit table origin through the chain.
- Resource discovery must inspect method-chain receivers and function-call arguments so wrappers such as `response()->json(new Resource(...))` do not erase resource bindings.
- Recursive variable resolution must guard against cyclic definitions.
- Do not reintroduce `resourceModelMap` or string-based semantic reconstruction.

## Phase 107 Rule — Branch-Aware Controller Dataflow
- Controller variable definitions must carry availability semantics at the AST boundary.
- Definitions inside conditional, loop, and catch regions are not globally definite after the region.
- Branch merge may expose only facts guaranteed on every reachable path.
- Resource/model binding must consume only definite definitions and must not select a conditional definition by reverse lexical order.
- Reference origin must retain the actual definition statement index when a definite local origin exists.
- Retrace: `Controller source -> PhpStatement -> ControllerDataflowAst -> availability -> ControllerDataflowContract -> ResourceBinding`.
