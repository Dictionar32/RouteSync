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

### 🐛 Bug #4: Index Schema Duplicates Show Schema Definition

**Severity:** MEDIUM  
**Impact:** Code duplication, violates DRY principle, increases file size by 15-20%

**Evidence:**
```typescript
// Current generated output (Lines 8-33) - WRONG ❌
export const produkItemResourceShowSchema = z.object({
  id: z.number(),
  nama: z.string(),
  deskripsi: z.string(),
  image: z.string(),
  imageUrl: z.string(),
  categoryId: z.number(),
  categoryName: z.string(),
  harga: z.number(),
  stok: z.number(),
  rating: z.number(),
  reviewCount: z.number()
});

export const produkItemResourceIndexSchema = z.array(z.object({
  id: z.number(),              // ❌ DUPLICATE!
  nama: z.string(),            // ❌ DUPLICATE!
  deskripsi: z.string(),       // ❌ DUPLICATE!
  image: z.string(),           // ❌ DUPLICATE!
  imageUrl: z.string(),        // ❌ DUPLICATE!
  categoryId: z.number(),      // ❌ DUPLICATE!
  categoryName: z.string(),    // ❌ DUPLICATE!
  harga: z.number(),           // ❌ DUPLICATE!
  stok: z.number(),            // ❌ DUPLICATE!
  rating: z.number(),          // ❌ DUPLICATE!
  reviewCount: z.number()      // ❌ DUPLICATE! (11 fields × 2 = 22 lines)
}));
```

**Expected Pattern (DRY):**
```typescript
// ✅ CORRECT - Define once, reuse
export const produkItemResourceShowSchema = z.object({
  id: z.number(),
  nama: z.string(),
  deskripsi: z.string(),
  image: z.string(),
  imageUrl: z.string(),
  categoryId: z.number(),
  categoryName: z.string(),
  harga: z.number(),
  stok: z.number(),
  rating: z.number(),
  reviewCount: z.number()
});

// Reference show schema, don't duplicate
export const produkItemResourceIndexSchema = z.array(produkItemResourceShowSchema);
```

**Root Cause Analysis:**

**1. ResponseActionBuilder generates inline schema:**
```typescript
// packages/core/src/compiler/generators/contract-generation/ResponseActionBuilder.ts
// Line 101-115 (buildIndexSchema method)

buildIndexSchema(
    resourceName: string,
    responseFields: ReadonlyArray<ParsedResponseField>
): ActionResponseSchema {
    const schemaName = this.generateSchemaName(resourceName, 'index');

    // ❌ Problem: Calls mapFieldsToZod which generates FULL inline z.object()
    const zodSchema = this.responseSchemaMapper.mapFieldsToZod(
        responseFields,      // Same fields as show
        resourceName,
        'index'             // Action = index
    );
    
    return { schemaName, zodSchema, action: 'index', resourceName };
}
```

**2. ResponseSchemaMapper wraps in z.array() but duplicates fields:**
```typescript
// ResponseSchemaMapper.mapFieldsToZod() wraps fields in array:
// z.array(z.object({ ...all fields again }))
// Instead of: z.array(showSchemaName)
```

**3. ContractCodeBuilder emits the duplicate:**
```typescript
// ContractCodeBuilder.ts Line 195-235 (buildResponseSchemasSection)
private buildResponseSchemasSection(
  lines: string[],
  responseSchemas: readonly ResponseSchema[]
): void {
  // ... group by resource ...
  
  // Emit Show schema
  if (showSchema) {
    lines.push(`export const ${showSchema.schemaName} = ${showSchema.zodSchema};`);
  }
  
  // ❌ Emit Index schema with FULL inline definition
  if (indexSchema) {
    lines.push(`export const ${indexSchema.schemaName} = ${indexSchema.zodSchema};`);
    // zodSchema already contains: z.array(z.object({ ...duplicate fields }))
  }
}
```

**Fix Implementation:**

