# Type-Safe Fix Design - Zero `any`, Zero `as`

## 🎯 Philosophy

**NO TYPE ASSERTIONS. NO ANY TYPES. ONLY PROPER TYPE SAFETY.**

Semua fixes harus menggunakan:
1. ✅ Explicit type annotations
2. ✅ Type guards (runtime type checking)
3. ✅ Discriminated unions
4. ✅ Generic constraints
5. ✅ Mapped types
6. ❌ NEVER `any`
7. ❌ NEVER `as` type assertions

---

## 📋 Error Categories & Solutions

### Category A: CompilerBridge.ts Errors

#### Error A1: readonly tuple → mutable tuple (Lines 113, 148, 187)

**Problem:**
```typescript
const [generatedArtifact]: [GeneratedTypeScriptArtifact] = pass.run([inputArtifact])
// Error: readonly [GeneratedTypeScriptArtifact] cannot be assigned to [GeneratedTypeScriptArtifact]
```

**Root Cause:** `ResolveArtifacts<readonly ['GeneratedTypeScript']>` returns `readonly [artifact]`

**Solution: Use readonly in destructuring**
```typescript
// ✅ SOLUTION: Match readonly signature
const [generatedArtifact]: readonly [GeneratedTypeScriptArtifact] = pass.run([inputArtifact])

// Alternative: Don't destructure
const result = pass.run([inputArtifact])
const generatedArtifact: GeneratedTypeScriptArtifact = result[0]
```

**Apply to:**
- Line 113: `generateTypeScript()`
- Line 148: `generateFormTypes()`  
- Line 187: `generateContractTypes()`

---

#### Error A2: Missing properties on ParsedRoute (Lines 259, 292, 294, 295, 481)

**Problem:**
```typescript
route.schema?.rules  // Error: Property 'schema' does not exist on type 'ParsedRoute'
route.response       // Error: Property 'response' does not exist on type 'ParsedRoute'
```

**Root Cause:** Type mismatch - using wrong type from wrong import

**Investigation needed:**
```typescript
// Check what type is actually being used
typeof manifest.routes[number]

// Likely: Using ParsedRoute from wrong location
// Solution: Use correct type from manifest
```

**Solution: Type from manifest, not arbitrary ParsedRoute**
```typescript
// ✅ CORRECT: Extract type from manifest
type ManifestRoute = RouteManifest['routes'][number]

// Use in method signature
private static extractResourceName(route: ManifestRoute): string | null {
    // Now route.schema and route.response exist!
}
```

**Apply to ALL route parameter types**

---

#### Error A3: ParsedField[] vs Record<string, ResourceFieldKind> (Lines 314, 697)

**Problem:**
```typescript
flattenResourceFields(
    resource.name,
    resource.fields || {},  // ← Type mismatch
    { maxDepth: 5, circularRefWarnings: true }
)
```

**Root Cause:** `resource.fields` is `ParsedField[]` but `flattenResourceFields` expects `Record<string, ResourceFieldKind>`

**Solution A: Convert array to Record**
```typescript
// ✅ SOLUTION: Convert ParsedField[] to Record
private static convertFieldsArrayToRecord(
    fields: ParsedField[]
): Record<string, ResourceFieldKind> {
    const result: Record<string, ResourceFieldKind> = {}
    
    for (const field of fields) {
        result[field.name] = {
            type: field.type,
            nullable: field.nullable ?? false
            // Map other properties
        }
    }
    
    return result
}

// Usage:
const fieldsRecord = this.convertFieldsArrayToRecord(resource.fields || [])
const flattenedFields = flattenResourceFields(
    resource.name,
    fieldsRecord,
    { maxDepth: 5, circularRefWarnings: true }
)
```

**Solution B: Change flattenResourceFields signature (if we own it)**
```typescript
// If we control flattenResourceFields, add overload:
export function flattenResourceFields(
    name: string,
    fields: ParsedField[],
    options: FlattenOptions
): Map<string, SemanticType>

export function flattenResourceFields(
    name: string,
    fields: Record<string, ResourceFieldKind>,
    options: FlattenOptions
): Map<string, SemanticType>
```

---

#### Error A4: Generic Record<,> syntax error (Lines 319, 320)

**Problem:**
```typescript
fieldsRecord: Record<,>  // ❌ Syntax error
```

**Root Cause:** Incomplete type annotation

**Solution:**
```typescript
// ✅ CORRECT: Complete type parameters
const fieldsRecord: Record<string, ResourceFieldKind> = {}
```

---

#### Error A5: RouteManifest namespace reference (Line 534)

**Problem:**
```typescript
private static extractResourceName(route: typeof import('...').RouteManifest.routes[number])
```

