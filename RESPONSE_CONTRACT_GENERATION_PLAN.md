# Response Contract Generation - Implementation Plan

**Date**: 2026-08-08  
**Feature**: Response Validation Schemas (Nested Structure)  
**Status**: Planning Phase  
**Architecture**: SOC + SOT + Small Reusable Components

---

## 🎯 Goal

Generate **Response Validation Schemas** dengan struktur **NESTED** dari `manifest.routes[].response`:

```typescript
// Target Output
export const OrderSchema = z.object({
  id: z.number(),
  status: z.string(),
  
  // NESTED object
  shipping: z.object({
    nama: z.string().nullable(),
    telepon: z.string().nullable(),
    alamat: z.string().nullable(),
  }).nullable().optional(),
  
  // ARRAY of NESTED objects
  items: z.array(z.object({
    produk_item_id: z.number(),
    produk: z.object({
      id: z.number(),
      nama: z.string(),
    }),
    qty: z.number(),
  }))
});

export const OrderIndexSchema = z.array(OrderSchema);
```

---

## 📊 Data Flow Analysis

### Input Source

**Location**: `manifest.routes[].response`

**Structure Example**:
```json
{
  "response": {
    "kind": "resource",
    "resource": "OrderResource",
    "model": "Order",
    "collection": false,
    "fields": {
      "id": { "kind": "primitive", "type": "number" },
      "shipping": {
        "kind": "object",
        "fields": {
          "nama": { "kind": "primitive", "type": "string" },
          "telepon": { "kind": "primitive", "type": "string" }
        }
      },
      "items": {
        "kind": "array",
        "items": {
          "kind": "object",
          "fields": {
            "produk_item_id": { "kind": "primitive", "type": "number" }
          }
        }
      }
    }
  }
}
```

### Output Structure

**File**: `contracts/api-contract.ts`

**Sections** (akan ditambahkan ke existing file):
```typescript
// SECTION 1: Request Schemas (sudah ada - flat)
export const checkoutContractSchema = {
  create: z.object({ shipping_nama: z.string() })
};

// SECTION 2: Response Schemas (NEW - nested)
export const checkoutResponseSchema = z.object({
  shipping: z.object({
    nama: z.string().nullable()
  })
});

export const checkoutIndexSchema = z.array(checkoutResponseSchema);

// SECTION 3: Types (combined)
export type checkoutContract = {
  create: z.infer<typeof checkoutContractSchema.create>,
  response: z.infer<typeof checkoutResponseSchema>,
  index: z.infer<typeof checkoutIndexSchema>
};

// SECTION 4: Validators (combined)
export const validateCheckoutCreate = (data: unknown) => 
  checkoutContractSchema.create.parse(data);

export const validateCheckoutResponse = (data: unknown) =>
  checkoutResponseSchema.parse(data);
```

---

## 🏗️ Architecture Design

### Core Principles

1. **SOC (Separation of Concerns)**
   - Each component has ONE responsibility
   - No component does multiple unrelated things
   - Clear boundaries between layers

2. **SOT (Single Source of Truth)**
   - Response structure from manifest is SSOT
   - No duplicate parsing logic
   - All components read from same source

3. **Small Reusable Components**
   - Each class < 200 lines
   - Single public method per responsibility
   - Dependency injection everywhere
   - No god classes

---

## 📦 Component Architecture

### Layer 1: Response Shape Parser (NEW)

**Purpose**: Parse `manifest.routes[].response.fields` structure

#### Component 1.1: ResponseFieldParser
**File**: `packages/core/src/compiler/generators/contract-generation/ResponseFieldParser.ts`

**Responsibility**: Parse SINGLE field from response
```typescript
/**
 * Parses a single response field into internal representation
 * 
 * SOC: Only field parsing, no Zod generation
 * SOT: Source is manifest.routes[].response.fields[fieldName]
 */
export class ResponseFieldParser {
  /**
   * Parse a single field
   * @returns ParsedResponseField with kind, type, nullable, optional
   */
  parseField(
    fieldName: string, 
    fieldData: ResponseFieldData
  ): ParsedResponseField {
    // Determine field kind (primitive | object | array)
    // Extract type information
    // Detect nullable/optional modifiers
    // Return normalized structure
  }
}
```

