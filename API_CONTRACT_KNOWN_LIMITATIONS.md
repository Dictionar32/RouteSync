# API Contract Generation: Known Limitations & Issues

**Date:** 2026-08-09  
**Status:** Critical Analysis  
**Priority:** P0 - Blocks Production Use

---

## Executive Summary

Analisis generated output `api-contract.ts` mengungkap **3 critical bugs** yang mencegah compilation dan **2 architectural violations** yang melanggar code quality principles.

**PENTING:** `api-contract.ts` adalah **runtime validation contract** yang HARUS preserve struktur asli backend (snake_case + nested objects). Ini BUKAN untuk frontend consumption (berbeda dengan `api-read.ts`).

**Impact:**
- ❌ Generated code TIDAK DAPAT di-compile (3 TypeScript errors)
- ❌ Melanggar Single Source of Truth principle (duplicate validators)
- ❌ Melanggar Small Classes principle (ContractCodeBuilder > 400 lines)

---

## Critical Bugs (Cannot Compile)

### 🐛 Bug #1: Duplicate `validateSchema` Function Declarations

**Severity:** CRITICAL  
**Impact:** TypeScript compilation error - Cannot redeclare block-scoped variable

**Evidence:**
```typescript
// Lines 285-286 (ProdukItemResource)
export const validateSchema = (payload: unknown): ProdukItemResourceApiResponse => 
  produkItemResourceShowSchema.parse(payload);

// Lines 289-290 (OrderResource) - DUPLICATE!
export const validateSchema = (payload: unknown): OrderResourceApiResponse => 
  orderResourceShowSchema.parse(payload);
```

**Root Cause:**
`ContractCodeBuilder.buildResponseValidatorsSection()` (Line 210-250) generates generic `validateSchema` function name for ALL resources without uniqueness check.

```typescript
// ContractCodeBuilder.ts Line 239
lines.push(
  `export const validateSchema = (payload: unknown): ${pascalResource}ApiResponse => ...`
);
// ❌ Same function name for every resource!
```

**Fix Required:**
Generate unique function names per resource:
```typescript
// ✅ CORRECT:
export const validateProdukItemResourceSchema = (payload: unknown) => ...
export const validateOrderResourceSchema = (payload: unknown) => ...
```

**Implementation Location:**
- File: `packages/core/src/compiler/generators/contract-generation/ContractCodeBuilder.ts`
- Method: `buildResponseValidatorsSection()` Line 210-250
- Fix: Change `validateSchema` to `validate${pascalResource}Schema`

---

### 🐛 Bug #2: Duplicate `validateIndex` Function Declarations

**Severity:** CRITICAL  
**Impact:** TypeScript compilation error - Cannot redeclare block-scoped variable

**Evidence:**
```typescript
// Line 287 (ProdukItemResource)
export const validateIndex = (payload: unknown): ProdukItemResourceApiIndex => 
  produkItemResourceIndexSchema.parse(payload);

// Line 291 (OrderResource) - DUPLICATE!
export const validateIndex = (payload: unknown): OrderResourceApiIndex => 
  orderResourceIndexSchema.parse(payload);
```

**Root Cause:**
Same as Bug #1 - generic function name without resource prefix.

```typescript
// ContractCodeBuilder.ts Line 247
lines.push(
  `export const validateIndex = (payload: unknown): ${pascalResource}ApiIndex => ...`
);
// ❌ Same function name for every resource!
```

**Fix Required:**
```typescript
// ✅ CORRECT:
export const validateProdukItemResourceIndex = (payload: unknown) => ...
export const validateOrderResourceIndex = (payload: unknown) => ...
```

---

### 🐛 Bug #3: Undefined `Schema` in Exports Object

**Severity:** CRITICAL  
**Impact:** TypeScript compilation error - No value exists in scope

**Evidence:**
```typescript
// Line 372
export const ContractSchemas = {
  // ... other exports ...
  ProdukItemResourceResponse: { Schema, IndexSchema },  // ❌ Schema undefined!
  OrderResourceResponse: { Schema, IndexSchema }        // ❌ Schema undefined!
};
```

