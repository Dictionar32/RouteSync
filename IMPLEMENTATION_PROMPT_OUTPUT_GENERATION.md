# Implementation Prompt: Form Generation Pass (api-form.ts)

## 🎯 Overview

**Current Status:**
- ✅ **api-read.ts**: Working with TypeScriptGeneratorPass in new compiler engine
- ❌ **api-form.ts**: Old engine at `packages/cli/src/generators/layers/FormEmitter.ts`
- 🎯 **Goal**: Implement FormGeneratorPass in new compiler-based architecture

**Task:** Create **FormGeneratorPass** (`packages/core/src/compiler/passes/FormGeneratorPass.ts`) following the same pattern as TypeScriptGeneratorPass, but for form type generation.

---

## ⚠️ CRITICAL: Data Source Difference

**api-read.ts** (Response Types):
- **Source**: `manifest.resources` - Laravel Resources (transformed output)
- **Contains**: Interface definitions dengan Show/Index aliases
- **Example**: `UserTransformed`, `UserShow`, `UserIndex`

**api-form.ts** (Request Types):
- **Source**: `manifest.routes[].validation` - FormRequest rules ONLY
- **Contains**: Form types dengan actions (create, update)
- **Example**: `UserForm = { create: {...}, update: {...} }`

**❌ JANGAN:**
- Generate model types di api-form.ts
- Generate Show/Index aliases di api-form.ts
- Process `manifest.resources` atau `manifest.models`

**✅ HANYA:**
- Process validation rules dari routes
- Generate form types dengan action-based structure
- Group by resource name dari route path

---

## 📁 Compiler Architecture (New Engine)

### Directory Structure

```
packages/core/src/compiler/
├── passes/                          # ← Compiler passes (transformation logic)
│   ├── CompilerPass.ts                 # Base interface
│   ├── PassManager.ts                  # Pass orchestration
│   ├── CompilationState.ts             # Artifact accumulation
│   ├── TypeScriptGeneratorPass.ts      # ✅ WORKING (api-read.ts)
│   └── FormGeneratorPass.ts            # ❌ TODO: Implement this
│
├── artifacts/                       # ← Artifact definitions
│   ├── types.ts                        # Artifact registry
│   ├── GeneratedTypeScriptArtifact.ts  # api-read.ts artifact
│   └── GeneratedFormArtifact.ts        # ❌ TODO: Create this
│
├── emitters/                        # ← Pure code emitters (visitor pattern)
│   ├── IEmitter.ts                     # Base interface
│   ├── TypeScriptEmitter.ts            # Pure TypeScript emitter
│   └── ContractEmitter.ts              # Contract code emitter
│
├── ir/                             # ← Intermediate representations
│   └── ContractGraph.ts               # Contract graph IR
│
└── types/                          # ← Type system
    └── SemanticType.ts                # Core type definitions
```

### Old Engine (Reference Only)

```
packages/cli/src/generators/layers/
├── FormEmitter.ts     # ❌ OLD: IR-based architecture (obsolete)
├── ReadEmitter.ts     # ❌ OLD: IR-based architecture (obsolete)
└── utils/
    └── manifest-enricher.ts
```

**⚠️ CRITICAL:** Do NOT modify old engine files. New implementation goes in `packages/core/src/compiler/`.

---

## 🔄 Data Flow

### Current Working Flow (api-read.ts)

```
1. CLI scans Laravel routes
   ↓
2. RouteManifest JSON created
   ↓
3. CompilerBridge.manifestToSemanticTypes()
   ├─ Extract resources from manifest
   ├─ Flatten nested objects
   └─ Convert to SemanticType[] (ObjectType)
   ↓
4. SemanticTypesArtifact created
   {
     typeId: 'SemanticTypes',
     types: SemanticType[],  // Array of ObjectType
     metadata: { ... }
   }
   ↓
5. TypeScriptGeneratorPass.run([semanticTypesArtifact])
   ├─ Uses TypeScriptGenerator internally
   ├─ Converts SemanticType → TypeScript interfaces
   └─ Adds Show/Index aliases for resources
   ↓
6. GeneratedTypeScriptArtifact returned
   {
     typeId: 'GeneratedTypeScript',
     code: string,  // Complete TypeScript code
     imports: GeneratedImport[],
     interfaces: GeneratedInterface[],
     metadata: { ... }
   }
   ↓
7. CLI writes to: test-output/types/api-read.ts
```