**Input**: 
```typescript
interface ResponseFieldData {
  kind: 'primitive' | 'object' | 'array' | 'variable';
  type?: string;
  fields?: Record<string, ResponseFieldData>;
  items?: ResponseFieldData;
}
```

**Output**:
```typescript
interface ParsedResponseField {
  name: string;
  kind: 'primitive' | 'object' | 'array';
  type?: string;
  nullable: boolean;
  optional: boolean;
  fields?: ParsedResponseField[];  // For objects
  itemType?: ParsedResponseField;  // For arrays
}
```

**Tests**: 15-20 tests
- Parse primitive field
- Parse nullable primitive
- Parse optional primitive
- Parse object field
- Parse nested object
- Parse array field
- Parse array of objects
- Handle edge cases

---

#### Component 1.2: ResponseStructureBuilder
**File**: `packages/core/src/compiler/generators/contract-generation/ResponseStructureBuilder.ts`

**Responsibility**: Build complete response structure tree
```typescript
/**
 * Builds complete response structure from all fields
 * 
 * SOC: Structure building only, no Zod generation
 * SOT: Uses ResponseFieldParser for field parsing
 */
export class ResponseStructureBuilder {
  constructor(
    private fieldParser: ResponseFieldParser
  ) {}
  
  /**
   * Build complete structure from response fields
   */
  buildStructure(
    responseFields: Record<string, ResponseFieldData>
  ): ResponseStructure {
    // Parse each field using ResponseFieldParser
    // Build tree structure
    // Detect relationships
    // Return complete structure
  }
}
```

**Input**: All response fields from manifest
**Output**:
```typescript
interface ResponseStructure {
  fields: ParsedResponseField[];
  hasNested: boolean;
  hasArrays: boolean;
  maxDepth: number;
}
```

**Tests**: 15-20 tests
- Build flat structure
- Build nested structure
- Build with arrays
- Build deeply nested
- Handle circular references (if needed)

---

### Layer 2: Zod Schema Builders (NEW)

#### Component 2.1: NestedObjectSchemaBuilder
**File**: `packages/core/src/compiler/generators/contract-generation/NestedObjectSchemaBuilder.ts`

**Responsibility**: Build `z.object()` for nested objects
```typescript
/**
 * Builds Zod z.object() schemas for nested objects
 * 
 * SOC: Only object schema building, no arrays
 * SOT: Input is ParsedResponseField from ResponseFieldParser
 */
export class NestedObjectSchemaBuilder {
  constructor(
    private primitiveRegistry: PrimitiveTypeRegistry,
    private zodModifierBuilder: ZodModifierBuilder
  ) {}
  
  /**
   * Build z.object() schema recursively
   */
  buildObjectSchema(field: ParsedResponseField): string {
    // Build z.object({...}) syntax
    // Handle nested objects recursively
    // Apply modifiers (.nullable(), .optional())
    // Return Zod code string
  }
}
```

**Input**: `ParsedResponseField` with `kind: 'object'`
**Output**: `string` (Zod code)

**Example**:
```typescript
// Input
{
  name: 'shipping',
  kind: 'object',
  nullable: true,
  optional: true,
  fields: [
    { name: 'nama', kind: 'primitive', type: 'string', nullable: true }
  ]
}

// Output
"z.object({ nama: z.string().nullable() }).nullable().optional()"
```

**Tests**: 20-25 tests
- Build simple object
- Build nested object
- Build deeply nested
- Handle nullable objects
- Handle optional objects
- Recursive nesting

---

#### Component 2.2: ArraySchemaBuilder
**File**: `packages/core/src/compiler/generators/contract-generation/ArraySchemaBuilder.ts`

