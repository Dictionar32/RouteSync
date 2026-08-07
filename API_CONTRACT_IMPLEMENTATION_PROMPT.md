# API Contract Generation Implementation Prompt

**Tanggal:** 2026-08-07  
**Feature:** `api-contract.ts` - Zod-First Contract Generation  
**Output:** `contracts/api-contract.ts`

---

## 🚨 MANDATORY: Activate Skills Before Implementation

**BEFORE you start coding, you MUST activate these skills:**

```
Skill 1: reverse-engineering
Skill 2: compiler-bridge-architecture
```

**How to activate:**
1. Use `disclose_context` tool with skill name
2. Read and understand COMPLETE skill content
3. Apply principles throughout implementation

**Why mandatory:**
- ✅ Ensures evidence-based analysis before design
- ✅ Follows established architecture patterns
- ✅ Prevents common mistakes and anti-patterns
- ✅ Maintains consistency with existing codebase

---

## Executive Summary

**Goal:** Generate `api-contract.ts` yang menggabungkan Response Schema (read) dan Request Schema (form) menggunakan **Zod-first approach** dengan TypeScript type inference.

**Key Difference dari api-read.ts & api-form.ts:**
- ❌ `api-read.ts`: TypeScript types, TRANSFORMED (flat+camelCase)
- ❌ `api-form.ts`: TypeScript types, TRANSFORMED (flat+camelCase)
- ✅ `api-contract.ts`: **Zod schemas, ORIGINAL backend structure (snake_case + nested)**

**Philosophy:** 
- Schema as Source of Truth, Types as Derived
- **Backend Response as-is** - NO transformation, NO flattening

---

## Feature Requirements

### 1. Output Structure

```typescript
// contracts/api-contract.ts

import { z } from 'zod'

// ============================================
// Response Schemas (ORIGINAL backend structure)
// ============================================

export const OrderSchema = z.object({
  id: z.number(),
  status: z.string(),
  total_harga: z.number(),              // ← snake_case (backend original)
  invoice_number: z.string().nullable(), // ← snake_case (backend original)
  payment_status: z.string(),
  items: z.array(z.object({
    produk_item_id: z.number(),          // ← snake_case (backend original)
    produk: z.object({
      id: z.number(),
      nama: z.string(),
      gambar: z.string().nullable(),
    }),
    qty: z.number(),
    harga: z.number(),
    subtotal: z.number(),
  })),
  // ✅ Nested structure preserved (backend original)
  shipping: z.object({
    nama: z.string().nullable(),
    telepon: z.string().nullable(),
    alamat: z.string().nullable(),
    kota: z.string().nullable(),
    kode_pos: z.string().nullable(),
  }).nullable().optional(),
})

export const OrderIndexSchema = z.array(OrderSchema)

// ============================================
// Request Schemas (FLATTENED for Frontend Domain Model)
// ============================================

export const OrderCreateSchema = z.object({
  shipping_nama: z.string(),        // ✅ Flattened BUT snake_case (matches backend)
  shipping_telepon: z.string(),      // ✅ Flattened BUT snake_case
  shipping_alamat: z.string(),       // ✅ Flattened BUT snake_case
  shipping_kota: z.string(),         // ✅ Flattened BUT snake_case
  shipping_kode_pos: z.string(),     // ✅ Flattened BUT snake_case
})

export const OrderUpdateSchema = z.object({
  status: z.string().optional(),
  // ... update fields (snake_case)
})

// ============================================
// Query Parameter Schemas (snake_case)
// ============================================

export const OrderListQuerySchema = z.object({
  page: z.number().int().positive().optional(),
  per_page: z.number().int().positive().optional(), // ← snake_case
  status: z.string().optional(),
})

// ============================================
// Inferred TypeScript Types
// ============================================

export type OrderApiResponse = z.infer<typeof OrderSchema>
export type OrderApiIndex = z.infer<typeof OrderIndexSchema>
export type OrderApiCreate = z.infer<typeof OrderCreateSchema>
export type OrderApiUpdate = z.infer<typeof OrderUpdateSchema>
export type OrderListQuery = z.infer<typeof OrderListQuerySchema>

// ============================================
// Validation Functions
// ============================================

export const validateOrderResponse = (payload: unknown): OrderApiResponse =>
  OrderSchema.parse(payload)

export const validateOrderIndex = (payload: unknown): OrderApiIndex =>
  OrderIndexSchema.parse(payload)

export const validateOrderCreate = (payload: unknown): OrderApiCreate =>
  OrderCreateSchema.parse(payload)

export const validateOrderUpdate = (payload: unknown): OrderApiUpdate =>
  OrderUpdateSchema.parse(payload)

export const validateOrderListQuery = (payload: unknown): OrderListQuery =>
  OrderListQuerySchema.parse(payload)
```