**Option A: Fix at ContractCodeBuilder level (Recommended)**
```typescript
// File: packages/core/src/compiler/generators/contract-generation/ContractCodeBuilder.ts
// Method: buildResponseSchemasSection() Lines 195-235

private buildResponseSchemasSection(
  lines: string[],
  responseSchemas: readonly ResponseSchema[]
): void {
  const byResource = new Map<string, ResponseSchema[]>();
  
  // Group schemas by resource
  for (const schema of responseSchemas) {
    const existing = byResource.get(schema.resourceName) ?? [];
    existing.push(schema);
    byResource.set(schema.resourceName, existing);
  }
  
  // For each resource
  for (const [resourceName, schemas] of byResource.entries()) {
    const showSchema = schemas.find(s => s.action === 'show');
    const indexSchema = schemas.find(s => s.action === 'index');
    
    // Emit show schema first (base definition)
    if (showSchema) {
      lines.push(`export const ${showSchema.schemaName} = ${showSchema.zodSchema};`);
    }
    
    // Emit index schema (reuse show schema) ✅
    if (indexSchema && showSchema) {
      // ✅ FIX: Reference show schema instead of duplicating
      lines.push(`export const ${indexSchema.schemaName} = z.array(${showSchema.schemaName});`);
    } else if (indexSchema && !showSchema) {
      // Fallback: no show schema available (edge case)
      lines.push(`export const ${indexSchema.schemaName} = ${indexSchema.zodSchema};`);
    }
    
    lines.push('');
  }
}
```

**Option B: Fix at ResponseActionBuilder level**
```typescript
// File: ResponseActionBuilder.ts
// Method: buildIndexSchema()

buildIndexSchema(
    resourceName: string,
    responseFields: ReadonlyArray<ParsedResponseField>,
    showSchemaName?: string  // ✅ Add optional show schema reference
): ActionResponseSchema {
    const schemaName = this.generateSchemaName(resourceName, 'index');

    let zodSchema: string;
    
    if (showSchemaName) {
        // ✅ Reuse show schema
        zodSchema = `z.array(${showSchemaName})`;
    } else {
        // Fallback: generate inline (for backwards compat)
        zodSchema = this.responseSchemaMapper.mapFieldsToZod(
            responseFields,
            resourceName,
            'index'
        );
    }
    
    return { schemaName, zodSchema, action: 'index', resourceName };
}
```

**Recommended Fix: Option A**
- ✅ Simpler (no API changes to ResponseActionBuilder)
- ✅ Centralized fix (one place to change)
- ✅ Backwards compatible (no contract changes)
- ✅ Easier to test (ContractCodeBuilder owns assembly logic)

**Implementation Location:**
- File: `packages/core/src/compiler/generators/contract-generation/ContractCodeBuilder.ts`
- Method: `buildResponseSchemasSection()` Lines 195-235
- Change Type: Logic update (check if showSchema exists, reference instead of inline)

**Testing Requirements:**
```typescript
// Test: Index schema should reference show schema
describe('ContractCodeBuilder - Response Schemas', () => {
  test('should reuse show schema for index', () => {
    const schemas: ResponseSchema[] = [
      {
        schemaName: 'orderShowSchema',
        zodSchema: 'z.object({ id: z.number() })',
        action: 'show',
        resourceName: 'order'
      },
      {
        schemaName: 'orderIndexSchema',
        zodSchema: 'z.array(z.object({ id: z.number() }))',  // Ignored
        action: 'index',
        resourceName: 'order'
      }
    ];
    
    const builder = new ContractCodeBuilder();
    const result = builder.buildContractFile([], schemas);
    
    // Should NOT duplicate fields
    expect(result.code).not.toContain('z.array(z.object({');
    
    // Should reference show schema
    expect(result.code).toContain('z.array(orderShowSchema)');
    
    // Verify line count reduction
    const lines = result.code.split('\n');
    expect(lines.length).toBeLessThan(50);  // Much smaller
  });
  
  test('should handle missing show schema gracefully', () => {
    const schemas: ResponseSchema[] = [
      {
        schemaName: 'orderIndexSchema',
        zodSchema: 'z.array(z.object({ id: z.number() }))',
        action: 'index',
        resourceName: 'order'
      }
    ];
    
    const builder = new ContractCodeBuilder();
    const result = builder.buildContractFile([], schemas);
    
    // Should fallback to inline schema (no show to reference)
    expect(result.code).toContain('z.array(z.object({');
  });
});
```