### New Flow to Implement (api-form.ts)

```
1. CLI scans Laravel routes (same)
   ↓
2. RouteManifest JSON created (same)
   ↓
3. CompilerBridge.manifestToRequestTypes()  ❌ TODO: New method
   ├─ Extract request/validation data from manifest
   ├─ Process FormRequest rules per endpoint
   └─ Convert to RequestType[] with actions (Create, Update, etc)
   ↓
4. RequestTypesArtifact created  ❌ TODO: New artifact type
   {
     typeId: 'RequestTypes',
     requests: RequestType[],  // Per-endpoint request types
     metadata: { ... }
   }
   ↓
5. FormGeneratorPass.run([requestTypesArtifact])  ❌ TODO: New pass
   ├─ Process each RequestType
   ├─ Generate form types per action
   └─ Handle optional fields and validation
   ↓
6. GeneratedFormArtifact returned  ❌ TODO: New artifact type
   {
     typeId: 'GeneratedForm',
     code: string,  // Complete form type code
     forms: FormDefinition[],
     metadata: { ... }
   }
   ↓
7. CLI writes to: test-output/forms/api-form.ts
```

---

## 📚 Key References

### 1. TypeScriptGeneratorPass (Pattern to Follow)

**File:** `packages/core/src/compiler/passes/TypeScriptGeneratorPass.ts`

**Key Points:**
- Implements `CompilerPass<['SemanticTypes'], ['GeneratedTypeScript']>`
- Input: SemanticTypesArtifact (array of SemanticType)
- Output: GeneratedTypeScriptArtifact (with code, imports, interfaces)
- Uses TypeScriptGenerator internally for type conversion
- Pass is pure orchestration - delegates to generator

**Pattern:**
```typescript
export class TypeScriptGeneratorPass
    implements CompilerPass<readonly ['SemanticTypes'], readonly ['GeneratedTypeScript']> {
    
    public readonly name = 'TypeScriptGenerator';
    public readonly inputWitnesses = [{ key: 'SemanticTypes' }] as const;
    public readonly outputKeys = ['GeneratedTypeScript'] as const;
    
    private readonly generator: TypeScriptGenerator;
    
    public run(inputs: ResolveArtifacts<readonly ['SemanticTypes']>): 
        ResolveArtifacts<readonly ['GeneratedTypeScript']> {
        
        // 1. Extract input artifact
        const semanticTypes = inputs[0];
        
        // 2. Process with generator
        // ... generation logic ...
        
        // 3. Return output artifact
        return [generatedArtifact];
    }
}
```

### 2. CompilerBridge (Data Extraction)

**File:** `packages/cli/src/generators/CompilerBridge.ts`

**Current Method:**
```typescript
private static manifestToSemanticTypes(manifest: RouteManifest): SemanticTypesArtifact {
    const typesArray: ObjectType[] = [];
    
    // Process resources (for api-read.ts)
    const resourceTypes = this.processResources(manifest.resources || []);
    typesArray.push(...resourceTypes);
    
    return {
        typeId: 'SemanticTypes',
        types: typesArray,
        metadata: { ... }
    };
}
```

**New Method Needed:**
```typescript
// ❌ TODO: Implement this
private static manifestToRequestTypes(manifest: RouteManifest): RequestTypesArtifact {
    const requestsArray: RequestType[] = [];
    
    // ⚠️ CRITICAL: Extract ONLY from validation rules, NOT from resources/models
    // api-form.ts = request input types (create/update)
    // api-read.ts = response output types (resources)
    
    // Group routes by resource name
    const routesByResource = new Map<string, RouteDefinition[]>();
    
    for (const route of manifest.routes) {
        // Skip if no validation (no FormRequest = no form types)
        if (!route.validation) continue;
        
        const resourceName = this.extractResourceName(route.path);
        if (!routesByResource.has(resourceName)) {
            routesByResource.set(resourceName, []);
        }
        routesByResource.get(resourceName)!.push(route);
    }
    
    // Process each resource's routes
    for (const [resourceName, routes] of routesByResource) {
        const actions: RequestAction[] = [];
        
        for (const route of routes) {
            // Determine action from HTTP method
            const action = this.methodToAction(route.method); // POST→create, PUT→update
            
            // Process validation rules to fields
            const fields = this.processValidationRules(route.validation!);
            
            actions.push({ action, fields, validationRules: route.validation });
        }
        
        if (actions.length > 0) {
            requestsArray.push({ name: resourceName, actions });
        }
    }
    
    return {
        typeId: 'RequestTypes',
        requests: requestsArray,
        metadata: { ... }
    };
}
```

