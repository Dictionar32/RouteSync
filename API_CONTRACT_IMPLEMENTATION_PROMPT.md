# API Contract Generation Implementation Prompt

**Tanggal:** 2026-08-07  
**Feature:** `api-contract.ts` - Zod-First Contract Generation  
**Output:** `contracts/api-contract.ts`

---

## 🚨 MANDATORY: Activate Skills Before Implementation

**BEFORE you start ANY analysis or coding, you MUST activate these skills:**

```
Skill 1: reverse-engineering
Skill 2: compiler-bridge-architecture
```

**How to activate:**
```
1. disclose_context(name="reverse-engineering")
2. disclose_context(name="compiler-bridge-architecture")
3. Read COMPLETE skill content
4. Apply principles throughout implementation
```

**Why mandatory:**
- ✅ Ensures evidence-based analysis before design
- ✅ Follows established CompilerBridge architecture patterns
- ✅ Prevents common mistakes and anti-patterns
- ✅ Maintains consistency with existing codebase
- ✅ Implements proper SoC (Separation of Concerns)

**What happens if you skip:**
- ❌ Risk of violating CompilerBridge principles
- ❌ Risk of creating god classes
- ❌ Risk of tight coupling
- ❌ Risk of duplicate logic
- ❌ Will need refactoring later

---

## Executive Summary

**Goal:** Generate `api-contract.ts` yang menggabungkan Response Schema (read) dan Request Schema (form) menggunakan **Zod-first approach** dengan TypeScript type inference.

**🚨 CRITICAL DIFFERENCE dari api-read.ts & api-form.ts:**

| File | Structure | Naming | Purpose |
|------|-----------|--------|---------|
| `api-read.ts` | **FLAT** | **camelCase** | Frontend types (transformed) |
| `api-form.ts` | **FLAT** | **camelCase** | Form types (transformed) |
| `api-contract.ts` | **ORIGINAL** | **snake_case** | Runtime validation (backend contract) |

**Philosophy:** 
- Schema as Source of Truth, Types as Derived
- **Backend Response as-is** - NO transformation, NO flattening, NO camelCase
- **Backend Request as-is** - NO transformation, NO flattening, NO camelCase
- **Backend Contract** - Validates EXACT backend structure for both request & response

---

## 🎯 Critical Architecture Principles

### Principle 1: Response = Original Backend Structure (NO Transform)

**api-contract.ts preserves EXACT backend structure:**

```typescript
// ✅ CORRECT - api-contract.ts (backend original)
export const OrderSchema = z.object({
  total_harga: z.number(),        // ← snake_case (backend)
  invoice_number: z.string(),     // ← snake_case (backend)
  shipping: z.object({            // ← NESTED (backend)
    nama: z.string().nullable(),
    telepon: z.string().nullable(),
    alamat: z.string().nullable(),
  }).nullable().optional(),
})

// ❌ WRONG - Don't transform like api-read.ts
export const OrderSchema = z.object({
  totalHarga: z.number(),         // ← NO! Don't camelCase
  invoiceNumber: z.string(),      // ← NO! Don't camelCase
  shippingNama: z.string(),       // ← NO! Don't flatten
})
```

**Reason:** Contract validates backend's actual JSON structure.

### Principle 2: Request = ORIGINAL Backend Structure (NO Transform)

**Request schemas preserve EXACT backend structure - same as response:**

```typescript
// ✅ CORRECT - Original nested + snake_case
export const OrderCreateSchema = z.object({
  shipping: z.object({           // ← NESTED (backend original)
    nama: z.string(),            // ← snake_case (backend original)
    telepon: z.string(),         // ← snake_case (backend original)
    alamat: z.string(),          // ← snake_case (backend original)
  })
})

// ❌ WRONG - Don't flatten like api-form.ts
export const OrderCreateSchema = z.object({
  shipping_nama: z.string(),     // ← NO! Don't flatten
  shipping_telepon: z.string(),  // ← NO! Don't flatten
})

// ❌ WRONG - Don't use camelCase like api-form.ts
export const OrderCreateSchema = z.object({
  shippingNama: z.string(),      // ← NO! Don't camelCase
})
```

**Reason:** 
- Contract validates EXACT backend JSON structure
- Backend expects nested snake_case input
- NO transformation for runtime validation

---

## Feature Requirements