**Responsibility**: Build `z.array()` schemas
```typescript
/**
 * Builds Zod z.array() schemas
 * 
 * SOC: Only array schema building
 * SOT: Uses NestedObjectSchemaBuilder for array items
 */
export class ArraySchemaBuilder {
  constructor(
    private objectBuilder: NestedObjectSchemaBuilder,
    private primitiveRegistry: PrimitiveTypeRegistry
  ) {}
  
  /**
   * Build z.array() schema
   */
  buildArraySchema(field: ParsedResponseField): string {
    // Build z.array(...) syntax
    // Handle primitive arrays
    // Handle object arrays (delegate to objectBuilder)
    // Apply modifiers if needed
    // Return Zod code string
  }
}
```

**Input**: `ParsedResponseField` with `kind: 'array'`
**Output**: `string` (Zod code)

**Example**:
```typescript
// Input: array of objects
{
  name: 'items',
  kind: 'array',
  itemType: {
    kind: 'object',
    fields: [
      { name: 'id', kind: 'primitive', type: 'number' }
    ]
  }
}

// Output
"z.array(z.object({ id: z.number() }))"
```

**Tests**: 15-20 tests
- Build primitive array
- Build object array
- Build nested object array
- Build array of arrays
- Handle nullable items

---

#### Component 2.3: ResponseSchemaMapper
**File**: `packages/core/src/compiler/generators/contract-generation/ResponseSchemaMapper.ts`

**Responsibility**: Map complete response to Zod schema
```typescript
/**
 * Maps complete response structure to Zod schema
 * 
 * SOC: Schema mapping coordination only
 * SOT: Delegates to specialized builders
 */
export class ResponseSchemaMapper {
  constructor(
    private primitiveRegistry: PrimitiveTypeRegistry,
    private objectBuilder: NestedObjectSchemaBuilder,
    private arrayBuilder: ArraySchemaBuilder,
    private zodModifierBuilder: ZodModifierBuilder
  ) {}
  
  /**
   * Map response structure to complete Zod schema
   */
  mapToSchema(structure: ResponseStructure): string {
    // Build top-level z.object()
    // Delegate field building to specialized builders
    // Combine all fields
    // Return complete schema code
  }
}
```

**Input**: `ResponseStructure`
**Output**: Complete Zod schema code

**Tests**: 20-25 tests
- Map simple response
- Map nested response
- Map with arrays
- Map complex structure
- Handle all field types

---

### Layer 3: Response Action Generator (NEW)

#### Component 3.1: ResponseActionGenerator
**File**: `packages/core/src/compiler/generators/contract-generation/ResponseActionGenerator.ts`

**Responsibility**: Generate response schemas per resource
```typescript
/**
 * Generates response schemas grouped by resource
 * 
 * SOC: Action grouping only, no schema generation
 * SOT: Uses ResponseSchemaMapper for schema generation
 */
export class ResponseActionGenerator {
  constructor(
    private schemaMapper: ResponseSchemaMapper
  ) {}
  
  /**
   * Generate response actions for a resource
   */
  generateActions(
    resourceName: string,
    routes: RouteWithResponse[]
  ): ResponseAction[] {
    // Group by action type (single, collection)
    // Generate schema for single response
    // Generate schema for collection (z.array(...))
    // Return all actions
  }
}
```

**Output**:
```typescript
interface ResponseAction {
  resourceName: string;
  actionType: 'single' | 'collection';
  schemaName: string;
  schemaCode: string;
}
```

**Tests**: 15-20 tests
- Generate single response
- Generate collection response
- Handle multiple resources
- Handle missing response data

---

### Layer 4: Code Builder (UPDATE EXISTING)

#### Component 4.1: ContractCodeBuilder (UPDATE)
**File**: `packages/core/src/compiler/generators/contract-generation/ContractCodeBuilder.ts`