### 3. Old FormEmitter (Output Reference)

**File:** `packages/cli/src/generators/layers/FormEmitter.ts`

**Use for:**
- Understanding form output structure
- Seeing what types need to be generated
- Reference for action-based grouping

**Do NOT:**
- Copy IR-based architecture
- Use ContractIR/RequestIR patterns
- Modify this file

---

## 📝 Expected Output Examples

### api-read.ts (Current Working Output)

```typescript
// Generated by TypeScriptGenerator
// File: types/api-read.ts

export interface UserTransformed {
    id: number;
    name: string;
    email: string;
    createdAt: string;
}

export type UserShow = UserTransformed
export type UserIndex = UserTransformed[]

export interface ProductTransformed {
    id: number;
    name: string;
    price: number;
    category: string;
}

export type ProductShow = ProductTransformed
export type ProductIndex = ProductTransformed[]
```

### api-form.ts (Target Output)

```typescript
// Generated by FormGeneratorPass
// File: forms/api-form.ts

export type UserForm = {
  create: {
    name: string
    email: string
    password: string
    passwordConfirmation: string
  }
  update: {
    name?: string
    email?: string
    password?: string
  }
}

export type ProductForm = {
  create: {
    name: string
    price: number
    categoryId: number
    description?: string
  }
  update: {
    name?: string
    price?: number
    description?: string
  }
}

export type CartItemsForm = {
  create: {
    productId: number
    quantity: number
  }
  update: {
    quantity?: number
  }
}

// ⚠️ KNOWN BUG: Nested array indentation
export type CheckoutForm = {
  create: {
    customerName: string
    items: {
      productId: number
      quantity: number
    }[]  // ❌ Should be indented properly
  }
}
```

**⚠️ Known Limitation:** Nested array indentation bug (items array should be properly indented).

---

## 🏗️ Implementation Plan

### Phase 1: Artifact Definition

**Create:** `packages/core/src/compiler/artifacts/GeneratedFormArtifact.ts`

```typescript
import type { ArtifactMetadata } from './Artifact';

export interface FormAction {
    readonly action: 'create' | 'update' | 'delete' | 'get';
    readonly fields: readonly FormField[];
}

export interface FormField {
    readonly name: string;
    readonly type: string;  // TypeScript type string
    readonly optional: boolean;
    readonly nullable: boolean;
}

export interface FormDefinition {
    readonly name: string;  // e.g., "UserForm"
    readonly actions: readonly FormAction[];
}

export interface GeneratedFormArtifact {
    readonly typeId: 'GeneratedForm';
    readonly metadata: ArtifactMetadata;
    readonly code: string;
    readonly forms: readonly FormDefinition[];
    readonly generationMetadata: {
        readonly generatorVersion: string;
        readonly formCount: number;
        readonly actionCount: number;
        readonly linesOfCode: number;
        readonly warnings: readonly string[];
    };
}
```

**Register in:** `packages/core/src/compiler/artifacts/types.ts`

```typescript
export interface ArtifactRegistry {
    // ... existing artifacts ...
    GeneratedForm: GeneratedFormArtifact;  // ← Add this
}
```

### Phase 2: Request Types Artifact

**Create:** `packages/core/src/compiler/artifacts/RequestTypesArtifact.ts`