### 1. Complete Output Structure

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
  financial_status: z.string(),
  fulfillment_status: z.string(),
  subtotal_minor: z.number(),
  discount_minor: z.number(),
  shipping_minor: z.number(),
  tax_minor: z.number(),
  total_harga_minor: z.number(),
  created_at: z.string(),
  
  // ✅ Nested structure preserved (backend original)
  items: z.array(z.object({
    produk_item_id: z.number(),          // ← snake_case (backend)
    produk: z.object({
      id: z.number(),
      nama: z.string(),
      gambar: z.string().nullable(),
      image_url: z.string().nullable(),
    }),
    qty: z.number(),
    harga: z.number(),
    subtotal: z.number(),
  })),
  
  // ✅ Nested object (backend original)
  promotion: z.object({
    code: z.string().nullable(),
    discount_minor: z.number().nullable(),
  }).nullable().optional(),
  
  // ✅ Nested object (backend original)
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
// Request Schemas (ORIGINAL backend structure)
// ============================================

export const OrderCreateSchema = z.object({
  shipping: z.object({           // ✅ Nested (backend original)
    nama: z.string(),            // ✅ snake_case (backend original)
    telepon: z.string(),         // ✅ snake_case (backend original)
    alamat: z.string(),          // ✅ snake_case (backend original)
    kota: z.string(),            // ✅ snake_case (backend original)
    kode_pos: z.string(),        // ✅ snake_case (backend original)
  })
})