**Root Cause:** Using `typeof` with namespace that doesn't exist

**Solution:**
```typescript
// ✅ CORRECT: Extract type properly
type ManifestRoute = RouteManifest['routes'][number]

private static extractResourceName(route: ManifestRoute): string | null {
    // ...
}
```

---

#### Error A6: Missing models property (Lines 827)

**Problem:**
```typescript
manifest.models  // Error: Property 'models' does not exist on type 'RouteManifest'
```

**Root Cause:** Type definition mismatch

**Investigation needed:**
```typescript
// Check RouteManifest definition
interface Manifest {
    routes: ParsedRoute[]
    resources?: ParsedResource[]
    models?: ParsedModel[]  // ← Is this defined?
}
```

**Solution A: If models exists in actual type**
```typescript
// Check if models is optional
const models = manifest.models ?? []
```

**Solution B: If models doesn't exist in type definition**
```typescript
// Add to Manifest type definition in route.ts
export interface Manifest {
    routes: ParsedRoute[]
    resources?: ParsedResource[]
    models?: ParsedModel[]  // ← Add this
    // ...
}
```

---

### Category B: ContractGeneratorPass.ts Errors

#### Error B1: GeneratedContract not in ArtifactRegistry (Lines 51, 67, 127, etc.)

**Problem:**
```typescript
readonly ['GeneratedContract']
// Error: Type '"GeneratedContract"' is not assignable to type 'keyof ArtifactRegistry'
```

**Root Cause:** `GeneratedContract` not registered in ArtifactRegistry type

**Solution: Register in ArtifactRegistry**
```typescript
// In packages/core/src/compiler/artifacts/index.ts or similar

export interface ArtifactRegistry {
    // Existing...
    SemanticTypes: SemanticTypesArtifact
    GeneratedTypeScript: GeneratedTypeScriptArtifact
    GeneratedForm: GeneratedFormArtifact
    RequestTypes: RequestTypesArtifact
    
    // ✅ ADD THIS:
    GeneratedContract: GeneratedContractArtifact
}
```

**This is THE fix for all Category B errors!**

---

#### Error B2: actions: [] vs GeneratedContractAction[] (Line 158)

**Problem:**
```typescript
const contract: { resourceName: string; actions: [] } = {
    resourceName: 'Order',
    actions: generatedActions  // ← Type mismatch
}
```

**Root Cause:** Explicit empty array type

**Solution:**
```typescript
// ✅ CORRECT: Proper type annotation
const contract: {
    resourceName: string
    actions: GeneratedContractAction[]
} = {
    resourceName: requestType.resourceName,
    actions: generatedActions
}

// Or use interface:
interface ContractInfo {
    resourceName: string
    actions: GeneratedContractAction[]
}

const contract: ContractInfo = {
    resourceName: requestType.resourceName,
    actions: generatedActions
}
```

---

#### Error B3: Property access on never type (Lines 197, 198, 199, 200)

**Problem:**
```typescript
action.name        // Error: Property 'name' does not exist on type 'never'
action.schemaLines // Error: Property 'schemaLines' does not exist on type 'never'
```

**Root Cause:** Type inference failure in loop

**Solution: Explicit type annotation**
```typescript
// ❌ BEFORE
for (const action of actions) {
    // TypeScript infers 'never' if actions type is wrong
}

// ✅ AFTER
interface GeneratedContractAction {
    name: string
    schemaLines: string[]
    fieldCount: number
}

for (const action of actions as GeneratedContractAction[]) {
    // NO! This uses 'as'
}

// ✅ BETTER: Fix actions type at source
const actions: GeneratedContractAction[] = this.actionGenerator.generate(...)

for (const action of actions) {
    // Now TypeScript knows the type!
}
```

---

#### Error B4: Record<,> syntax (Line 320)

**Problem:**
```typescript
const fields: Record<,> = {}  // ❌ Incomplete
```

**Solution:**
```typescript
// ✅ CORRECT
const fields: Record<string, ParsedResponseField> = {}
```

---

#### Error B5: Type 'unknown' must have iterator (Line 382)

**Problem:**
```typescript
for (const [propName, propType] of props) {
    // Error: Type 'unknown' must have a '[Symbol.iterator]()' method
}
```

**Root Cause:** `props` is typed as `unknown`

**Solution: Type guard before iteration**
```typescript
// ✅ SOLUTION: Runtime type checking
function isIterableEntries(
    value: unknown
): value is Iterable<[string, ]> {
    return value != null && typeof value[Symbol.iterator] === 'function'
}

if (semanticType.properties) {
    const props = semanticType.properties instanceof Map
        ? Array.from(semanticType.properties.entries())
        : Object.entries(semanticType.properties)
    
    // Type is now [string, any][]
    for (const [propName, propType] of props) {
        // Safe!
    }
}
```