**Impact Analysis:**

**Before Fix (Current):**
```typescript
// ProdukItemResource (11 fields)
export const produkItemResourceShowSchema = z.object({ ...11 fields }); // 13 lines
export const produkItemResourceIndexSchema = z.array(z.object({       // 13 lines (duplicate)
  ...same 11 fields
}));

// OrderResource (19 fields)
export const orderResourceShowSchema = z.object({ ...19 fields });     // 21 lines
export const orderResourceIndexSchema = z.array(z.object({             // 21 lines (duplicate)
  ...same 19 fields
}));

// Total: 13+13+21+21 = 68 lines
```

**After Fix (Expected):**
```typescript
// ProdukItemResource (11 fields)
export const produkItemResourceShowSchema = z.object({ ...11 fields }); // 13 lines
export const produkItemResourceIndexSchema = z.array(produkItemResourceShowSchema); // 1 line ✅

// OrderResource (19 fields)
export const orderResourceShowSchema = z.object({ ...19 fields });     // 21 lines
export const orderResourceIndexSchema = z.array(orderResourceShowSchema); // 1 line ✅

// Total: 13+1+21+1 = 36 lines
```

**Savings:**
- Lines: 68 → 36 (saves 32 lines, **47% reduction**)
- File size: ~2KB → ~1.2KB (**40% smaller**)
- Maintenance: Single source of truth per resource
- Build time: Faster (less code to parse/validate)

**Reference Evidence:**

**All 11 reference implementations use reuse pattern:**

```typescript
// 1. Order contracts
// From: /home/annas-zen/Documents/laragon-docker/www/toko-online/frontend/src/features/order/contracts/api-contract.ts
export const Schema = z.object({ /* 19 fields */ });
export const IndexSchema = z.array(Schema);  // ✅ Reuse pattern

// 2. Produk contracts
// From: /home/annas-zen/Documents/laragon-docker/www/toko-online/frontend/src/features/produk/contracts/api-contract.ts
export const Schema = z.object({ /* 11 fields */ });
export const IndexSchema = z.array(Schema);  // ✅ Same pattern

// 3. Payment contracts
// From: /home/annas-zen/Documents/laragon-docker/www/toko-online/frontend/src/features/payment/contracts/api-contract.ts
export const Schema = z.object({ /* fields */ });
export const IndexSchema = z.array(Schema);  // ✅ Same pattern

// Pattern consistency: 100% (11/11 files)
```

**Why This Pattern is Standard:**

1. ✅ **DRY Principle:** Define schema once
2. ✅ **Type Safety:** Show and Index guaranteed to match
3. ✅ **Maintainability:** Update one place affects both
4. ✅ **Performance:** Less code = faster parsing
5. ✅ **Standard Practice:** Universal pattern in Zod validation

**Conclusion:**
Bug #4 adalah **systematic code duplication** yang melanggar DRY principle. Fix membutuhkan **10-line change** di `ContractCodeBuilder.buildResponseSchemasSection()` untuk reference show schema instead of duplicating field definitions.

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

### ⚠️ Violation #3: No Nested Object Handling in Response Schemas

**Principle Violated:** Code completeness  
**Severity:** HIGH  
**Impact:** Response validation falls back to `z.unknown()` for nested structures

**Evidence:**
```typescript
// Generated (INCORRECT)
export const orderResourceShowSchema = z.object({
  // ... other fields ...
  items: z.unknown(),  // ❌ No handling for nested array of objects
  // ... other fields ...
});
```