**Expected Values:**
```typescript
// The actual schema names generated:
produkItemResourceShowSchema   // Not "Schema"
produkItemResourceIndexSchema  // Not "IndexSchema"
```

**Root Cause:**
`ContractCodeBuilder.buildExportsSection()` Line 270-290 uses shorthand property syntax with wrong variable names.

```typescript
// ContractCodeBuilder.ts Line 288
lines.push(`  ${pascalResource}Response: { Schema, IndexSchema }${comma}`);
// ❌ Variables "Schema" and "IndexSchema" don't exist!
```

**Fix Required:**
Use actual schema names or create aliases:
```typescript
// Option 1: Full path
ProdukItemResourceResponse: { 
  Schema: produkItemResourceShowSchema, 
  IndexSchema: produkItemResourceIndexSchema 
}

// Option 2: Rename schemas at top
const Schema = produkItemResourceShowSchema;
const IndexSchema = produkItemResourceIndexSchema;
```

---

### 🐛 Bug #4: Missing Zod Import (False Positive)

**Severity:** LOW (False alarm)  
**Impact:** IDE warning only, no runtime impact if zod is installed

**Evidence:**
```typescript
// Line 5
import { z } from 'zod';  // ⚠️ IDE shows "Cannot find module 'zod'"
```

**Root Cause:**
`zod` is a peer dependency, not direct dependency in test environment.

**Fix Required:**
Ensure test environment has zod installed:
```bash
npm install zod@latest --save-dev
```

---

## Architectural Violations

### ⚠️ Violation #1: Duplicate Code - Validation Functions

**Principle Violated:** Single Source of Truth (SoT)  
**Severity:** HIGH  
**Lines:** 285-330 (validator section)

**Evidence:**
```typescript
// Pattern repeated 17 times:
export const validateXxxCreate = (data: unknown) => {
  return xxxContractSchema.create.parse(data);
};
```

**Code Quality Impact:**
- 17 identical function structures
- Same validation logic repeated
- Hard to maintain (change requires 17 edits)

**Better Approach:**
```typescript
// Generic validator factory
function createValidator<T>(schema: z.ZodType<T>) {
  return (data: unknown): T => schema.parse(data);
}

// Usage
export const validateRegisterCreate = createValidator(registerContractSchema.create);
export const validateLoginCreate = createValidator(loginContractSchema.create);
// ... etc
```

**Benefits:**
- Single implementation (SoT)
- Type-safe
- Easy to add features (logging, error transformation)
- Reduces file size from 372 lines to ~150 lines

---

### ⚠️ Violation #2: Large Class - ContractCodeBuilder

**Principle Violated:** Small Classes Principle (< 200 lines)  
**Severity:** MEDIUM  
**Current Size:** 450+ lines

**Evidence:**
- File: `ContractCodeBuilder.ts`
- Method count: 10 methods
- Responsibilities: 4+ concerns (schemas, types, validators, exports)

**Violation Details:**
```typescript
class ContractCodeBuilder {
  buildContractFile()              // 60 lines - orchestration
  buildResponseSchemasSection()    // 40 lines - response schemas
  buildSchemaSection()             // 20 lines - request schemas
  buildTypeSection()               // 25 lines - types generation
  buildValidatorSection()          // 30 lines - validators
  buildExportsSection()            // 40 lines - exports
  buildResponseTypesSection()      // 50 lines - response types
  buildResponseValidatorsSection() // 60 lines - response validators
  // ... + helpers
}
```

**Refactoring Required:**
Split into 4 focused classes:
```typescript
// 1. ResponseSectionBuilder (< 150 lines)
class ResponseSectionBuilder {
  buildSchemas()
  buildTypes()
  buildValidators()
}

// 2. RequestSectionBuilder (< 150 lines)
class RequestSectionBuilder {
  buildSchemas()
  buildTypes()
  buildValidators()
}

// 3. ExportsSectionBuilder (< 100 lines)
class ExportsSectionBuilder {
  buildExportsObject()
}

// 4. ContractFileAssembler (< 100 lines)
class ContractFileAssembler {
  constructor(
    responseSectionBuilder,
    requestSectionBuilder,
    exportsSectionBuilder
  )
  
  assemble() {
    // Coordinate sections
  }
}
```

