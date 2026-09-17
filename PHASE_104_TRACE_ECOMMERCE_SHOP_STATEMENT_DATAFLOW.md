# Phase 104 — ecommerce_shop Statement & Dataflow Preservation

## Ground truth

The fixture is the actual Laravel source archive from the Library: `ecommerce_shop-main (7).zip`.
Generated `routesync.manifest.json` is not used as syntax or response-semantic ground truth.

## Source scan

The archive contains 84 PHP/JSON files under the application/routes/database scan surface used for this phase.
Observed lexical occurrences in `app`, `routes`, and `database` include:

| Construct | Occurrences |
|---|---:|
| `?->` | 42 |
| `??` | 71 |
| `?:` | 15 |
| `match (` | 6 |
| `if` | 107 |
| `foreach` | 13 |
| `for` | 11 |
| `try` | 1 |
| `catch` | 1 |

The control-flow counts are lexical occurrences, not claims about distinct executable statements.

## Repair

The PHP statement ADT now preserves:

- expression statement
- return with value
- return without value
- assignment
- if / else / else-if
- foreach
- for
- try / catch / finally
- throw

`for` clauses preserve assignment clauses separately from ordinary expression clauses.

The controller body now exposes a typed `dataflow` value containing:

- local variable definitions
- variable references
- explicit variable origin: parameter, local assignment, or external

An assignment does not resolve its own right-hand-side variable reference to the definition being created.
Loop and catch bindings are introduced before traversing their contained bodies.

EOF/closing-brace tokens are not emitted as trailing expression statements by the block parser.

## Boundary trace

Example source:

```php
$detail = Payment::find($id);
$gateway = $detail['gateway'] ?? null;
return $gateway;
```

Flow:

```text
$detail = Payment::find($id)
  -> assignment
  -> definition detail @ statement 0
  -> id -> parameter

$gateway = $detail['gateway'] ?? null
  -> assignment
  -> array_access
  -> null_coalesce
  -> detail -> local_assignment @ statement 0
  -> definition gateway @ statement 1

return $gateway
  -> return_with_value
  -> gateway -> local_assignment @ statement 1
```

Control-flow probe:

```text
if_statement
foreach_statement
try_statement
```

were preserved as structured statement variants rather than flattened expression statements.

## Remaining boundary

This phase establishes statement/dataflow preservation, but it is not a full PHP control-flow analysis. In particular, branch-sensitive dominance and merge semantics are not yet modeled. A definition created only inside one branch must not later be treated as unconditionally available without a control-flow merge model.

Next repair target:

```text
control-flow scope
  -> branch/loop binding environment
  -> merge/definite-assignment ADT
  -> resource field dataflow
  -> semantic type resolution
  -> domain IR
```

## Verification

Focused TypeScript compilation of the changed scanner/semantic files passed.
Runtime probes against representative Laravel constructs passed for:

- assignment -> later reference
- parameter origin
- array access + null coalesce
- if/else
- foreach key/value binding
- for statement
- try/catch/throw

The repository was not declared globally green because unrelated legacy modules are outside this phase boundary.
