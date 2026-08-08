# Contract Generation: Component Specifications

**Date**: 2026-08-07  
**Phase**: Phase 1 - Component Design  
**Status**: Complete  
**Based On**: Evidence analysis from Form generation

---

## Document Purpose

Definisi lengkap untuk 7 components yang akan diimplementasi di Phase 2. Setiap component memiliki:
- Interface contract
- Method signatures
- Input/output examples
- Error handling
- Test requirements

---

## 1. PrimitiveTypeRegistry

### 1.1 Purpose

**Single Responsibility**: Map SemanticType primitives ke Zod schema strings

**Why Needed**: Centralized mapping untuk primitive types (bukan FormFieldMapper yang maps validation rules)

**Evidence**: No existing component maps SemanticType → Zod

### 1.2 Interface

```typescript
/**
 * Maps SemanticType primitives to Zod schema strings
 * 
 * Pure mapping - no logic, just lookup table
 */
export class PrimitiveTypeRegistry {
    /**
     * Get Zod schema for primitive type
     * @throws PrimitiveNotFoundError if type unknown
     */
    getZodSchema(primitiveType: PrimitiveType): string;
    
    /**
     * Check if primitive is supported
     */
    supports(primitiveType: PrimitiveType): boolean;
}
```

### 1.3 Mapping Table

| SemanticType | Zod Schema | Example |
|---|---|---|
| PrimitiveKind.STRING | z.string() | 'text' |
| PrimitiveKind.NUMBER | z.number() | 123 |
| PrimitiveKind.BOOLEAN | z.boolean() | true |
| PrimitiveKind.DATETIME | z.string().datetime() | '2024-01-01T00:00:00Z' |
| PrimitiveKind.DATE | z.string().date() | '2024-01-01' |
| PrimitiveKind.JSON | z.unknown() | { any: 'json' } |
| PrimitiveKind.MIXED | z.unknown() | any |

### 1.4 Example Usage

```typescript
const registry = new PrimitiveTypeRegistry();

// Example 1: String type
const stringType = new PrimitiveType(PrimitiveKind.STRING);
const zodSchema = registry.getZodSchema(stringType);
// Result: "z.string()"

// Example 2: DateTime type
const dateTimeType = new PrimitiveType(PrimitiveKind.DATETIME);
const zodDateTime = registry.getZodSchema(dateTimeType);
// Result: "z.string().datetime()"

// Example 3: Unknown type (error)
try {
    registry.getZodSchema(unknownType);
} catch (e) {
    console.error(e); // PrimitiveNotFoundError
}
```

### 1.5 Error Handling

```typescript
export class PrimitiveNotFoundError extends Error {
    constructor(
        public readonly primitiveKind: string,
        message: string = `Unsupported primitive type: ${primitiveKind}`
    ) {
        super(message);
        this.name = 'PrimitiveNotFoundError';
    }
}
```

### 1.6 Test Requirements

**10 Tests Total**:
1. Maps STRING → z.string()
2. Maps NUMBER → z.number()
3. Maps BOOLEAN → z.boolean()
4. Maps DATETIME → z.string().datetime()
5. Maps DATE → z.string().date()
6. Maps JSON → z.unknown()
7. Maps MIXED → z.unknown()
8. Throws error for unknown primitive
9. supports() returns true for known types
10. supports() returns false for unknown types

---

## 2. ZodModifierBuilder

### 2.1 Purpose

**Single Responsibility**: Build Zod modifiers (.optional(), .nullable(), etc.)

**Why Needed**: Centralized logic untuk Zod chaining modifiers

**Evidence**: No existing Zod utilities

### 2.2 Interface

```typescript
/**
 * Builds Zod modifier chains
 * 
 * Pure string building - no schema generation
 */
export class ZodModifierBuilder {
    /**
     * Build complete modifier chain
     */
    buildModifiers(config: ModifierConfig): string;
    
    /**
     * Check if modifiers needed
     */
    hasModifiers(config: ModifierConfig): boolean;
}

export interface ModifierConfig {
    readonly required: boolean;
    readonly nullable: boolean;
}
```

### 2.3 Modifier Rules

| Config | Output | Example |
|---|---|---|
| required: true, nullable: false | (no modifiers) | z.string() |
| required: false, nullable: false | .optional() | z.string().optional() |
| required: true, nullable: true | .nullable() | z.string().nullable() |
| required: false, nullable: true | .nullable().optional() | z.string().nullable().optional() |