---

## Architecture Design

### Pass System Architecture

```
ContractGeneratorPass (NEW)
  ├── Input: Manifest routes + validation rules
  ├── Process:
  │   ├── ContractSchemaMapper (maps SemanticType → Zod schema)
  │   ├── ContractActionGenerator (groups schemas by resource+action)
  │   └── ContractCodeBuilder (generates final code)
  └── Output: GeneratedContractArtifact
```

### Component Responsibilities

#### 1. ContractSchemaMapper
**File:** `packages/core/src/compiler/generators/contract-generation/ContractSchemaMapper.ts`

**Responsibilities:**
- Map `SemanticType` → Zod schema definition
- Handle all type variants (primitives, objects, arrays, unions)
- Support nested objects (response) vs flattened objects (request)
- Generate nullable/optional modifiers
- Track Zod import requirements

**Key Methods:**
```typescript
class ContractSchemaMapper {
  mapToZodSchema(type: SemanticType, context: MappingContext): ZodSchemaNode
  mapPrimitiveToZod(primitive: PrimitiveType): ZodSchemaNode
  mapObjectToZod(obj: ObjectType, flatten: boolean): ZodSchemaNode
  mapArrayToZod(array: CollectionType): ZodSchemaNode
  mapUnionToZod(union: UnionType): ZodSchemaNode
  shouldFlatten(context: MappingContext): boolean // true for request, false for response
}
```

#### 2. ContractActionGenerator
**File:** `packages/core/src/compiler/generators/contract-generation/ContractActionGenerator.ts`

**Responsibilities:**
- Group schemas by resource (Order, Payment, etc.)
- Identify actions per resource (index, show, create, update, delete)
- Generate schema names (`OrderSchema`, `OrderCreateSchema`)
- Generate type names (`OrderApiResponse`, `OrderApiCreate`)
- Generate validator names (`validateOrderResponse`, `validateOrderCreate`)

**Key Methods:**
```typescript
class ContractActionGenerator {
  generateResourceSchemas(resource: string, routes: Route[]): ResourceSchemas
  groupByAction(routes: Route[]): Map<ActionType, Route>
  generateSchemaName(resource: string, action?: ActionType): string
  generateTypeName(resource: string, action?: ActionType): string
  generateValidatorName(resource: string, action?: ActionType): string
}
```

#### 3. ContractCodeBuilder
**File:** `packages/core/src/compiler/generators/contract-generation/ContractCodeBuilder.ts`

**Responsibilities:**
- Build final contract file code
- Generate schema definitions section
- Generate type inference section
- Generate validation functions section
- Add imports (Zod)
- Format code consistently

**Key Methods:**
```typescript
class ContractCodeBuilder {
  buildContractFile(schemas: ResourceSchemas[]): string
  buildSchemaSection(schemas: ZodSchemaNode[]): string
  buildTypeSection(types: TypeInference[]): string
  buildValidatorSection(validators: ValidatorDef[]): string
  addImports(): string
}
```

---

## Key Differences: Response vs Request

### Response Schemas (Nested)

```typescript
// ✅ Response: Keep nested structure
export const OrderSchema = z.object({
  id: z.number(),
  shipping: z.object({        // ← Nested
    nama: z.string().nullable(),
    telepon: z.string().nullable(),
    alamat: z.string().nullable(),
  }).nullable().optional(),
})
```

**Reason:** Backend sends nested JSON, frontend should validate as-is.

### Request Schemas (Flattened)

```typescript
// ✅ Request: Flatten nested structure
export const OrderCreateSchema = z.object({
  shippingNama: z.string(),      // ← Flattened
  shippingTelepon: z.string(),    // ← Flattened
  shippingAlamat: z.string(),     // ← Flattened
})
```

**Reason:** Frontend Domain Model philosophy - form inputs are flat.

---