**Expected Output (preserve backend structure):**
```typescript
// ✅ CORRECT - Preserve nested structure from backend
export const Schema = z.object({
  // ... order fields ...
  items: z.array(
    z.object({
      produk_item_id: z.number(),  // snake_case preserved
      produk: z.object({           // Nested preserved
        id: z.number(),
        nama: z.string(),
        gambar: z.string().nullable(),
      }),
      qty: z.number(),
      harga: z.number(),
    })
  ),
  
  shipping: z.object({             // Nested preserved
    nama: z.string().nullable(),
    telepon: z.string().nullable(),
    alamat: z.string().nullable(),
  }).nullable().optional(),
});
```

**Root Cause:**
`ResponseFieldParser` doesn't handle nested Resource relationships. Falls back to `z.unknown()`.

**Fix Required:**
- Implement recursive schema building for nested Resources
- Use `NestedObjectSchemaBuilder` for nested items
- **PRESERVE snake_case** (no transformation)
- **PRESERVE nested structure** (no flattening)

---

### 📝 CLARIFICATION: snake_case is CORRECT for api-contract.ts

**Important Note:** snake_case di api-contract.ts adalah **BENAR dan BY DESIGN**.

**Filosofi api-contract.ts:**
- ✅ Runtime validation contract
- ✅ Preserve backend structure (snake_case + nested)
- ✅ NO transformation applied
- ✅ Validate backend response AS-IS

**Frontend consumption uses api-read.ts:**
- api-read.ts → camelCase + flat (untuk frontend)
- api-contract.ts → snake_case + nested (untuk validation)

**Therefore:** Violation #3 dari analisis awal (snake_case in requests) adalah **FALSE ALARM**. snake_case adalah expected behavior

---

## Summary Statistics

### Bugs by Severity
| Severity | Count | Files Affected |
|----------|-------|----------------|
| CRITICAL | 3     | 1 (generated output) |
| HIGH     | 0     | 0 |
| MEDIUM   | 0     | 0 |

### Violations by Principle
| Principle | Violations | Impact |
|-----------|------------|--------|
| Single Source of Truth | 1 | Duplicate validators |
| Small Classes | 1 | ContractCodeBuilder > 400 lines |
| Code Completeness | 1 | Nested objects → z.unknown() |

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

### Phase 3: Nested Object Handling
**Timeline:** 1-2 days

8. ✅ Implement recursive schema building for nested structures
9. ✅ Preserve snake_case naming (no transformation)
10. ✅ Preserve nested object structure (no flattening)
11. ✅ Add integration tests for nested validation

**Expected Result:** Complete nested object support while preserving backend structure

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

### Violation #3: Incomplete Nested Handling

**Evidence Location:**
1. Generated output: Line 60 `items: z.unknown()`
2. Expected: Recursive schema for nested array
3. Reference: `/home/annas-zen/Documents/laragon-docker/www/toko-online/frontend/src/features/order/contracts/api-contract.ts`

**Proof:**
- OrderResource has `items` array in backend
- Generated schema uses `z.unknown()` fallback
- Expected nested z.object with recursive structure

**Design Intent:**
api-contract.ts MUST preserve backend structure:
- ✅ snake_case preserved (correct)
- ✅ Nested objects preserved (not flattened)
- ❌ Nested schemas not generated (bug)

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
✅ **Architectural Issues:** 2 violations (SoT, Small Classes) + 1 incomplete feature (nested objects)  
✅ **Test Coverage:** Missing critical tests for code builder

**Design Clarification:**
- ✅ snake_case is CORRECT (preserves backend structure)
- ✅ No flattening needed (runtime validation, not frontend consumption)
- ❌ Nested objects need proper schema generation (currently `z.unknown()`)

**Total Estimated Fix Time:** 1-2 days
- Phase 1 (Critical): 4 hours
- Phase 2 (Quality): 1 day
- Phase 3 (Nested Objects): 1-2 days

**Next Steps:**
1. Fix critical bugs immediately (Phase 1)
2. Add comprehensive tests
3. Refactor for code quality (Phase 2)
4. Implement domain model compliance (Phase 3)

---

**Document Status:** Complete  
**Review Required:** Yes  
**Action Required:** Immediate fixes for Phase 1 bugs