### 2.4 Example Usage

```typescript
const builder = new ZodModifierBuilder();

// Example 1: Required, not nullable
const m1 = builder.buildModifiers({ required: true, nullable: false });
// Result: ""

// Example 2: Optional, not nullable
const m2 = builder.buildModifiers({ required: false, nullable: false });
// Result: ".optional()"

// Example 3: Required, nullable
const m3 = builder.buildModifiers({ required: true, nullable: true });
// Result: ".nullable()"

// Example 4: Optional, nullable
const m4 = builder.buildModifiers({ required: false, nullable: true });
// Result: ".nullable().optional()"
```

### 2.5 Test Requirements

**8 Tests Total**:
1. No modifiers for required + not nullable
2. .optional() for optional + not nullable
3. .nullable() for required + nullable
4. .nullable().optional() for optional + nullable
5. hasModifiers returns false when none needed
6. hasModifiers returns true when needed
7. Order is consistent (nullable before optional)
8. Empty config handled gracefully

---

## 3. ContractSchemaMapper

### 3.1 Purpose

**Single Responsibility**: Map SemanticType → complete Zod schema string

**Why Needed**: Complex transformation from type system to Zod

**Evidence**: Different from FormFieldMapper (maps types not rules)

### 3.2 Interface

```typescript
/**
 * Maps SemanticType to complete Zod schema
 * 
 * Delegates to PrimitiveTypeRegistry + ZodModifierBuilder
 */
export class ContractSchemaMapper {
    constructor(
        private readonly primitiveRegistry: PrimitiveTypeRegistry,
        private readonly modifierBuilder: ZodModifierBuilder
    );
    
    /**
     * Map SemanticType to Zod schema string
     */
    mapToZodSchema(type: SemanticType, config: FieldConfig): MappedSchema;
}

export interface FieldConfig {
    readonly fieldName: string;
    readonly required: boolean;
    readonly nullable: boolean;
}

export interface MappedSchema {
    readonly zodSchema: string;
    readonly needsImport: boolean;
    readonly referencedTypes: readonly string[];
}
```

### 3.3 Mapping Examples

**Example 1: Simple Primitive**
```typescript
// Input
type: PrimitiveType(STRING)
config: { fieldName: 'nama', required: true, nullable: false }

// Output
{
  zodSchema: "z.string()",
  needsImport: false,
  referencedTypes: []
}
```

**Example 2: Optional Primitive**
```typescript
// Input
type: PrimitiveType(NUMBER)
config: { fieldName: 'qty', required: false, nullable: false }

// Output
{
  zodSchema: "z.number().optional()",
  needsImport: false,
  referencedTypes: []
}
```

**Example 3: Nested Object**
```typescript
// Input
type: ObjectType({
  nama: PrimitiveType(STRING),
  telepon: PrimitiveType(STRING)
})
config: { fieldName: 'shipping', required: true, nullable: false }

// Output
{
  zodSchema: "z.object({ nama: z.string(), telepon: z.string() })",
  needsImport: false,
  referencedTypes: []
}
```

**Example 4: Array Type**
```typescript
// Input
type: ReadonlyCollection(PrimitiveType(NUMBER))
config: { fieldName: 'produk_item_ids', required: true, nullable: false }

// Output
{
  zodSchema: "z.array(z.number())",
  needsImport: false,
  referencedTypes: []
}
```

### 3.4 Test Requirements

**15 Tests Total**:
1. Maps primitive types correctly
2. Maps object types with nested fields
3. Maps array types
4. Maps optional fields
5. Maps nullable fields
6. Maps optional + nullable fields
7. Handles deeply nested objects
8. Handles arrays of objects
9. Handles union types
10. Handles reference types
11. Detects import needs
12. Tracks referenced types
13. Preserves snake_case field names
14. Handles empty objects
15. Error handling for unsupported types

---

## 4. ContractActionGenerator

### 4.1 Purpose

**Single Responsibility**: Generate action blocks with Zod schemas

**Why Needed**: Format Zod schemas into action structure

**Evidence**: Different from FormActionGenerator (generates Zod not TypeScript types)

### 4.2 Interface

