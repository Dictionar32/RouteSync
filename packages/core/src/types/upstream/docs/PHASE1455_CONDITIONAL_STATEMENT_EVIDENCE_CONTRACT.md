# Phase 1455 — Conditional Statement Evidence Contract

## Migration boundary

This phase migrates the `if` / `else if` / `else` syntax-evidence traversal from `astClassifierRuntime.ts` into `scannerConditionalStatementContractAlgebra` behind `ScannerConditionalStatementInterface`.

The algebra returns source partitions and a closed judgment:

- `resolved`: condition, then-body, else branch, and unconsumed suffix;
- `not_applicable`: the suffix does not begin with `if`;
- `malformed`: missing or malformed condition/body/else structure with source location and a closed reason.

The algebra delegates delimiter matching to `scannerTokenStructureInterface`; it does not implement a second delimiter scanner. Nested `else if` chains are represented recursively and preserve the remaining suffix.

The runtime now projects resolved evidence into existing AST nodes. It does not rediscover conditional delimiters or independently scan for `else`. AST construction and expression/body projection remain runtime responsibilities.

## Required direction

`source tokens → token-structure evidence → conditional statement algebra → closed judgment → interface → runtime wiring → AST projection`

The interface is a contract, not the implementation. The algebra owns syntax-evidence reasoning. The runtime owns AST construction. Cursor arithmetic is limited to converting the returned suffix partition into the sequence cursor expected by the existing sequence algebra.

## Scope limits

This phase migrates conditional statement evidence only. Loop, `switch`, and `try/catch/finally` parsing still use runtime-local structure traversal and remain separate migration candidates. This phase does not claim whole-project type-check, build, or AST end-to-end equivalence. A runtime integration attempt currently hits a `RangeError: Maximum call stack size exceeded` in the existing expression-classification path (`classifyAstTokens` → `classifyMatch` / `classifyCast` → `classifyAstTokens`), before AST equivalence can be assessed; this is recorded as an unresolved downstream blocker, not a passing test.
