# Phase 335 — Strict Relational Authority Audit Snapshot

Generated from `scripts/audit-relational-authority-strict.cjs`.

The audit is intentionally failing: the purpose is to make the remaining migration surface measurable rather than hide it. Tests and `__archive__` are excluded.

- files scanned: 313
- files with violations: 226

| construct | count |
|---|---:|
| `if` | 947 |\n| `for` | 170 |\n| `while` | 46 |\n| `switch` | 105 |\n| `map` | 271 |\n| `filter` | 80 |\n| `reduce` | 4 |\n| `flatMap` | 42 |\n| `nullish` | 113 |\n| `undefined` | 781 |\n| `nullLiteral` | 79 |\n| `strictEquality` | 2509 |\n| `asAssertion` | 924 |\n

The counts are implementation constructs in the selected authority roots, not PHP source-language vocabulary embedded in strings.
