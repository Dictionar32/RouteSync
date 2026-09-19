# Phase Error Repair 03 — ResourceField semantic boundary

## Status
ROOT FIX VERIFIED

## Root cause
`ResourceFieldDescriptor` sudah memiliki `semantic`, tetapi `ResourceFieldFlattener` masih membaca `semanticType`/`nullable` sebagai kontrak utama dan mencoba menginferensi ulang.

## Repair completed
- Flattener membaca `ResourceFieldDescriptor.semantic` sebagai SSOT.
- `semantic.type` menjadi input resolver.
- Nullability diturunkan dari semantic type, bukan dari field boolean terpisah.
- Nested object fields memakai `ResourceExpressionFieldModel.semantic`.
- Nested array elements memakai `ResourceExpressionModel.semantic`.
- `known` menjadi satu-satunya semantic state yang dapat diflatten; `requires_binding` dan `rejected` tidak disamarkan menjadi fallback.
- Value-object field names memakai `.value` hanya pada output formatting boundary.

## Verification
Targeted TypeScript check produced no diagnostic referencing `ResourceFieldFlattener.ts`.
Remaining diagnostics originate from other contracts (`httpVocabulary`, `validationRules`, `RequestField`, legacy `types/route.ts`, etc.).

## Important constraint
`ResourceFieldFlattener.ts` is currently 221 lines and therefore still violates the project's preferred <=100-lines-per-file rule. This is a structural cleanup item, not a semantic correctness blocker. It should be split after the surrounding contract migration is stable, without changing its dataflow.

## Next root
`httpVocabulary` — unify `RequestMimeType` across base descriptors, concrete descriptors, registry, and scanned descriptor without reintroducing string/null fallback.