---

### ⚠️ Violation #3: snake_case in Request Schemas

**Principle Violated:** Frontend Domain Model (camelCase enforcement)  
**Severity:** HIGH  
**Impact:** Inconsistent with api-read.ts output

**Evidence:**
```typescript
// Generated in api-contract.ts (snake_case)
export const cartContractSchema = {
  create: z.object({
    produk_item_id: z.string(),     // ❌ snake_case
    qty: z.number(),
    code: z.string()
  })
};

// But api-read.ts uses camelCase
export interface Cart {
  produkItemId: number;  // ✅ camelCase
  qty: number;
  code: string;
}
```

**Root Cause:**
Request schemas use raw Laravel field names from FormRequest validation rules, tidak melalui flattening/transformation seperti response types.

**Expected Behavior:**
Frontend NEVER sees snake_case. All schemas should use camelCase.

**Fix Required:**
Apply same flattening logic to request schemas:
```typescript
// ✅ SHOULD BE:
export const cartContractSchema = {
  create: z.object({
    produkItemId: z.string(),  // camelCase
    qty: z.number(),
    code: z.string()
  })
};
```

**Implementation:**
- Add transformation step in `ContractActionGenerator.generateSchemaLines()`
- Use `convertSingleField()` or similar utility
- Apply consistently across all request schemas

---

### ⚠️ Violation #4: No Nested Object Handling

**Principle Violated:** Frontend Domain Model (flat structure)  
**Severity:** MEDIUM  
**Example:** OrderResource has nested `items` field

**Evidence:**
```typescript
export const orderResourceShowSchema = z.object({
  // ... other fields ...
  items: z.unknown(),  // ❌ No handling for nested array of objects
  // ... other fields ...
});
```

**Expected Output:**
```typescript
// Order response should flatten nested items
export const orderResourceShowSchema = z.object({
  // ... order fields ...
  items: z.array(z.object({
    id: z.number(),
    produkNama: z.string(),  // Flattened from item.produk.nama
    quantity: z.number(),
    // ... item fields
  }))
});
```

**Root Cause:**
`ResponseFieldParser` doesn't handle nested Resource relationships. Falls back to `z.unknown()`.

**Fix Required:**
- Implement recursive schema building for nested Resources
- Use `NestedObjectSchemaBuilder` for nested items
- Maintain flat field names with prefixes (e.g., `itemProdukNama`)

---

## Summary Statistics

### Bugs by Severity
| Severity | Count | Files Affected |
|----------|-------|----------------|
| CRITICAL | 3     | 1 (generated output) |
| HIGH     | 0     | 0 |
| MEDIUM   | 1     | 1 (missing zod) |

### Violations by Principle
| Principle | Violations | Impact |
|-----------|------------|--------|
| Single Source of Truth | 1 | Duplicate validators |
| Small Classes | 1 | ContractCodeBuilder > 400 lines |
| Frontend Domain Model | 2 | snake_case + nested objects |
| Separation of Concerns | 1 | Mixed responsibilities in builder |

### Lines of Code Analysis
```
Generated Output:
- Total lines: 372
- Duplicate code: ~150 lines (validators)
- Could be reduced to: ~220 lines with fixes

Implementation:
- ContractCodeBuilder: 450+ lines
- Should be: 4 classes × ~100 lines = 400 lines (better organized)
```

---

## Recommended Fix Priority

### Phase 1: Critical Bugs (Blocking Production)
**Timeline:** 2-4 hours

1. ✅ Fix duplicate `validateSchema` names
2. ✅ Fix duplicate `validateIndex` names  
3. ✅ Fix undefined `Schema` exports
4. ✅ Add zod to peer dependencies

**Expected Result:** Generated code compiles without errors

---