## Zod Schema Mapping Rules

### Primitive Types

| SemanticType | Zod Schema |
|--------------|------------|
| `PrimitiveType(STRING)` | `z.string()` |
| `PrimitiveType(NUMBER)` | `z.number()` |
| `PrimitiveType(INTEGER)` | `z.number().int()` |
| `PrimitiveType(BOOLEAN)` | `z.boolean()` |
| `PrimitiveType(DATE)` | `z.string()` (ISO date) |
| `PrimitiveType(DATETIME)` | `z.string()` (ISO datetime) |

### Nullable & Optional

```typescript
// Nullable
PrimitiveType(STRING) + nullable → z.string().nullable()

// Optional
PrimitiveType(STRING) + optional → z.string().optional()

// Both
PrimitiveType(STRING) + nullable + optional → z.string().nullable().optional()
```

### Arrays

```typescript
// Simple array
ReadonlyCollectionType(ARRAY, STRING) → z.array(z.string())

// Array of objects
ReadonlyCollectionType(ARRAY, ObjectType) → z.array(z.object({ ... }))
```

### Objects

```typescript
// Simple object
ObjectType({
  id: NUMBER,
  name: STRING
}) → z.object({
  id: z.number(),
  name: z.string()
})

// Nested object (response)
ObjectType({
  shipping: ObjectType({ ... })
}) → z.object({
  shipping: z.object({ ... })
})

// Flattened object (request)
ObjectType({
  shipping: ObjectType({
    nama: STRING,
    telepon: STRING
  })
}) → z.object({
  shippingNama: z.string(),     // ← Flattened
  shippingTelepon: z.string()    // ← Flattened
})
```

### Unions

```typescript
UnionType([STRING, NUMBER]) → z.union([z.string(), z.number()])
```

### Validation Rules (from FormRequest)

```typescript
// Laravel: 'email' => ['required', 'email']
z.string().email()

// Laravel: 'age' => ['required', 'integer', 'min:18', 'max:100']
z.number().int().min(18).max(100)

// Laravel: 'status' => ['required', 'in:pending,completed']
z.enum(['pending', 'completed'])

// Laravel: 'items' => ['required', 'array', 'min:1']
z.array(z.object({ ... })).min(1)
```

---

## Implementation Steps

### Phase 1: Create Schema Mapper (Week 1)

**Tasks:**
1. ✅ Create `ContractSchemaMapper.ts`
2. ✅ Implement primitive type mapping
3. ✅ Implement array mapping
4. ✅ Implement object mapping (both nested & flattened)
5. ✅ Implement union mapping
6. ✅ Implement nullable/optional handling
7. ✅ Write unit tests (25+ tests)

**Test Coverage:**
- Primitives: 8 tests
- Arrays: 5 tests
- Objects (nested): 5 tests
- Objects (flattened): 5 tests
- Unions: 3 tests
- Edge cases: 5 tests

### Phase 2: Create Action Generator (Week 2)

**Tasks:**
1. ✅ Create `ContractActionGenerator.ts`
2. ✅ Implement resource grouping
3. ✅ Implement action identification
4. ✅ Implement name generation
5. ✅ Write unit tests (20+ tests)

**Test Coverage:**
- Resource grouping: 5 tests
- Action identification: 8 tests
- Name generation: 7 tests
- Edge cases: 3 tests

### Phase 3: Create Code Builder (Week 2)

**Tasks:**
1. ✅ Create `ContractCodeBuilder.ts`
2. ✅ Implement schema section generation
3. ✅ Implement type inference section
4. ✅ Implement validator section
5. ✅ Implement import management
6. ✅ Write unit tests (20+ tests)

**Test Coverage:**
- Schema section: 6 tests
- Type section: 5 tests
- Validator section: 5 tests
- Imports: 4 tests
- Edge cases: 3 tests

### Phase 4: Create Pass (Week 3)

**Tasks:**
1. ✅ Create `ContractGeneratorPass.ts`
2. ✅ Implement pass execution logic
3. ✅ Integrate mapper, generator, builder
4. ✅ Create artifact type
5. ✅ Write integration tests (25+ tests)

**Test Coverage:**
- Configuration: 5 tests
- Execution: 10 tests
- Error handling: 5 tests
- Integration: 5 tests

### Phase 5: CLI Integration (Week 3)