**Changes**: Add response schema section
```typescript
export class ContractCodeBuilder {
  // Existing methods unchanged
  
  /**
   * Build response schemas section (NEW)
   */
  buildResponseSchemas(
    responseActions: ResponseAction[]
  ): string {
    // Build "// Response Schemas" section
    // Export response schemas
    // Export collection schemas
    // Return code string
  }
  
  /**
   * Update buildCompleteContract() to include responses
   */
  buildCompleteContract(
    requestContracts: ContractAction[],
    responseActions: ResponseAction[]  // NEW parameter
  ): string {
    // Section 1: Request Schemas (existing)
    // Section 2: Response Schemas (NEW)
    // Section 3: Combined Types (update)
    // Section 4: Combined Validators (update)
  }
}
```

**Tests**: Add 15-20 new tests
- Build response section
- Build combined contract
- Handle both request + response
- Handle missing response

---

### Layer 5: Pass Orchestration (UPDATE EXISTING)

#### Component 5.1: ContractGeneratorPass (UPDATE)
**File**: `packages/core/src/compiler/passes/ContractGeneratorPass.ts`

**Changes**: Add response generation
```typescript
export class ContractGeneratorPass implements CompilerPass {
  constructor(
    // Existing dependencies
    private requestSchemaMapper: ContractSchemaMapper,
    private requestActionGenerator: ContractActionGenerator,
    
    // NEW dependencies
    private responseFieldParser: ResponseFieldParser,
    private responseStructureBuilder: ResponseStructureBuilder,
    private responseSchemaMapper: ResponseSchemaMapper,
    private responseActionGenerator: ResponseActionGenerator,
    
    private codeBuilder: ContractCodeBuilder
  ) {}
  
  async run(inputs: ContractGenerationInput[]): Promise<GeneratedContractArtifact[]> {
    const results: GeneratedContractArtifact[] = [];
    
    for (const input of inputs) {
      // EXISTING: Generate request contracts
      const requestContracts = this.generateRequestContracts(input);
      
      // NEW: Generate response contracts
      const responseActions = this.generateResponseContracts(input);
      
      // UPDATED: Build complete contract with both
      const code = this.codeBuilder.buildCompleteContract(
        requestContracts,
        responseActions
      );
      
      results.push(new GeneratedContractArtifact(code, input.resourceName));
    }
    
    return results;
  }
  
  /**
   * Generate response contracts (NEW)
   */
  private generateResponseContracts(input: ContractGenerationInput): ResponseAction[] {
    // Parse response fields
    const structure = this.responseStructureBuilder.buildStructure(
      input.responseFields
    );
    
    // Map to Zod schema
    const schemaCode = this.responseSchemaMapper.mapToSchema(structure);
    
    // Generate actions
    return this.responseActionGenerator.generateActions(
      input.resourceName,
      input.routes,
      schemaCode
    );
  }
}
```

**Tests**: Add 20-25 new tests
- Generate with response only
- Generate with request only
- Generate with both
- Handle complex responses
- Integration tests

---

### Layer 6: CLI Integration (UPDATE)

#### Component 6.1: CompilerBridge (UPDATE)
**File**: `packages/cli/src/generators/CompilerBridge.ts`

**Changes**: Add response data extraction
```typescript
export class CompilerBridge {
  // Existing methods unchanged
  
  /**
   * Extract response fields from manifest (NEW)
   */
  private manifestToResponseFields(
    route: ManifestRoute
  ): Record<string, ResponseFieldData> | null {
    if (!route.response || !route.response.fields) {
      return null;
    }
    
    return route.response.fields;
  }
  
  /**
   * Update manifestToContractInput() to include response
   */
  private manifestToContractInput(manifest: Manifest): ContractGenerationInput[] {
    // Group by resource
    // Extract validation rules (existing)
    // Extract response fields (NEW)
    // Return inputs with both
  }
}
```

**Tests**: Add 10-15 new tests
- Extract response fields
- Handle missing response
- Handle complex responses
- Integration with pass

---

## 📁 File Structure