```typescript
/**
 * Generates action blocks with Zod schemas
 * 
 * Delegates to ContractSchemaMapper for schema generation
 */
export class ContractActionGenerator {
    constructor(
        private readonly schemaMapper: ContractSchemaMapper
    );
    
    /**
     * Generate action block with Zod schemas
     */
    generateAction(
        actionName: string,
        fields: readonly ContractField[]
    ): GeneratedContractAction;
}

export interface ContractField {
    readonly name: string;
    readonly type: SemanticType;
    readonly required: boolean;
    readonly nullable: boolean;
}

export interface GeneratedContractAction {
    readonly name: string;
    readonly schemaLines: readonly string[];
    readonly typeLines: readonly string[];
    readonly fieldCount: number;
}
```

### 4.3 Example Output

**Input**:
```typescript
actionName: 'create'
fields: [
  { name: 'nama', type: PrimitiveType(STRING), required: true, nullable: false },
  { name: 'email', type: PrimitiveType(STRING), required: true, nullable: false }
]
```

**Output**:
```typescript
{
  name: 'create',
  schemaLines: [
    "  create: z.object({",
    "    nama: z.string(),",
    "    email: z.string()",
    "  })"
  ],
  typeLines: [
    "  create: {",
    "    nama: string,",
    "    email: string",
    "  }"
  ],
  fieldCount: 2
}
```

### 4.4 Test Requirements

**12 Tests Total**:
1. Generates basic action block
2. Handles empty fields
3. Handles single field
4. Handles multiple fields
5. Handles optional fields
6. Handles nullable fields
7. Handles nested objects
8. Handles arrays
9. Preserves field order
10. snake_case preserved
11. Proper indentation
12. Proper comma placement

---

## 5. ContractCodeBuilder

### 5.1 Purpose

**Single Responsibility**: Assemble 4 sections (schemas + types + validators + exports)

**Why Needed**: More complex than FormCodeBuilder (1 section → 4 sections)

**Evidence**: FormCodeBuilder only handles 1 section

### 5.2 Interface

```typescript
/**
 * Assembles complete api-contract.ts file
 * 
 * 4 sections: schemas, types, validators, exports
 */
export class ContractCodeBuilder {
    /**
     * Build complete contract file
     */
    buildContractFile(
        contracts: readonly GeneratedContract[]
    ): BuiltContractCode;
}

export interface GeneratedContract {
    readonly resourceName: string;
    readonly actions: readonly GeneratedContractAction[];
}

export interface BuiltContractCode {
    readonly code: string;
    readonly lineCount: number;
    readonly contractCount: number;
    readonly sections: readonly SectionInfo[];
}

export interface SectionInfo {
    readonly name: string;
    readonly startLine: number;
    readonly endLine: number;
}
```

### 5.3 Output Structure

```typescript
/**
 * Runtime contract validation schemas
 * Generated by ContractGeneratorPass
 */
import { z } from 'zod';

// ========== SECTION 1: Zod Schemas ==========
export const RegisterContractSchema = {
  create: z.object({
    name: z.string(),
    email: z.string(),
    password: z.string()
  })
};

// ========== SECTION 2: Inferred Types ==========
export type RegisterContract = {
  create: z.infer<typeof RegisterContractSchema.create>
};

// ========== SECTION 3: Validators ==========
export const validateRegisterCreate = (data: unknown) => {
  return RegisterContractSchema.create.parse(data);
};

// ========== SECTION 4: Exports ==========
export const ContractSchemas = {
  Register: RegisterContractSchema
};
```

### 5.4 Test Requirements

**10 Tests Total**:
1. Builds 4 sections correctly
2. Handles empty contracts
3. Handles single contract
4. Handles multiple contracts
5. Handles multiple actions per contract
6. Proper section ordering
7. Proper imports
8. Section line ranges tracked
9. Comment headers present
10. Valid TypeScript syntax

---

## 6. GeneratedContractArtifact

### 6.1 Purpose

**Single Responsibility**: Output artifact dengan contract-specific metadata

**Why Needed**: Contract-specific metadata (different from GeneratedFormArtifact)

**Evidence**: FormArtifact doesn't track Zod schemas

### 6.2 Interface