**Tasks:**
1. ✅ Update `CompilerBridge` to support contracts
2. ✅ Add CLI flag `--contracts`
3. ✅ Update output structure
4. ✅ Write E2E tests

### Phase 6: Documentation (Week 4)

**Tasks:**
1. ✅ Update steering documents
2. ✅ Create usage examples
3. ✅ Write migration guide
4. ✅ Update README

---

## Test Strategy

### Unit Tests (70+ tests total)

**ContractSchemaMapper:** 25+ tests
```typescript
describe('ContractSchemaMapper', () => {
  describe('Primitive Mapping', () => {
    test('should map STRING to z.string()')
    test('should map NUMBER to z.number()')
    test('should map INTEGER to z.number().int()')
    test('should map BOOLEAN to z.boolean()')
    test('should map nullable STRING to z.string().nullable()')
    test('should map optional STRING to z.string().optional()')
    test('should map nullable+optional to z.string().nullable().optional()')
  })
  
  describe('Array Mapping', () => {
    test('should map array of strings to z.array(z.string())')
    test('should map array of objects')
    test('should map nested arrays')
  })
  
  describe('Object Mapping - Nested', () => {
    test('should keep nested structure for response')
    test('should preserve object hierarchy')
  })
  
  describe('Object Mapping - Flattened', () => {
    test('should flatten nested objects for request')
    test('should generate correct field names (shippingNama)')
  })
  
  describe('Union Mapping', () => {
    test('should map union types to z.union()')
  })
})
```

**ContractActionGenerator:** 20+ tests
```typescript
describe('ContractActionGenerator', () => {
  describe('Resource Grouping', () => {
    test('should group routes by resource name')
    test('should handle multiple resources')
  })
  
  describe('Action Identification', () => {
    test('should identify index action (GET /orders)')
    test('should identify show action (GET /orders/:id)')
    test('should identify create action (POST /orders)')
    test('should identify update action (PUT /orders/:id)')
    test('should identify delete action (DELETE /orders/:id)')
  })
  
  describe('Name Generation', () => {
    test('should generate OrderSchema for response')
    test('should generate OrderCreateSchema for create')
    test('should generate OrderApiResponse for type')
    test('should generate validateOrderResponse for validator')
  })
})
```

**ContractCodeBuilder:** 20+ tests
```typescript
describe('ContractCodeBuilder', () => {
  describe('Schema Section', () => {
    test('should generate schema definitions')
    test('should order schemas logically (response, request, query)')
  })
  
  describe('Type Section', () => {
    test('should generate z.infer types')
    test('should use correct naming')
  })
  
  describe('Validator Section', () => {
    test('should generate validation functions')
    test('should use schema.parse()')
  })
  
  describe('Imports', () => {
    test('should add Zod import')
    test('should not add unnecessary imports')
  })
})
```

### Integration Tests (25+ tests)

**ContractGeneratorPass:** 25+ tests
```typescript
describe('ContractGeneratorPass Integration', () => {
  test('should generate complete contract file')
  test('should handle multiple resources')
  test('should preserve response nesting')
  test('should flatten request objects')
  test('should generate correct validators')
  test('should handle error scenarios')
})
```

### E2E Tests (5+ tests)

```typescript
describe('Contract Generation E2E', () => {
  test('should generate from real manifest')
  test('should compile TypeScript without errors')
  test('should validate runtime data correctly')
  test('should integrate with existing generators')
})
```

---

## Example Output

### Input: Manifest Route

```json
{
  "path": "/orders",
  "method": "POST",
  "controller": "OrderController@store",
  "validation": {
    "shipping_nama": "required|string|max:255",
    "shipping_telepon": "required|string|max:20",
    "shipping_alamat": "required|string|max:500"
  },
  "response": {
    "type": "Order",
    "isCollection": false,
    "fields": {
      "id": "number",
      "status": "string",
      "shipping": {
        "nama": "string|null",
        "telepon": "string|null",
        "alamat": "string|null"
      }
    }
  }
}
```

### Output: Generated Contract