```typescript
export interface RequestType {
    readonly name: string;  // e.g., "User"
    readonly actions: readonly RequestAction[];
}

export interface RequestAction {
    readonly action: 'create' | 'update' | 'delete' | 'get';
    readonly fields: readonly RequestField[];
    readonly validationRules?: Record<string, string[]>;
}

export interface RequestField {
    readonly name: string;  // camelCase
    readonly type: SemanticType;
    readonly optional: boolean;
    readonly nullable: boolean;
}

export interface RequestTypesArtifact {
    readonly typeId: 'RequestTypes';
    readonly metadata: ArtifactMetadata;
    readonly requests: readonly RequestType[];
}
```

**Register in artifact registry:**

```typescript
export interface ArtifactRegistry {
    // ... existing ...
    RequestTypes: RequestTypesArtifact;  // ← Add this
}
```

### Phase 3: FormGeneratorPass Implementation (Modular Architecture)

**📁 File Structure** - Small, focused classes:

```
packages/core/src/compiler/passes/
├── FormGeneratorPass.ts              # Main pass (orchestration only)
└── form-generation/                  # Supporting utilities
    ├── FormCodeBuilder.ts            # Build form type code
    ├── FormActionGenerator.ts        # Generate action blocks
    ├── FormFieldMapper.ts            # Map fields to TypeScript
    └── ValidationRuleInferrer.ts     # Infer types from validation
```

---

#### 3.1: FormFieldMapper (Type Conversion)

**Create:** `packages/core/src/compiler/passes/form-generation/FormFieldMapper.ts`

```typescript
/**
 * FormFieldMapper - Convert SemanticType to TypeScript form types
 * 
 * Single Responsibility: Type string conversion
 * No dependencies on other generation logic
 */
export class FormFieldMapper {
    /**
     * Convert SemanticType to TypeScript type string
     * 
     * Handles:
     * - Primitives (string, number, boolean)
     * - Collections (Array<T>)
     * - Nested objects
     * - Unions and optionals
     */
    toTypeString(type: SemanticType): string {
        switch (type.kind) {
            case 'primitive':
                return this.mapPrimitive(type);
            case 'readonly_collection':
            case 'mutable_collection':
                return this.mapCollection(type);
            case 'union':
                return this.mapUnion(type);
            case 'object':
                return this.mapObject(type);
            default:
                return 'unknown';
        }
    }
    
    private mapPrimitive(type: PrimitiveType): string {
        // Primitive type mapping
        const mapping = {
            'string': 'string',
            'number': 'number',
            'boolean': 'boolean',
            'datetime': 'string',  // ISO date strings
        };
        return mapping[type.type] || 'unknown';
    }
    
    private mapCollection(type: ReadonlyCollectionType | MutableCollectionType): string {
        const elementType = this.toTypeString(type.elementType);
        
        // Use Array<T> for complex types, T[] for simple
        if (type.elementType.kind === 'object') {
            return `Array<${elementType}>`;
        }
        return `${elementType}[]`;
    }
    
    private mapUnion(type: UnionType): string {
        return type.members.values()
            .map(m => this.toTypeString(m))
            .join(' | ');
    }
    
    private mapObject(type: ObjectType): string {
        // For nested objects, generate inline type
        const props = Array.from(type.properties.entries())
            .map(([key, valueType]) => {
                const valueStr = this.toTypeString(valueType);
                return `${key}: ${valueStr}`;
            });
        return `{\n    ${props.join('\n    ')}\n  }`;
    }
}
```

---

#### 3.2: FormActionGenerator (Action Block Generation)

**Create:** `packages/core/src/compiler/passes/form-generation/FormActionGenerator.ts`

```typescript
/**
 * FormActionGenerator - Generate action blocks (create, update)
 * 
 * Single Responsibility: Format action structures
 * Delegates type conversion to FormFieldMapper
 */
export class FormActionGenerator {
    constructor(private readonly fieldMapper: FormFieldMapper) {}
    
    /**
     * Generate action block code
     * 
     * Example output:
     *   create: {
     *     name: string
     *     email: string
     *   }
     */
    generateAction(action: RequestAction): string {
        const fields = this.generateFields(action.fields);
        return `  ${action.action}: {\n${fields}\n  }`;
    }
    
    private generateFields(fields: readonly RequestField[]): string {
        if (fields.length === 0) {
            return '    // No fields';
        }
        
        return fields.map(field => this.generateField(field)).join('\n');
    }
    
    private generateField(field: RequestField): string {
        const optional = field.optional ? '?' : '';
        const nullable = field.nullable ? ' | null' : '';
        const typeStr = this.fieldMapper.toTypeString(field.type);
        
        return `    ${field.name}${optional}: ${typeStr}${nullable}`;
    }
}
```