```typescript
/**
 * Output artifact from ContractGeneratorPass
 */
export interface GeneratedContractArtifact {
    readonly typeId: 'GeneratedContract';
    
    /** Complete generated code */
    readonly code: string;
    
    /** Contract metadata */
    readonly contracts: readonly GeneratedContractInfo[];
    
    /** Generation metadata */
    readonly generationMetadata: ContractGenerationMetadata;
    
    /** Artifact metadata */
    readonly metadata: ArtifactMetadata;
}

export interface GeneratedContractInfo {
    readonly name: string;
    readonly schemaName: string;
    readonly actions: readonly ContractActionInfo[];
    readonly lineRange: readonly [number, number];
}

export interface ContractActionInfo {
    readonly name: string;
    readonly zodSchema: string;
    readonly validatorName: string;
    readonly fieldCount: number;
}

export interface ContractGenerationMetadata {
    readonly generatorVersion: string;
    readonly requestTypeCount: number;
    readonly contractCount: number;
    readonly totalActions: number;
    readonly zodSchemasCount: number;
    readonly validatorsCount: number;
    readonly linesOfCode: number;
    readonly warnings: readonly string[];
}
```

### 6.3 Test Requirements

**N/A** - Pure type definition (tested via ContractGeneratorPass tests)

---

## 7. ContractGeneratorPass

### 7.1 Purpose

**Single Responsibility**: Orchestrate contract generation pipeline

**Why Needed**: New pass for contract generation (separate from FormGeneratorPass)

**Evidence**: FormGeneratorPass only handles form types

### 7.2 Interface

```typescript
/**
 * Compiler pass that transforms RequestTypes into Generated Contract code
 * 
 * Orchestrates ContractSchemaMapper + ContractActionGenerator + ContractCodeBuilder
 */
export class ContractGeneratorPass
    implements CompilerPass<readonly ['RequestTypes'], readonly ['GeneratedContract']> {
    
    readonly name = 'ContractGenerator';
    
    readonly inputWitnesses = [
        { key: 'RequestTypes' } as ArtifactKeyWitness<'RequestTypes'>
    ] as const;
    
    readonly outputKeys = ['GeneratedContract'] as const;
    
    constructor(deps?: {
        readonly schemaMapper?: ContractSchemaMapper;
        readonly actionGenerator?: ContractActionGenerator;
        readonly codeBuilder?: ContractCodeBuilder;
    });
    
    run(
        inputs: ResolveArtifacts<readonly ['RequestTypes']>
    ): ResolveArtifacts<readonly ['GeneratedContract']>;
}
```

### 7.3 Orchestration Flow

```
ContractGeneratorPass.run()
    ↓
[1] Extract RequestTypesArtifact
    ↓
[2] For each RequestType:
    ↓
    ContractActionGenerator.generateAction()
        ↓
        ContractSchemaMapper.mapToZodSchema()
            ↓
            PrimitiveTypeRegistry.getZodSchema()
            ZodModifierBuilder.buildModifiers()
        ↓
        Returns GeneratedContractAction
    ↓
[3] Collect actions by resource
    ↓
[4] ContractCodeBuilder.buildContractFile()
    ↓
    Returns BuiltContractCode
    ↓
[5] Create GeneratedContractArtifact
    ↓
Return artifact tuple
```

### 7.4 Test Requirements

**15 Tests Total**:
1. Processes empty RequestTypes
2. Processes single RequestType
3. Processes multiple RequestTypes
4. Handles multiple actions
5. Dependency injection works
6. Creates correct artifact structure
7. Tracks metadata correctly
8. Handles warnings
9. Error handling for failed generation
10. Integration with primitiveRegistry
11. Integration with modifierBuilder
12. Integration with schemaMapper
13. Integration with actionGenerator
14. Integration with codeBuilder
15. End-to-end generation test

---

## Implementation Summary

### Component Count: 7
### Total LOC Estimate: ~770 lines
### Total Tests: ~70 tests
### Estimated Time: 14-16 hours

### Dependencies (Implementation Order):
1. PrimitiveTypeRegistry (no deps)
2. ZodModifierBuilder (no deps)
3. ContractSchemaMapper (uses 1+2)
4. ContractActionGenerator (uses 3)
5. ContractCodeBuilder (uses 4)
6. GeneratedContractArtifact (type only)
7. ContractGeneratorPass (uses all)

---

**Status**: ✅ Component Specifications Complete  
**Next**: Begin Phase 2 implementation starting with PrimitiveTypeRegistry