```
packages/core/src/compiler/generators/contract-generation/
├── PrimitiveTypeRegistry.ts              # Existing - no changes
├── ZodModifierBuilder.ts                 # Existing - no changes
├── ContractSchemaMapper.ts               # Existing - request schemas
├── ContractActionGenerator.ts            # Existing - request actions
├── ContractCodeBuilder.ts                # UPDATE - add response section
├── ResponseFieldParser.ts                # NEW
├── ResponseStructureBuilder.ts           # NEW
├── NestedObjectSchemaBuilder.ts          # NEW
├── ArraySchemaBuilder.ts                 # NEW
├── ResponseSchemaMapper.ts               # NEW
├── ResponseActionGenerator.ts            # NEW
└── __tests__/
    ├── PrimitiveTypeRegistry.test.ts     # Existing
    ├── ZodModifierBuilder.test.ts        # Existing
    ├── ContractSchemaMapper.test.ts      # Existing
    ├── ContractActionGenerator.test.ts   # Existing
    ├── ContractCodeBuilder.test.ts       # UPDATE
    ├── ResponseFieldParser.test.ts       # NEW
    ├── ResponseStructureBuilder.test.ts  # NEW
    ├── NestedObjectSchemaBuilder.test.ts # NEW
    ├── ArraySchemaBuilder.test.ts        # NEW
    ├── ResponseSchemaMapper.test.ts      # NEW
    └── ResponseActionGenerator.test.ts   # NEW
```

---

## 🔄 Dependency Graph

```
ResponseFieldParser (no deps)
         ↓
ResponseStructureBuilder
         ↓
         ├─→ NestedObjectSchemaBuilder → PrimitiveTypeRegistry
         │                            → ZodModifierBuilder
         ↓
ArraySchemaBuilder → NestedObjectSchemaBuilder
         ↓
ResponseSchemaMapper → All builders above
         ↓
ResponseActionGenerator → ResponseSchemaMapper
         ↓
ContractCodeBuilder (uses both request + response)
         ↓
ContractGeneratorPass (orchestrates everything)
         ↓
CompilerBridge (CLI integration)
```

**Clear Dependency Direction**: Bottom → Top (no circular deps)

---

## 📝 Implementation Steps

### Phase 1: Foundation (Week 1)

**Step 1**: ResponseFieldParser
- Create class
- Implement field parsing logic
- Write 15-20 tests
- Verify all tests pass

**Step 2**: ResponseStructureBuilder
- Create class with ResponseFieldParser dependency
- Implement structure building
- Write 15-20 tests
- Verify all tests pass

**Checkpoint**: Can parse response fields into internal structure

---

### Phase 2: Schema Builders (Week 1-2)

**Step 3**: NestedObjectSchemaBuilder
- Create class
- Implement recursive object building
- Write 20-25 tests
- Verify all tests pass

**Step 4**: ArraySchemaBuilder
- Create class with NestedObjectSchemaBuilder dependency
- Implement array schema building
- Write 15-20 tests
- Verify all tests pass

**Step 5**: ResponseSchemaMapper
- Create class with all builder dependencies
- Implement complete schema mapping
- Write 20-25 tests
- Verify all tests pass

**Checkpoint**: Can generate Zod schemas for response structures

---

### Phase 3: Integration (Week 2)

**Step 6**: ResponseActionGenerator
- Create class with ResponseSchemaMapper dependency
- Implement action generation
- Write 15-20 tests
- Verify all tests pass

**Step 7**: Update ContractCodeBuilder
- Add response section building
- Update complete contract builder
- Write 15-20 new tests
- Verify all tests pass

**Step 8**: Update ContractGeneratorPass
- Add response generation logic
- Integrate with existing request generation
- Write 20-25 integration tests
- Verify all tests pass

**Checkpoint**: Complete pipeline working

---

### Phase 4: CLI & Testing (Week 2-3)

**Step 9**: Update CompilerBridge
- Add response field extraction
- Update input generation
- Write 10-15 tests
- Verify all tests pass

**Step 10**: End-to-End Testing
- Test with real manifest
- Verify output structure
- Test complex nested cases
- Test array handling
- Verify TypeScript compilation

**Step 11**: Documentation
- Component documentation
- Usage examples
- Migration guide
- Update main docs

**Checkpoint**: Feature complete and documented