export const OrderUpdateSchema = z.object({
  status: z.string().optional(),
  // ... other update fields (nested + snake_case)
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

## Architecture Design (Evidence-Based Approach)

**⚠️  MANDATORY: Follow reverse-engineering skill principles!**

### Before You Write ANY Code:

1. **✅ Evidence Collection (2-3 hours)**
   - Read `TypeScriptGeneratorPass.ts` (understand existing pass structure)
   - Read `FormGeneratorPass.ts` (understand form generation)
   - Read `CompilerBridge.ts` (understand bridge architecture)
   - Document data flow with file:line evidence

2. **✅ Ownership Analysis (1 hour)**
   - Who owns Response data? (Backend → Original structure)
   - Who owns Request data? (Frontend → Flattened structure)
   - Document with 10 Critical Questions from reverse-engineering skill

3. **✅ Design Document (1 hour)**
   - Create evidence-based architecture design
   - Reference existing implementations
   - No assumptions without code evidence

### Pass System Architecture

```
ContractGeneratorPass (NEW)
  ├── Input: Manifest routes + validation rules
  ├── Process:
  │   ├── ContractSchemaMapper (SemanticType → Zod, NO transform)
  │   ├── ContractActionGenerator (groups schemas by resource+action)
  │   └── ContractCodeBuilder (generates final code)
  └── Output: GeneratedContractArtifact
```

### Component Responsibilities

#### 1. ContractSchemaMapper
**File:** `packages/core/src/compiler/generators/contract-generation/ContractSchemaMapper.ts`

**Responsibilities:**
- Map `SemanticType` → Zod schema definition
- **PRESERVE original backend naming (snake_case)**
- **PRESERVE original backend structure (nested)**
- Handle all type variants (primitives, objects, arrays, unions)
- Support nested objects for BOTH response AND request
- Generate nullable/optional modifiers
- Track Zod import requirements

**🚨 CRITICAL: NO Transformation (Both Request & Response)**
- ❌ Don't convert snake_case → camelCase
- ❌ Don't flatten nested objects (for both request and response)
- ✅ Keep backend structure as-is for EVERYTHING

**Key Methods:**
```typescript
class ContractSchemaMapper {
  // Main mapping (NO transformation)
  mapToZodSchema(type: SemanticType, context: MappingContext): ZodSchemaNode
  
  // Type-specific mapping
  mapPrimitiveToZod(primitive: PrimitiveType): ZodSchemaNode
  mapObjectToZod(obj: ObjectType, context: MappingContext): ZodSchemaNode
  mapArrayToZod(array: CollectionType): ZodSchemaNode
  mapUnionToZod(union: UnionType): ZodSchemaNode
  
  // Context helpers (NO transformation for contracts)
  shouldTransformNaming(context: MappingContext): boolean // always false (NO transform)
  shouldPreserveStructure(context: MappingContext): boolean // always true (preserve nested)
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
- Add imports (Zod only)
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

### Response Schemas (Original Backend Structure)

```typescript
// ✅ Response: Keep EXACT backend structure
export const OrderSchema = z.object({
  id: z.number(),
  total_harga: z.number(),       // ← snake_case (backend)
  shipping: z.object({           // ← Nested (backend)
    nama: z.string().nullable(),
    telepon: z.string().nullable(),
  }).nullable().optional(),
})
```

**Reason:** Backend sends this exact JSON, validate as-is.

### Request Schemas (ALSO Original Backend Structure)

```typescript
// ✅ Request: SAME as response - nested + snake_case
export const OrderCreateSchema = z.object({
  shipping: z.object({           // ← Nested (backend expects this)
    nama: z.string(),            // ← snake_case (backend expects this)
    telepon: z.string(),         // ← snake_case (backend expects this)
  })
})
```

**Reason:** 
- Backend expects nested snake_case input
- Contract validates EXACT backend structure
- NO transformation for runtime validation

---

## Zod Schema Mapping Rules

### Primitive Types

| SemanticType | Zod Schema | Backend Example |
|--------------|------------|-----------------|
| `PrimitiveType(STRING)` | `z.string()` | `"hello"` |
| `PrimitiveType(NUMBER)` | `z.number()` | `42.5` |
| `PrimitiveType(INTEGER)` | `z.number().int()` | `42` |
| `PrimitiveType(BOOLEAN)` | `z.boolean()` | `true` |
| `PrimitiveType(DATE)` | `z.string()` | `"2024-01-01"` |
| `PrimitiveType(DATETIME)` | `z.string()` | `"2024-01-01T10:00:00Z"` |

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
CollectionType(ARRAY, STRING) → z.array(z.string())

// Array of objects (preserve backend structure)
CollectionType(ARRAY, ObjectType) → z.array(z.object({
  field_name: z.string()  // ← snake_case preserved
}))
```

### Objects (Nested - Both Request & Response)

```typescript
// ✅ Both request & response: Keep nested structure
ObjectType({
  user_id: NUMBER,
  user: ObjectType({
    name: STRING,
    email: STRING
  })
}) → z.object({
  user_id: z.number(),      // ← snake_case
  user: z.object({          // ← Nested
    name: z.string(),
    email: z.string()
  })
})

// ✅ Request example: SAME structure as response
ObjectType({
  shipping: ObjectType({
    nama: STRING,
    telepon: STRING
  })
}) → z.object({
  shipping: z.object({           // ← Nested (backend expects this)
    nama: z.string(),            // ← snake_case (backend expects this)
    telepon: z.string()          // ← snake_case (backend expects this)
  })
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

## Implementation Steps (Evidence-Based)

### Phase 0: Evidence Collection & Analysis (Week 1 - Day 1-2)

**⚠️  MANDATORY: Do this FIRST before ANY coding!**

**Tasks:**
1. ✅ Activate reverse-engineering skill
2. ✅ Activate compiler-bridge-architecture skill
3. ✅ Read & analyze `TypeScriptGeneratorPass.ts` (document evidence)
4. ✅ Read & analyze `FormGeneratorPass.ts` (document evidence)
5. ✅ Read & analyze `CompilerBridge.ts` (document evidence)
6. ✅ Create Evidence Analysis Document with file:line references
7. ✅ Document data flow with diagrams
8. ✅ Answer 10 Critical Questions for each component

**Deliverable:** `CONTRACT_GENERATION_EVIDENCE_ANALYSIS.md`

### Phase 1: Create Schema Mapper (Week 1 - Day 3-5)

**Tasks:**
1. ✅ Create `ContractSchemaMapper.ts`
2. ✅ Implement primitive type mapping (NO transformation)
3. ✅ Implement array mapping (preserve snake_case)
4. ✅ Implement object mapping (nested for response, flattened for request)
5. ✅ Implement union mapping
6. ✅ Implement nullable/optional handling
7. ✅ Write unit tests (25+ tests)

**Test Coverage:**
- Primitives: 8 tests
- Arrays (with snake_case): 5 tests
- Objects (nested - both request & response): 8 tests
- Unions: 3 tests
- Edge cases: 5 tests

**Acceptance Criteria:**
- ✅ Response schemas preserve snake_case + nested
- ✅ Request schemas preserve snake_case + nested (SAME as response)
- ✅ NO flattening for either request or response
- ✅ All tests pass
- ✅ 95%+ coverage

### Phase 2: Create Action Generator (Week 2 - Day 1-2)

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

### Phase 3: Create Code Builder (Week 2 - Day 3-5)

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

### Phase 4: Create Pass (Week 3 - Day 1-3)

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

### Phase 5: CLI Integration (Week 3 - Day 4-5)

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
  describe('Naming Convention', () => {
    test('should preserve snake_case for response')
    test('should preserve snake_case for request')
    test('should NOT convert to camelCase')
  })
  
  describe('Structure Preservation', () => {
    test('should keep nested structure for response')
    test('should keep nested structure for request (SAME as response)')
    test('should NOT flatten for either request or response')
  })
  
  describe('Primitive Mapping', () => {
    test('should map STRING to z.string()')
    test('should map NUMBER to z.number()')
    test('should map INTEGER to z.number().int()')
    test('should map nullable STRING to z.string().nullable()')
  })
  
  describe('Array Mapping', () => {
    test('should preserve snake_case in arrays')
    test('should map array of objects')
  })
  
  describe('Object Mapping - Both Request & Response', () => {
    test('should keep nested structure for response')
    test('should keep nested structure for request')
    test('should preserve snake_case field names')
    test('should NOT flatten nested objects')
  })
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
    "shipping.nama": "required|string|max:255",
    "shipping.telepon": "required|string|max:20",
    "shipping.alamat": "required|string|max:500"
  },
  "response": {
    "type": "Order",
    "isCollection": false,
    "fields": {
      "id": "number",
      "status": "string",
      "total_harga": "number",
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

// Response Schema (ORIGINAL backend structure)
export const OrderSchema = z.object({
  id: z.number(),
  status: z.string(),
  total_harga: z.number(),            // ← snake_case (backend)
  shipping: z.object({                // ← Nested (backend)
    nama: z.string().nullable(),
    telepon: z.string().nullable(),
    alamat: z.string().nullable(),
  }).nullable().optional(),
})

// Request Schema (SAME structure - nested + snake_case)
export const OrderCreateSchema = z.object({
  shipping: z.object({                     // ← Nested (backend expects this)
    nama: z.string().max(255),            // ← snake_case (backend expects this)
    telepon: z.string().max(20),          // ← snake_case (backend expects this)
    alamat: z.string().max(500),          // ← snake_case (backend expects this)
  })
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

## Success Criteria

### Functionality
- ✅ Generates valid Zod schemas from manifest
- ✅ **Response schemas preserve ORIGINAL backend structure (snake_case + nested)**
- ✅ **Request schemas ALSO preserve ORIGINAL backend structure (snake_case + nested)**
- ✅ NO transformation to camelCase
- ✅ NO flattening for either request or response
- ✅ Type inference works correctly
- ✅ Validators work at runtime
- ✅ Handles all SemanticType variants

### Quality
- ✅ 70+ unit tests, 100% pass rate
- ✅ 25+ integration tests
- ✅ ~95% code coverage
- ✅ No TypeScript errors in generated code
- ✅ Runtime validation works correctly
- ✅ Follows evidence-based architecture
- ✅ Follows CompilerBridge principles

### Documentation
- ✅ Evidence analysis document
- ✅ Comprehensive implementation guide
- ✅ Usage examples
- ✅ Migration guide
- ✅ API reference

---

## Benefits

### For Developers
1. **Runtime Safety**: Validates backend contract at runtime
2. **Backend Contract Validation**: Ensures data matches what backend sends
3. **Type Safety**: IntelliSense from inferred types
4. **Single Source**: Schema defines validation + types
5. **No Transform Errors**: Validates EXACT backend structure

### For RouteSync Architecture
1. **Consistency**: Follows existing pass patterns
2. **Separation of Concerns**: Each generator has different purpose
3. **Testability**: Zod schemas easily testable
4. **Maintainability**: Clear responsibility boundaries
5. **Flexibility**: Can customize validation easily

---

## Timeline

**Total Duration:** 4 weeks

- **Week 1:** Evidence analysis (2 days) + ContractSchemaMapper (3 days)
- **Week 2:** ContractActionGenerator + ContractCodeBuilder
- **Week 3:** ContractGeneratorPass + CLI integration
- **Week 4:** Documentation + E2E tests + polish

**Estimated Effort:** ~80-100 hours

---

## References

### Existing Implementations
- `packages/core/src/compiler/passes/TypeScriptGeneratorPass.ts` (pass structure)
- `packages/core/src/compiler/passes/FormGeneratorPass.ts` (form generation reference - NOTE: Form uses flattening, Contract does NOT)
- `packages/core/src/compiler/generators/CompilerBridge.ts` (bridge architecture)
- `packages/core/src/compiler/generators/form-generation/FormFieldMapper.ts` (reference only - Contract does NOT flatten)

### Documentation
- `.kiro/steering/frontend-domain-model.md` (philosophy)
- `.kiro/steering/evidence-based-architecture.md` (analysis approach)
- `.kiro/steering/skills/compiler-bridge-architecture/SKILL.md` (architecture rules)
- `.kiro/steering/skills/reverse-engineering/SKILL.md` (analysis methodology)

---

## 🏗️ Code Architecture Principles (Maintainability Focus)

### Prinsip Utama: Small, Reusable, Composable

**⚠️ MANDATORY: NEVER create large classes without small reusable building blocks!**

### 1. ✅ Small Classes Principle

**Rule:** Setiap class harus **single purpose** dan **< 200 lines**.

```typescript
// ❌ BAD: God class dengan 1000+ lines
class ContractGenerator {
  mapPrimitive() { /* 50 lines */ }
  mapArray() { /* 80 lines */ }
  mapObject() { /* 120 lines */ }
  mapUnion() { /* 60 lines */ }
  generateSchema() { /* 100 lines */ }
  generateTypes() { /* 150 lines */ }
  generateValidators() { /* 200 lines */ }
  buildCode() { /* 300 lines */ }
  formatCode() { /* 100 lines */ }
  // Total: 1160 lines - UNMAINTAINABLE!
}
```

```typescript
// ✅ GOOD: Small, focused classes
class PrimitiveMapper {
  map(primitive: PrimitiveType): ZodPrimitive {
    // 30 lines - FOCUSED
  }
}

class ArrayMapper {
  constructor(private typeMapper: TypeMapper) {}
  map(array: CollectionType): ZodArray {
    // 40 lines - FOCUSED
  }
}

class ObjectMapper {
  constructor(private typeMapper: TypeMapper) {}
  map(object: ObjectType): ZodObject {
    // 60 lines - FOCUSED
  }
}

class UnionMapper {
  constructor(private typeMapper: TypeMapper) {}
  map(union: UnionType): ZodUnion {
    // 40 lines - FOCUSED
  }
}

// Composition
class TypeMapper {
  constructor(
    private primitiveMapper: PrimitiveMapper,
    private arrayMapper: ArrayMapper,
    private objectMapper: ObjectMapper,
    private unionMapper: UnionMapper
  ) {}
  
  map(type: SemanticType): ZodSchema {
    // 50 lines - ORCHESTRATION ONLY
    if (isPrimitive(type)) return this.primitiveMapper.map(type)
    if (isArray(type)) return this.arrayMapper.map(type)
    if (isObject(type)) return this.objectMapper.map(type)
    if (isUnion(type)) return this.unionMapper.map(type)
    throw new UnknownTypeError(type)
  }
}
```

### 2. ✅ Dependency Injection (Wiring Pattern)

**Rule:** Large classes harus **composed** dari small classes via DI.

```typescript
// ❌ BAD: Tight coupling, cannot test independently
class ContractCodeBuilder {
  buildCode(schemas: ZodSchema[]): string {
    const mapper = new TypeMapper() // ← Hard-coded dependency
    const generator = new SchemaGenerator() // ← Hard-coded
    const formatter = new CodeFormatter() // ← Hard-coded
    // Cannot mock, cannot swap, cannot test
  }
}
```

```typescript
// ✅ GOOD: Dependency injection for testability & flexibility
interface ITypeMapper {
  map(type: SemanticType): ZodSchema
}

interface ISchemaGenerator {
  generate(schemas: ZodSchema[]): string
}

interface ICodeFormatter {
  format(code: string): string
}

class ContractCodeBuilder {
  constructor(
    private typeMapper: ITypeMapper,
    private schemaGenerator: ISchemaGenerator,
    private codeFormatter: ICodeFormatter
  ) {}
  
  buildCode(types: SemanticType[]): string {
    // ✅ Can inject mocks for testing
    // ✅ Can swap implementations
    // ✅ Each dependency testable independently
    const schemas = types.map(t => this.typeMapper.map(t))
    const code = this.schemaGenerator.generate(schemas)
    return this.codeFormatter.format(code)
  }
}

// Usage with real implementations
const builder = new ContractCodeBuilder(
  new TypeMapper(
    new PrimitiveMapper(),
    new ArrayMapper(typeMapper),
    new ObjectMapper(typeMapper),
    new UnionMapper(typeMapper)
  ),
  new SchemaGenerator(),
  new CodeFormatter()
)

// Usage in tests with mocks
const mockBuilder = new ContractCodeBuilder(
  mockTypeMapper,
  mockSchemaGenerator,
  mockCodeFormatter
)
```

### 3. ✅ SoC (Separation of Concerns)

**Rule:** Setiap class hanya bertanggung jawab untuk **satu hal**.

```typescript
// ❌ BAD: Multiple concerns in one class
class ContractGenerator {
  // Concern 1: Type mapping
  mapType(type: SemanticType): ZodSchema { /* */ }
  
  // Concern 2: Schema generation
  generateSchema(types: SemanticType[]): string { /* */ }
  
  // Concern 3: Code formatting
  formatCode(code: string): string { /* */ }
  
  // Concern 4: File I/O
  writeFile(path: string, code: string): void { /* */ }
  
  // TOO MANY CONCERNS!
}
```

```typescript
// ✅ GOOD: One concern per class
class TypeMapper {
  // Concern: Type → Zod mapping ONLY
  map(type: SemanticType): ZodSchema
}

class SchemaGenerator {
  // Concern: Zod → Code string ONLY
  generate(schemas: ZodSchema[]): string
}

class CodeFormatter {
  // Concern: Code formatting ONLY
  format(code: string): string
}

class FileWriter {
  // Concern: File I/O ONLY
  write(path: string, content: string): void
}

// Orchestrator (thin layer)
class ContractGeneratorOrchestrator {
  constructor(
    private typeMapper: TypeMapper,
    private schemaGenerator: SchemaGenerator,
    private codeFormatter: CodeFormatter,
    private fileWriter: FileWriter
  ) {}
  
  generate(types: SemanticType[], outputPath: string): void {
    const schemas = types.map(t => this.typeMapper.map(t))
    const code = this.schemaGenerator.generate(schemas)
    const formatted = this.codeFormatter.format(code)
    this.fileWriter.write(outputPath, formatted)
  }
}
```

### 4. ✅ SoT (Single Source of Truth)

**Rule:** Setiap piece of logic hanya ada di **satu tempat**.

```typescript
// ❌ BAD: Duplicate logic di banyak tempat
class TypeMapper {
  mapPrimitive(type: PrimitiveType): ZodPrimitive {
    if (type.kind === 'string') return z.string()
    if (type.kind === 'number') return z.number()
    // ... primitive mapping logic
  }
}

class ValidationMapper {
  mapRule(rule: ValidationRule): ZodSchema {
    if (rule.type === 'string') return z.string() // ← DUPLICATE!
    if (rule.type === 'number') return z.number() // ← DUPLICATE!
    // Same logic duplicated!
  }
}

class SchemaGenerator {
  generateSchema(type: string): string {
    if (type === 'string') return 'z.string()' // ← DUPLICATE AGAIN!
    if (type === 'number') return 'z.number()' // ← DUPLICATE AGAIN!
  }
}
```

```typescript
// ✅ GOOD: Single source of truth
class PrimitiveTypeRegistry {
  // ✅ SINGLE place for primitive type mapping
  private static readonly MAPPINGS: Record<PrimitiveKind, () => ZodPrimitive> = {
    string: () => z.string(),
    number: () => z.number(),
    integer: () => z.number().int(),
    boolean: () => z.boolean(),
    date: () => z.string(), // ISO date string
    datetime: () => z.string(), // ISO datetime string
  }
  
  static getZodType(kind: PrimitiveKind): ZodPrimitive {
    const mapper = this.MAPPINGS[kind]
    if (!mapper) throw new UnknownPrimitiveError(kind)
    return mapper()
  }
  
  static getZodCode(kind: PrimitiveKind): string {
    // ✅ Code generation also uses SAME registry
    const typeMap: Record<PrimitiveKind, string> = {
      string: 'z.string()',
      number: 'z.number()',
      integer: 'z.number().int()',
      boolean: 'z.boolean()',
      date: 'z.string()',
      datetime: 'z.string()',
    }
    return typeMap[kind]
  }
}

// All mappers use same registry
class TypeMapper {
  mapPrimitive(type: PrimitiveType): ZodPrimitive {
    return PrimitiveTypeRegistry.getZodType(type.kind)
  }
}

class SchemaGenerator {
  generatePrimitive(type: PrimitiveType): string {
    return PrimitiveTypeRegistry.getZodCode(type.kind)
  }
}
```

### 5. ✅ Utility Classes (Shared Helpers)

**Rule:** Extract common patterns ke reusable utilities.

```typescript
// ✅ GOOD: Shared utilities
class ZodModifierBuilder {
  // ✅ Reusable across all mappers
  static addNullable(schema: ZodSchema): ZodSchema {
    return schema.nullable()
  }
  
  static addOptional(schema: ZodSchema): ZodSchema {
    return schema.optional()
  }
  
  static addValidation(
    schema: ZodSchema,
    rules: ValidationRule[]
  ): ZodSchema {
    let result = schema
    for (const rule of rules) {
      result = this.applyRule(result, rule)
    }
    return result
  }
  
  private static applyRule(
    schema: ZodSchema,
    rule: ValidationRule
  ): ZodSchema {
    switch (rule.type) {
      case 'min': return schema.min(rule.value)
      case 'max': return schema.max(rule.value)
      case 'email': return schema.email()
      case 'url': return schema.url()
      default: return schema
    }
  }
}

// Usage in mappers
class ObjectMapper {
  map(object: ObjectType): ZodObject {
    let schema = z.object({ /* fields */ })
    
    // ✅ Reuse utility
    if (object.nullable) {
      schema = ZodModifierBuilder.addNullable(schema)
    }
    
    if (object.optional) {
      schema = ZodModifierBuilder.addOptional(schema)
    }
    
    return schema
  }
}
```

### 6. ✅ Factory Pattern (Object Creation)

**Rule:** Complex object creation melalui factory.

```typescript
// ✅ GOOD: Factory for mapper creation
class MapperFactory {
  static createTypeMapper(): TypeMapper {
    const primitiveMapper = new PrimitiveMapper()
    const typeMapper = new TypeMapper(
      primitiveMapper,
      null!, // Will be set after circular dependency resolved
      null!,
      null!
    )
    
    const arrayMapper = new ArrayMapper(typeMapper)
    const objectMapper = new ObjectMapper(typeMapper)
    const unionMapper = new UnionMapper(typeMapper)
    
    // Set circular dependencies
    ;(typeMapper).arrayMapper = arrayMapper
    ;(typeMapper).objectMapper = objectMapper
    ;(typeMapper).unionMapper = unionMapper
    
    return typeMapper
  }
  
  static createContractGenerator(): ContractGenerator {
    const typeMapper = this.createTypeMapper()
    const schemaGenerator = new SchemaGenerator()
    const codeFormatter = new CodeFormatter()
    
    return new ContractGenerator(
      typeMapper,
      schemaGenerator,
      codeFormatter
    )
  }
}

// Usage
const generator = MapperFactory.createContractGenerator()
```

### 7. ✅ Test-Driven Class Design

**Rule:** Design classes untuk testability.

```typescript
// ✅ GOOD: Pure functions, easy to test
class TypeMapper {
  // ✅ Pure function: no side effects, no state
  map(type: SemanticType): ZodSchema {
    // Deterministic: same input → same output
  }
}

// Test
describe('TypeMapper', () => {
  test('should map string to z.string()', () => {
    const mapper = new TypeMapper(/* dependencies */)
    const result = mapper.map({ kind: 'string' })
    expect(result).toEqual(z.string())
  })
})
```

### 8. ✅ Anti-Pattern Detection

**🚨 RED FLAGS indicating bad design:**

#### Red Flag 1: Class > 200 lines
```typescript
// ❌ BAD: Too large
class ContractGenerator {
  // 1500 lines - BREAK IT DOWN!
}
```

**Fix:** Split into smaller classes with single responsibilities.

#### Red Flag 2: Method > 50 lines
```typescript
// ❌ BAD: Method too long
map(type: SemanticType): ZodSchema {
  // 150 lines of if/else - EXTRACT METHODS!
}
```

**Fix:** Extract to smaller methods or separate classes.

#### Red Flag 3: No dependency injection
```typescript
// ❌ BAD: Hard-coded dependencies
class Generator {
  generate() {
    const mapper = new TypeMapper() // ← Cannot test
  }
}
```

**Fix:** Inject dependencies via constructor.

#### Red Flag 4: Multiple concerns
```typescript
// ❌ BAD: Doing everything
class Generator {
  parse() { /* */ }
  map() { /* */ }
  generate() { /* */ }
  format() { /* */ }
  write() { /* */ }
}
```

**Fix:** One class per concern.

#### Red Flag 5: Duplicate logic
```typescript
// ❌ BAD: Same logic in multiple places
if (type === 'string') return z.string() // In class A
if (type === 'string') return z.string() // In class B
if (type === 'string') return z.string() // In class C
```

**Fix:** Extract to shared registry/utility.

---

## 📐 Recommended Class Structure

### File Organization
```
contract-generation/
├── mappers/
│   ├── TypeMapper.ts              (50 lines - orchestrator)
│   ├── PrimitiveMapper.ts         (30 lines)
│   ├── ArrayMapper.ts             (40 lines)
│   ├── ObjectMapper.ts            (60 lines)
│   ├── UnionMapper.ts             (40 lines)
│   └── __tests__/
│       ├── TypeMapper.test.ts     (80 lines)
│       ├── PrimitiveMapper.test.ts (40 lines)
│       ├── ArrayMapper.test.ts    (50 lines)
│       ├── ObjectMapper.test.ts   (70 lines)
│       └── UnionMapper.test.ts    (50 lines)
├── generators/
│   ├── SchemaGenerator.ts         (80 lines)
│   ├── TypeGenerator.ts           (60 lines)
│   ├── ValidatorGenerator.ts      (70 lines)
│   └── __tests__/
│       ├── SchemaGenerator.test.ts
│       ├── TypeGenerator.test.ts
│       └── ValidatorGenerator.test.ts
├── builders/
│   ├── ContractCodeBuilder.ts     (100 lines - orchestrator)
│   ├── ImportBuilder.ts           (40 lines)
│   ├── SectionBuilder.ts          (50 lines)
│   └── __tests__/
│       ├── ContractCodeBuilder.test.ts
│       ├── ImportBuilder.test.ts
│       └── SectionBuilder.test.ts
├── utils/
│   ├── PrimitiveTypeRegistry.ts   (50 lines)
│   ├── ZodModifierBuilder.ts      (60 lines)
│   ├── NamingHelper.ts            (40 lines)
│   └── __tests__/
│       ├── PrimitiveTypeRegistry.test.ts
│       ├── ZodModifierBuilder.test.ts
│       └── NamingHelper.test.ts
└── ContractSchemaMapper.ts        (120 lines - main facade)
```

### Class Size Guidelines

| Type | Max Lines | Purpose |
|------|-----------|---------|
| Mapper | 60 lines | Single type mapping |
| Generator | 80 lines | Single section generation |
| Builder | 100 lines | Orchestration only |
| Utility | 60 lines | Pure helper functions |
| Factory | 80 lines | Object creation |
| Facade | 150 lines | Public API (delegates to small classes) |

### Dependency Graph Example
```
ContractSchemaMapper (Facade)
  ↓
TypeMapper (Orchestrator)
  ├─→ PrimitiveMapper
  ├─→ ArrayMapper ──→ TypeMapper (circular, OK via DI)
  ├─→ ObjectMapper ──→ TypeMapper (circular, OK via DI)
  └─→ UnionMapper ──→ TypeMapper (circular, OK via DI)

ContractCodeBuilder (Orchestrator)
  ├─→ TypeMapper
  ├─→ SchemaGenerator
  │     ├─→ PrimitiveTypeRegistry (utility)
  │     └─→ ZodModifierBuilder (utility)
  ├─→ TypeGenerator
  │     └─→ NamingHelper (utility)
  └─→ ValidatorGenerator
        └─→ NamingHelper (utility)
```

---

## ✅ Implementation Checklist: Code Quality

### Before Writing ANY Class

- [ ] Is this class < 200 lines? If not, split it.
- [ ] Does it have ONE clear responsibility?
- [ ] Are dependencies injected (not hard-coded)?
- [ ] Can I test this class in isolation?
- [ ] Is there duplicate logic that should be extracted?

### During Implementation

- [ ] Each method < 50 lines
- [ ] No nested if/else > 3 levels deep
- [ ] Extract magic values to constants/registry
- [ ] Use meaningful names (no abbreviations)
- [ ] Add JSDoc comments for public APIs

### After Implementation

- [ ] Unit tests for EACH small class (95%+ coverage)
- [ ] Integration test for orchestrator
- [ ] No duplicate logic found
- [ ] Dependencies can be mocked
- [ ] Code review against anti-patterns

---

## 🚨 Final Reminders

### Before Implementation:
1. ✅ **ACTIVATE SKILLS** (reverse-engineering + compiler-bridge-architecture)
2. ✅ **EVIDENCE COLLECTION** (read existing code, document data flow)
3. ✅ **NO ASSUMPTIONS** (every decision backed by evidence)

### During Implementation:
1. ✅ **NO TRANSFORMATION** (preserve backend structure)
2. ✅ **snake_case ONLY** (never camelCase)
3. ✅ **SoC Architecture** (separate mapper, generator, builder)
4. ✅ **Small Classes** (< 200 lines, single responsibility)
5. ✅ **DI Pattern** (inject dependencies, no hard-coding)
6. ✅ **No Duplication** (extract to registry/utility)
7. ✅ **Testability** (pure functions, mockable dependencies)

### After Implementation:
1. ✅ **100% TEST PASS** (70+ unit tests)
2. ✅ **NO God Classes** (check class sizes)
3. ✅ **NO Duplicate Logic** (verify SoT principle)
4. ✅ **DOCUMENTATION** (evidence analysis + usage guide)
5. ✅ **CODE REVIEW** (verify principles followed)
6. ✅ **Anti-Pattern Check** (run through red flags list)

---

**Status:** READY FOR IMPLEMENTATION  
**Priority:** HIGH  
**Complexity:** MEDIUM-HIGH  
**Risk:** LOW (follows established patterns + evidence-based approach)  
**Architecture Compliance:** MANDATORY (skills must be followed)