### Phase 2: Code Quality (Maintainability)
**Timeline:** 1-2 days

5. ✅ Refactor duplicate validators to use factory pattern
6. ✅ Split ContractCodeBuilder into 4 focused classes
7. ✅ Add unit tests for each class (< 200 lines each)

**Expected Result:** Clean, maintainable codebase following all principles

---

### Phase 3: Frontend Domain Model Compliance
**Timeline:** 2-3 days

8. ✅ Apply camelCase transformation to request schemas
9. ✅ Implement nested object flattening for responses
10. ✅ Add integration tests for transformation

**Expected Result:** 100% compliance with Frontend Domain Model philosophy

---

## Test Coverage Gaps

### Current Test Status
```typescript
// ResponseActionBuilder.test.ts - 20+ tests ✅
// ContractCodeBuilder.test.ts - MISSING ❌
// ContractActionGenerator.test.ts - MISSING ❌
```

### Required Tests

**ContractCodeBuilder Tests:**
```typescript
describe('ContractCodeBuilder', () => {
  test('should not generate duplicate validator names')
  test('should use actual schema names in exports')
  test('should handle multiple resources without conflicts')
  test('should generate valid TypeScript code')
  test('should apply camelCase to request schemas')
  test('should handle nested response objects')
})
```

**Integration Tests:**
```typescript
describe('Contract Generation Integration', () => {
  test('generated code compiles without errors')
  test('all validators are unique and callable')
  test('exports object has all correct references')
  test('snake_case transformed to camelCase consistently')
})
```

---

## Evidence Chain

### Bug #1-2: Duplicate Validators

**Evidence Location:**
1. Generated output: `/home/annas-zen/Documents/laragon-docker/www/toko-online/test-output-api-contract/contracts/api-contract.ts` Lines 285-291
2. Source code: `ContractCodeBuilder.ts` Lines 239, 247
3. Method: `buildResponseValidatorsSection()`

**Proof:**
- TypeScript compiler errors shown in IDE diagnostics
- Code inspection shows identical function names
- No uniqueness logic in generator

---

### Bug #3: Undefined Exports

**Evidence Location:**
1. Generated output: Lines 372-373
2. Source code: `ContractCodeBuilder.ts` Line 288
3. Method: `buildExportsSection()`

**Proof:**
- TypeScript error: "No value exists in scope"
- Variable names don't match generated schema names
- Shorthand syntax assumes variables exist

---

### Violation #1: Duplicate Code

**Evidence Location:**
1. Generated output: Lines 293-330 (validator functions)
2. Pattern count: 17 identical structures
3. Code quality principle: SoT violated

**Proof:**
```bash
# Count duplicate pattern
grep -c "export const validate.*= (data: unknown)" api-contract.ts
# Result: 17 matches
```

---

### Violation #2: Large Class

**Evidence Location:**
1. File: `ContractCodeBuilder.ts`
2. Line count: 450+ lines
3. Code quality principle: Small Classes (<200) violated

**Proof:**
```bash
wc -l ContractCodeBuilder.ts
# Result: 453 lines

# Method count
grep -c "private.*(" ContractCodeBuilder.ts
# Result: 10 methods
```

---

## Conclusion

Generated `api-contract.ts` memiliki **fundamental issues** yang harus diperbaiki sebelum production:

✅ **Critical Bugs:** 3 blocking bugs (duplicate names, undefined exports)  
✅ **Architectural Issues:** 4 major violations (SoT, Small Classes, Domain Model, SoC)  
✅ **Test Coverage:** Missing critical tests for code builder

**Total Estimated Fix Time:** 3-5 days
- Phase 1 (Critical): 4 hours
- Phase 2 (Quality): 2 days
- Phase 3 (Domain Model): 2-3 days

**Next Steps:**
1. Fix critical bugs immediately (Phase 1)
2. Add comprehensive tests
3. Refactor for code quality (Phase 2)
4. Implement domain model compliance (Phase 3)

---

**Document Status:** Complete  
**Review Required:** Yes  
**Action Required:** Immediate fixes for Phase 1 bugs