---

## 🎯 Acceptance Criteria

### Functional Requirements
- [ ] Parse response fields from manifest
- [ ] Generate nested `z.object()` schemas
- [ ] Generate `z.array()` schemas
- [ ] Handle arrays of objects
- [ ] Handle nullable/optional fields
- [ ] Generate single response schemas
- [ ] Generate collection schemas (z.array(...))
- [ ] Combine with request schemas
- [ ] Output valid TypeScript
- [ ] All tests passing

### Non-Functional Requirements
- [ ] Each component < 200 lines
- [ ] Clear separation of concerns
- [ ] Single source of truth maintained
- [ ] No duplicate logic
- [ ] Dependency injection throughout
- [ ] Test coverage > 90%
- [ ] Generated code compiles
- [ ] Performance acceptable (< 2s for 100 routes)

### Code Quality Requirements
- [ ] No god classes
- [ ] No circular dependencies
- [ ] Clear component boundaries
- [ ] Reusable components
- [ ] Well-documented
- [ ] Type-safe

---

## 📊 Test Coverage Plan

### Unit Tests
- ResponseFieldParser: 15-20 tests
- ResponseStructureBuilder: 15-20 tests
- NestedObjectSchemaBuilder: 20-25 tests
- ArraySchemaBuilder: 15-20 tests
- ResponseSchemaMapper: 20-25 tests
- ResponseActionGenerator: 15-20 tests
- ContractCodeBuilder (new): 15-20 tests
- ContractGeneratorPass (new): 20-25 tests
- CompilerBridge (new): 10-15 tests

**Total New Tests**: ~150-190 tests

### Integration Tests
- Complete pipeline: 10-15 tests
- Real manifest scenarios: 10-15 tests
- Edge cases: 10-15 tests

**Total Integration Tests**: ~30-45 tests

### E2E Tests
- Real Laravel manifest: 5-10 tests
- Complex nested structures: 5-10 tests
- Performance tests: 5 tests

**Total E2E Tests**: ~15-25 tests

**Grand Total**: ~195-260 tests

---

## 🚀 Rollout Strategy

### Phase 1: Internal Testing
- Implement all components
- Run all tests
- Test with real manifest
- Fix bugs

### Phase 2: Beta Release
- Release as beta feature flag
- Get user feedback
- Fix edge cases
- Performance tuning

### Phase 3: Production Release
- Mark as stable
- Update documentation
- Announce to users
- Monitor usage

---

## 📈 Success Metrics

### Technical Metrics
- Test coverage > 90%
- Build time < 2 minutes
- Generation time < 2 seconds (100 routes)
- Zero TypeScript errors
- Zero runtime errors

### Quality Metrics
- Component count: 6 new + 2 updated
- Average component size: < 150 lines
- Dependency depth: < 4 levels
- Cyclomatic complexity: < 10 per method

---

## 🔧 Maintenance Plan

### Short-term (Next 3 months)
- Monitor for bugs
- Add missing test cases
- Performance optimization
- User feedback incorporation

### Long-term (Next year)
- Support for unions
- Support for discriminated unions
- Advanced type inference
- Custom validation rules

---

## 📚 Documentation Plan

### Component Documentation
- Each class with JSDoc
- Method documentation
- Parameter documentation
- Return type documentation
- Example usage

### User Documentation
- Feature guide
- Usage examples
- Migration guide
- Troubleshooting
- FAQ

### Architecture Documentation
- Component diagram
- Data flow diagram
- Dependency graph
- Design decisions
- Rationale

---

## ✅ Ready to Implement

This plan follows:
- ✅ SOC (Separation of Concerns)
- ✅ SOT (Single Source of Truth)
- ✅ Small Reusable Components
- ✅ Clear dependency direction
- ✅ Comprehensive testing
- ✅ Evidence-based approach

**Next Step**: Implement Phase 1 (ResponseFieldParser + ResponseStructureBuilder)

**Estimated Total Time**: 2-3 weeks

**Status**: READY FOR IMPLEMENTATION 🚀