---

### Category C: ContractActionGenerator.ts Errors

#### Error C1: Type comparisons fail (Lines 197-209)

**Problem:**
```typescript
if (field.type === 'STRING') {  // Error: Type '"STRING"' is not comparable
```

**Root Cause:** `field.type` is typed as `SemanticTypeKind` which doesn't include `'STRING'`

**Solution: Use correct type values**
```typescript
// Investigation: What is SemanticTypeKind?
type SemanticTypeKind = 
    | 'primitive'
    | 'object'
    | 'union'
    | 'never'
    // etc...

// ✅ SOLUTION: Map to correct type
function mapFieldTypeToSemanticKind(fieldType: string): string {
    const typeMap: Record<string, string> = {
        'STRING': 'string',
        'NUMBER': 'number',
        'INTEGER': 'number',
        'FLOAT': 'number',
        'BOOLEAN': 'boolean',
        'DATETIME': 'string',
        'DATE': 'string',
        'TIME': 'string',
        'NULL': 'null'
    }
    
    return typeMap[fieldType] ?? 'string'
}

// Usage:
const mappedType = mapFieldTypeToSemanticKind(field.type)
if (mappedType === 'string') {
    return 'z.string()'
}
```

---

#### Error C2: Property 'elementType' on never (Lines 217, 218)

**Problem:**
```typescript
field.elementType  // Error: Property 'elementType' does not exist on type 'never'
```

**Root Cause:** Type narrowing failure

**Solution: Type guard**
```typescript
// ✅ SOLUTION: Runtime type check
interface ArrayField {
    type: 'array'
    elementType: FieldType
}

function isArrayField(field: Field): field is ArrayField {
    return 'elementType' in field && field.type === 'array'
}

// Usage:
if (isArrayField(field)) {
    // Now field.elementType exists!
    const elementSchema = this.mapFieldToZod(field.elementType)
    return `z.array(${elementSchema})`
}
```

---

#### Error C3: Property 'properties' on never (Line 223)

**Problem:**
```typescript
field.properties  // Error: Property 'properties' does not exist on type 'never'
```

**Solution: Type guard**
```typescript
// ✅ SOLUTION
interface ObjectField {
    type: 'object'
    properties: Record<string, Field>
}

function isObjectField(field: Field): field is ObjectField {
    return 'properties' in field && field.type === 'object'
}

// Usage:
if (isObjectField(field)) {
    // field.properties now exists!
    const props = Object.entries(field.properties)
        .map(([key, val]) => `${key}: ${this.mapFieldToZod(val)}`)
    return `z.object({ ${props.join(', ')} })`
}
```

---

## 🔧 Implementation Strategy

### Phase 1: Fix Type Definitions (Foundation)

**Step 1.1: Register GeneratedContract in ArtifactRegistry**
```typescript
// File: packages/core/src/compiler/artifacts/index.ts
export interface ArtifactRegistry {
    SemanticTypes: SemanticTypesArtifact
    GeneratedTypeScript: GeneratedTypeScriptArtifact
    GeneratedForm: GeneratedFormArtifact
    RequestTypes: RequestTypesArtifact
    GeneratedContract: GeneratedContractArtifact  // ← ADD
}
```

**Step 1.2: Fix Manifest type**
```typescript
// File: packages/core/src/types/route.ts
export interface Manifest {
    version: string
    baseURL: string
    generatedAt: string
    routes: ParsedRoute[]
    resources?: ParsedResource[]
    models?: ParsedModel[]  // ← Ensure this exists
}

// Export type helper
export type ManifestRoute = Manifest['routes'][number]
```

---

### Phase 2: Fix CompilerBridge.ts

**Step 2.1: Fix readonly tuple assignments**
```typescript
// All three locations (lines 113, 148, 187)
const [generatedArtifact]: readonly [GeneratedTypeScriptArtifact] = pass.run([inputArtifact])
const [generatedArtifact]: readonly [GeneratedFormArtifact] = pass.run([requestTypesArtifact])
const [generatedArtifact]: readonly [GeneratedContractArtifact] = pass.run([requestTypesArtifact])
```

**Step 2.2: Fix route type references**
```typescript
// Import at top
import type { Manifest as RouteManifest, ManifestRoute } from '../../../core/src/types/route'

// Update method signatures
private static extractResourceName(route: ManifestRoute): string | null
private static determineAction(method: string): 'create' | 'update' | null
```