---

#### 3.3: FormCodeBuilder (Code Assembly)

**Create:** `packages/core/src/compiler/passes/form-generation/FormCodeBuilder.ts`

```typescript
/**
 * FormCodeBuilder - Assemble complete form type code
 * 
 * Single Responsibility: Code structure and formatting
 * Delegates action generation to FormActionGenerator
 */
export class FormCodeBuilder {
    constructor(private readonly actionGenerator: FormActionGenerator) {}
    
    /**
     * Build complete form code from requests
     */
    build(requests: readonly RequestType[]): string {
        const lines: string[] = [];
        
        // Header
        lines.push('// Generated by FormGeneratorPass');
        lines.push('// File: forms/api-form.ts');
        lines.push('');
        
        // Generate each form type
        for (const request of requests) {
            lines.push(this.generateFormType(request));
            lines.push('');
        }
        
        return lines.join('\n');
    }
    
    private generateFormType(request: RequestType): string {
        const formName = `${request.name}Form`;
        
        if (request.actions.length === 0) {
            return `export type ${formName} = {}`;
        }
        
        const actions = request.actions
            .map(action => this.actionGenerator.generateAction(action))
            .join('\n');
        
        return `export type ${formName} = {\n${actions}\n}`;
    }
}
```

---

#### 3.4: FormGeneratorPass (Orchestration)

**Create:** `packages/core/src/compiler/passes/FormGeneratorPass.ts`

```typescript
/**
 * FormGeneratorPass - Main pass orchestrator
 * 
 * Single Responsibility: Coordinate generation pipeline
 * Delegates to small, focused utility classes
 */
export class FormGeneratorPass
    implements CompilerPass<readonly ['RequestTypes'], readonly ['GeneratedForm']> {
    
    public readonly name = 'FormGenerator';
    public readonly inputWitnesses = [{ key: 'RequestTypes' }] as const;
    public readonly outputKeys = ['GeneratedForm'] as const;
    
    // Small utility instances (dependency injection)
    private readonly fieldMapper: FormFieldMapper;
    private readonly actionGenerator: FormActionGenerator;
    private readonly codeBuilder: FormCodeBuilder;
    
    constructor() {
        // Wire up small classes
        this.fieldMapper = new FormFieldMapper();
        this.actionGenerator = new FormActionGenerator(this.fieldMapper);
        this.codeBuilder = new FormCodeBuilder(this.actionGenerator);
    }
    
    /**
     * Execute pass - pure orchestration
     */
    public run(
        inputs: ResolveArtifacts<readonly ['RequestTypes']>
    ): ResolveArtifacts<readonly ['GeneratedForm']> {
        
        const requestTypesArtifact = inputs[0];
        
        // Delegate to code builder
        const code = this.codeBuilder.build(requestTypesArtifact.requests);
        
        // Extract metadata
        const forms = this.extractFormDefinitions(requestTypesArtifact.requests);
        
        // Build artifact
        const artifact: GeneratedFormArtifact = {
            typeId: 'GeneratedForm',
            code,
            forms,
            generationMetadata: {
                generatorVersion: '1.0.0',
                formCount: requestTypesArtifact.requests.length,
                actionCount: this.countActions(requestTypesArtifact.requests),
                linesOfCode: code.split('\n').length,
                warnings: []
            },
            metadata: {
                hash: computeFingerprintHash(/* ... */),
                producer: this.name,
                dependencies: ['RequestTypes'],
                timestamp: Date.now(),
                revision: '1.0.0'
            }
        };
        
        return [artifact];
    }
    
    // Simple metadata extraction methods
    private extractFormDefinitions(requests: readonly RequestType[]): FormDefinition[] {
        return requests.map(req => ({
            name: `${req.name}Form`,
            actions: req.actions.map(act => ({
                action: act.action,
                fields: act.fields.map(f => ({
                    name: f.name,
                    type: this.fieldMapper.toTypeString(f.type),
                    optional: f.optional,
                    nullable: f.nullable
                }))
            }))
        }));
    }
    
    private countActions(requests: readonly RequestType[]): number {
        return requests.reduce((sum, req) => sum + req.actions.length, 0);
    }
}
```