```typescript
import { z } from 'zod'

// Response Schema (nested)
export const OrderSchema = z.object({
  id: z.number(),
  status: z.string(),
  shipping: z.object({
    nama: z.string().nullable(),
    telepon: z.string().nullable(),
    alamat: z.string().nullable(),
  }).nullable().optional(),
})

// Request Schema (flattened)
export const OrderCreateSchema = z.object({
  shippingNama: z.string().max(255),
  shippingTelepon: z.string().max(20),
  shippingAlamat: z.string().max(500),
})

// Inferred Types
export type OrderApiResponse = z.infer<typeof OrderSchema>
export type OrderApiCreate = z.infer<typeof OrderCreateSchema>

// Validators
export const validateOrderResponse = (payload: unknown): OrderApiResponse =>
  OrderSchema.parse(payload)

export const validateOrderCreate = (payload: unknown): OrderApiCreate =>
  OrderCreateSchema.parse(payload)
```

---

## Integration with Existing System

### CompilerBridge Integration

```typescript
// packages/core/src/compiler/generators/CompilerBridge.ts

async generateContracts(manifest: Manifest): Promise<GeneratedContractArtifact> {
  const contractPass = new ContractGeneratorPass()
  const state = new CompilationState()
  
  await contractPass.run(state, manifest)
  
  return state.artifacts.get(ArtifactKey.GENERATED_CONTRACT)
}
```

### CLI Integration

```bash
# Generate all outputs including contracts
npx routesync generate \
  --manifest routesync.manifest.json \
  --output src/api \
  --contracts  # ← New flag

# Output structure:
src/api/
├── types/
│   └── api-read.ts      (existing)
├── forms/
│   └── api-form.ts      (existing)
└── contracts/           (NEW)
    └── api-contract.ts  (NEW)
```

---

## Success Criteria

### Functionality
- ✅ Generates valid Zod schemas from manifest
- ✅ Response schemas keep nested structure
- ✅ Request schemas flatten nested objects
- ✅ Type inference works correctly
- ✅ Validators work at runtime
- ✅ Handles all SemanticType variants

### Quality
- ✅ 70+ unit tests, 100% pass rate
- ✅ 25+ integration tests
- ✅ ~95% code coverage
- ✅ No TypeScript errors in generated code
- ✅ Runtime validation works correctly

### Documentation
- ✅ Comprehensive implementation guide
- ✅ Usage examples
- ✅ Migration guide from api-read + api-form
- ✅ API reference

---

## Benefits

### For Developers
1. **Single Source of Truth**: Schema defines both validation & types
2. **Runtime Safety**: Validation at runtime, not just compile-time
3. **Better DX**: IntelliSense works from inferred types
4. **Less Boilerplate**: No need to write types + schemas separately

### For RouteSync Architecture
1. **Consistency**: All three outputs (read, form, contract) follow same patterns
2. **Testability**: Zod schemas are easily testable
3. **Maintainability**: Schemas easier to understand than TypeScript types
4. **Flexibility**: Can add custom validators easily

---

## Timeline

**Total Duration:** 4 weeks

- **Week 1:** ContractSchemaMapper implementation + tests
- **Week 2:** ContractActionGenerator + ContractCodeBuilder + tests
- **Week 3:** ContractGeneratorPass + CLI integration + tests
- **Week 4:** Documentation + E2E tests + polish

**Estimated Effort:** ~80-100 hours

---

## Next Steps

### Immediate Actions
1. ✅ Create Phase 1 implementation plan
2. ✅ Set up test infrastructure
3. ✅ Create initial file structure
4. ✅ Write first batch of unit tests

### Follow-up
1. Weekly progress reviews
2. Integration testing with real manifests
3. Performance benchmarking
4. User feedback collection

---

## References

### Existing Implementations
- `packages/core/src/compiler/generators/form-generation/FormFieldMapper.ts` (reference for flattening)
- `packages/core/src/compiler/generators/typescript/TypeScriptGenerator.ts` (reference for type mapping)
- `packages/core/src/compiler/passes/FormGeneratorPass.ts` (reference for pass structure)

### Documentation
- `.kiro/steering/frontend-domain-model.md` (philosophy)
- `FORM_GENERATION_IMPLEMENTATION_COMPLETE.md` (similar feature reference)
- `TYPESCRIPT_GENERATION_TEST_COVERAGE_ANALYSIS.md` (test coverage reference)

---

**Status:** READY FOR IMPLEMENTATION  
**Priority:** HIGH  
**Complexity:** MEDIUM-HIGH  
**Risk:** LOW (follows established patterns)