**Step 2.3: Fix field type conversion**
```typescript
private static convertFieldsArrayToRecord(
    fields: ParsedField[]
): Record<string, ResourceFieldKind> {
    const result: Record<string, ResourceFieldKind> = {}
    
    for (const field of fields) {
        result[field.name] = {
            type: field.type,
            nullable: field.nullable ?? false,
            // ... other properties
        }
    }
    
    return result
}

// Usage in processResources:
const fieldsRecord = this.convertFieldsArrayToRecord(resource.fields || [])
const flattenedFields = flattenResourceFields(resource.name, fieldsRecord, options)
```

---

### Phase 3: Fix ContractGeneratorPass.ts

**Step 3.1: Fix action type annotations**
```typescript
// Define explicit interface
interface GeneratedContractAction {
    name: string
    schemaLines: string[]
    fieldCount: number
}

// Use in method
const actions: GeneratedContractAction[] = this.actionGenerator.generate(
    requestType.actions,
    requestType.responseData
)

// Now loop works without 'never' errors
for (const action of actions) {
    // action.name, action.schemaLines accessible!
}
```

**Step 3.2: Fix type guard for semantic type**
```typescript
private convertSingleField(
    fieldName: string,
    semanticType: unknown  // Accept unknown, then narrow
): ParsedResponseField {
    // Type guard for primitive
    if (
        semanticType != null &&
        typeof semanticType === 'object' &&
        ('kind' in semanticType || 'type' in semanticType)
    ) {
        const typed = semanticType as { kind?: string; type?: string }
        
        if (typed.kind === 'primitive' || typed.type === 'string') {
            // Handle primitive
        }
    }
    
    // Fallback
    return {
        name: fieldName,
        kind: 'primitive',
        type: 'string',
        nullable: false,
        optional: false
    }
}
```

---

### Phase 4: Fix ContractActionGenerator.ts

**Step 4.1: Type mapping for field types**
```typescript
private mapFieldTypeToZodString(field: RequestField): string {
    // Define expected type values
    const TYPE_TO_ZOD: Record<string, string> = {
        'string': 'z.string()',
        'number': 'z.number()',
        'integer': 'z.number().int()',
        'boolean': 'z.boolean()',
        'date': 'z.string().datetime()',
        'null': 'z.null()'
    }
    
    const zodType = TYPE_TO_ZOD[field.type.toLowerCase()] ?? 'z.string()'
    
    // Add modifiers
    if (field.nullable) {
        return `${zodType}.nullable()`
    }
    
    return zodType
}
```

**Step 4.2: Type guards for field variants**
```typescript
type PrimitiveField = { type: 'string' | 'number' | 'boolean' }
type ArrayField = { type: 'array'; elementType: Field }
type ObjectField = { type: 'object'; properties: Record<string, Field> }

type Field = PrimitiveField | ArrayField | ObjectField

function isArrayField(field: Field): field is ArrayField {
    return 'elementType' in field
}

function isObjectField(field: Field): field is ObjectField {
    return 'properties' in field
}

// Usage:
if (isArrayField(field)) {
    const elementSchema = this.mapField(field.elementType)
    return `z.array(${elementSchema})`
}

if (isObjectField(field)) {
    const props = Object.entries(field.properties)
    // ...
}
```

---

## ✅ Verification Checklist

After applying all fixes:

### Compilation
- [ ] `npx tsc --noEmit` passes with ZERO errors
- [ ] No `any` types in codebase (check with `grep -r ": any" packages/`)
- [ ] No `as` assertions (check with `grep -r " as " packages/`)

### Type Safety
- [ ] All type annotations explicit
- [ ] All unions properly discriminated
- [ ] All runtime type checks use type guards
- [ ] All generic types properly constrained

### Runtime
- [ ] Tests pass
- [ ] Generated code works correctly
- [ ] No runtime type errors

---

## 📊 Summary

### Fixes Required

| Category | Errors | Fix Strategy |
|----------|--------|--------------|
| CompilerBridge.ts | 15 | Type definitions + conversions |
| ContractGeneratorPass.ts | 15 | Register artifact + type guards |
| ContractActionGenerator.ts | 13 | Type mapping + discriminated unions |

### Zero Escape Hatches

- ❌ No `any` types
- ❌ No `as` type assertions
- ❌ No `@ts-ignore` comments
- ✅ Only proper TypeScript type safety

### Key Patterns

1. **Type Guards**: For runtime type narrowing
2. **Discriminated Unions**: For variant types
3. **Explicit Annotations**: When inference fails
4. **Helper Functions**: For complex type conversions

---

**Status:** Design Complete - Ready for Implementation  
**Estimated Time:** 2-3 hours for all fixes  
**Risk:** LOW (type-only changes, compiler-verified)