---

## 🧩 Architecture Benefits

### Small, Focused Classes

| Class | Lines | Responsibility |
|-------|-------|----------------|
| FormFieldMapper | ~80 | Type conversion only |
| FormActionGenerator | ~50 | Action block formatting |
| FormCodeBuilder | ~60 | Code assembly |
| FormGeneratorPass | ~80 | Orchestration only |

**Total:** ~270 lines split across 4 focused classes (vs ~500 lines monolithic)

### Easy Testing

```typescript
// Test individual pieces independently
describe('FormFieldMapper', () => {
    it('should map primitive types', () => {
        const mapper = new FormFieldMapper();
        expect(mapper.toTypeString(stringType)).toBe('string');
    });
});

describe('FormActionGenerator', () => {
    it('should generate action with fields', () => {
        const mapper = new FormFieldMapper();
        const generator = new FormActionGenerator(mapper);
        const result = generator.generateAction(mockAction);
        expect(result).toContain('create: {');
    });
});
```

### Easy Extension

Want to add Zod schema generation? Just add new class:

```typescript
// New class, no modification to existing code
class FormZodGenerator {
    constructor(private readonly fieldMapper: FormFieldMapper) {}
    
    generateZodSchema(request: RequestType): string {
        // Reuse fieldMapper for type conversion
    }
}
```

### Phase 4: CompilerBridge Integration

**Modify:** `packages/cli/src/generators/CompilerBridge.ts`

Add new method:

```typescript
private static manifestToRequestTypes(manifest: RouteManifest): RequestTypesArtifact {
    const requests: RequestType[] = [];
    
    // Group routes by resource
    const routesByResource = new Map<string, RouteDefinition[]>();
    
    for (const route of manifest.routes) {
        const resourceName = this.extractResourceName(route.path);
        if (!routesByResource.has(resourceName)) {
            routesByResource.set(resourceName, []);
        }
        routesByResource.get(resourceName)!.push(route);
    }
    
    // Process each resource
    for (const [resourceName, routes] of routesByResource) {
        const actions: RequestAction[] = [];
        
        for (const route of routes) {
            if (route.validation) {
                // Extract action from route method
                const action = this.methodToAction(route.method);
                
                // Process validation rules
                const fields = this.processValidationRules(route.validation);
                
                actions.push({
                    action,
                    fields,
                    validationRules: route.validation
                });
            }
        }
        
        if (actions.length > 0) {
            requests.push({
                name: resourceName,
                actions
            });
        }
    }
    
    return {
        typeId: 'RequestTypes',
        requests,
        metadata: {
            hash: `request-${Date.now()}`,
            producer: 'CompilerBridge',
            dependencies: [],
            timestamp: Date.now(),
            revision: '1.0.0'
        }
    };
}

private static methodToAction(method: string): 'create' | 'update' | 'delete' | 'get' {
    switch (method.toUpperCase()) {
        case 'POST': return 'create';
        case 'PUT':
        case 'PATCH': return 'update';
        case 'DELETE': return 'delete';
        default: return 'get';
    }
}

private static processValidationRules(validation: Record<string, string[]>): RequestField[] {
    const fields: RequestField[] = [];
    
    for (const [fieldName, rules] of Object.entries(validation)) {
        const camelName = toCamelCase(fieldName);
        const optional = !rules.includes('required');
        const nullable = rules.includes('nullable');
        
        // Infer type from validation rules
        const type = this.inferTypeFromRules(rules);
        
        fields.push({
            name: camelName,
            type,
            optional,
            nullable
        });
    }
    
    return fields;
}
```

### Phase 5: CLI Integration

**Modify:** `packages/cli/src/commands/generate.ts`

Add form generation:

```typescript
// Generate api-read.ts (existing)
const semanticTypesArtifact = CompilerBridge.manifestToSemanticTypes(manifest);
const typeScriptPass = new TypeScriptGeneratorPass();
const [generatedTypes] = typeScriptPass.run([semanticTypesArtifact]);

fs.writeFileSync(
    path.join(outputDir, 'types', 'api-read.ts'),
    generatedTypes.code
);

// Generate api-form.ts (new)
const requestTypesArtifact = CompilerBridge.manifestToRequestTypes(manifest);
const formPass = new FormGeneratorPass();
const [generatedForms] = formPass.run([requestTypesArtifact]);

fs.writeFileSync(
    path.join(outputDir, 'forms', 'api-form.ts'),
    generatedForms.code
);
```

---

## ⚠️ Known Issues to Fix

### 1. Nested Array Indentation Bug

**Problem:**
```typescript
export type CheckoutForm = {
  create: {
    items: {
      productId: number
      quantity: number
    }[]  // ❌ Wrong indentation
  }
}
```

**Should be:**
```typescript
export type CheckoutForm = {
  create: {
    items: Array<{
      productId: number
      quantity: number
    }>  // ✅ Proper formatting
  }
}
```

**Fix:** In FormGeneratorPass, handle array types properly:

```typescript
private semanticTypeToString(type: SemanticType): string {
    if (type.kind === 'readonly_collection' || type.kind === 'mutable_collection') {
        const elementType = this.semanticTypeToString(type.elementType);
        
        // If element is complex (object), use Array<T> syntax
        if (type.elementType.kind === 'object') {
            return `Array<${elementType}>`;
        }
        
        // Otherwise use T[] syntax
        return `${elementType}[]`;
    }
    // ... other cases
}
```

### 2. Output Path

**Correct path:** `forms/api-form.ts` (not `types/api-form.ts`)

Ensure CLI writes to correct directory.

---

## 🧪 Testing Strategy

### Unit Tests

**Create:** `packages/core/src/compiler/passes/__tests__/FormGeneratorPass.test.ts`

```typescript
describe('FormGeneratorPass', () => {
    it('should generate form types from request artifact', () => {
        const pass = new FormGeneratorPass();
        const input: RequestTypesArtifact = {
            typeId: 'RequestTypes',
            requests: [{
                name: 'User',
                actions: [{
                    action: 'create',
                    fields: [
                        { name: 'name', type: primitiveString, optional: false, nullable: false },
                        { name: 'email', type: primitiveString, optional: false, nullable: false }
                    ]
                }]
            }],
            metadata: { /* ... */ }
        };
        
        const [output] = pass.run([input]);
        
        expect(output.code).toContain('export type UserForm');
        expect(output.code).toContain('create: {');
        expect(output.code).toContain('name: string');
        expect(output.forms).toHaveLength(1);
    });
});
```

### Integration Tests

**Test with real manifest:**

```bash
./capture.sh node dist/cli.js generate \
    --manifest /path/to/test-manifest.json \
    --output test-output

# Verify output
cat test-output/forms/api-form.ts
```

---

## 📚 Skills to Activate

Before starting implementation:

### 1. Reverse Engineering

Understand existing TypeScriptGeneratorPass pattern:
- How passes receive/return artifacts
- How generators convert types
- Evidence-based analysis

### 2. Compiler Bridge Architecture

Follow clean architecture:
- Bridge only translates data
- Pass does transformation
- No duplicate logic
- Single Source of Truth

---

## ✅ Success Criteria

- [ ] GeneratedFormArtifact defined
- [ ] RequestTypesArtifact defined
- [ ] FormGeneratorPass implemented
- [ ] CompilerBridge.manifestToRequestTypes() implemented
- [ ] CLI integration complete
- [ ] Unit tests passing
- [ ] Integration test with real manifest successful
- [ ] Output matches expected format
- [ ] Nested array indentation bug fixed
- [ ] Output path is `forms/api-form.ts`

---

## 📝 Notes

- Follow TypeScriptGeneratorPass pattern exactly
- Use immutable collections (ImmutableMap, ImmutableSet)
- Pass is orchestration only - delegate to utilities
- CompilerBridge is data lowering only - no analysis
- All type conversion logic in pass, not bridge
- Artifact metadata must include hash, producer, dependencies

---

**Last Updated:** 2026-08-07
**Status:** Ready for implementation
**Next Step:** Phase 1 - Create artifact definitions
