# RouteSync: Panduan Sistem Types (Layer Emitter)

**Versi:** Types v1  
**Status:** Core Type Infrastructure untuk Layer Emitters  
**Sumber:** `packages/cli/src/generators/layers/types.ts` (140+ baris)

Dokumen ini memberikan panduan lengkap untuk AI agent yang bekerja dengan sistem types RouteSync layer emitters. Ini adalah **shared type definitions** untuk semua emitter layers dalam generator refactoring architecture.

---

## 🎯 ARSITEKTUR TYPES SYSTEM OVERVIEW

### Motivasi: Mengapa Shared Types untuk Layers?

**MASALAH LAMA (Scattered Type Definitions):**
```typescript
// ❌ Setiap layer define types sendiri-sendiri
// ContractLayer.ts
interface ContractResponse { zType: string; name: string }

// ReadLayer.ts  
interface ReadResponse { tsType: string; name: string }  // Different!

// MapperLayer.ts
interface MapResponse { zodType: string; typeName: string }  // Different!
```

**SOLUSI BARU (Shared Type Definitions):**
```typescript
// ✅ Single source of truth untuk all layers
import { LayerContext, RouteResponseComposition } from './types'

// Semua layer menggunakan interface yang sama
const processResponse = (composition: RouteResponseComposition) => {
  // zType, tsType, isCollection, isPaginated, isWrapped, isResourceAlias
  // Consistent across all layers
}
```

### Prinsip Desain Core

1. **Shared Type System**: Semua layer HARUS import dari types.ts, tidak boleh define sendiri
2. **IR-First Architecture**: LayerContext.ir sebagai single source of truth
3. **Immutable Data Flow**: Context dan compositions bersifat immutable
4. **Semantic Resolution**: Integration dengan SemanticResolutionKernel
5. **Runtime Augmentation**: Support untuk runtime-added fields pada manifest data

---

## 🏗️ KOMPONEN ARSITEKTUR UTAMA

### 1. LayerContext — Context untuk Semua Emitters

```typescript
interface LayerContext {
  manifest: RouteManifest;           // Original manifest (facts)
  knownModels: Set<string>;          // Available models cache
  knownResources: Set<string>;       // Available resources cache  
  knownSchemas: Set<string>;         // Generated schemas cache
  kernel?: SemanticResolutionKernel; // Type resolution engine
  ir?: CompilerIR;                   // Compiler IR (single source of truth)
}
```

**Core Purpose:**
- **Caching**: Avoid duplicate computations across layers
- **IR Integration**: Access to semantic resolution results
- **Context Sharing**: Consistent data access pattern
- **Optional Dependencies**: kernel dan ir optional untuk standalone testing

**📋 LayerContext Usage Pattern:**
```typescript
// Correct: IR-first resolution
function processField(field: ParsedField, context: LayerContext): TypeMapping {
  // 1. Check IR first (single source of truth)
  if (context.ir?.fieldMappings.has(field.name)) {
    return context.ir.fieldMappings.get(field.name);
  }
  
  // 2. Fallback to semantic kernel
  if (context.kernel) {
    return context.kernel.resolve(field, context);
  }
  
  // 3. Last resort: manual inference
  return inferTypeFromField(field);
}

// Context construction for emitters
const createLayerContext = (manifest: RouteManifest): LayerContext => ({
  manifest,
  knownModels: new Set(manifest.models?.map(m => m.name) || []),
  knownResources: new Set(manifest.resources?.map(r => r.name) || []),
  knownSchemas: new Set(), // Populated during contract generation
  kernel: new SemanticResolutionKernel(),
  ir: undefined // Populated by SemanticResolver.resolve()
});
```

### 2. RouteResponseComposition — IR antar Layers

```typescript
interface RouteResponseComposition {
  zType: string;           // Zod type expression ('OrderResourceSchema')
  tsType: string;          // TypeScript type ('OrderResourceResponse')
  isCollection: boolean;   // Array response flag
  isPaginated: boolean;    // Laravel pagination wrapper
  isWrapped: boolean;      // JsonResource $wrap behavior  
  isResourceAlias: boolean; // Resource alias vs generated fallback
  name?: string;          // Generated response name (for mappers/reads)
}
```

**Purpose:** Computed ONCE oleh ContractLayer, di-reuse oleh ReadLayer & MapperLayer

**📋 RouteResponseComposition Examples:**
```typescript
// Resource alias (existing resource)
const resourceAlias: RouteResponseComposition = {
  zType: 'UserResourceSchema',
  tsType: 'UserResourceResponse', 
  isCollection: false,
  isPaginated: false,
  isWrapped: true,
  isResourceAlias: true,  // Points to existing resource
  name: 'UserResource'
};

// Generated fallback (route-named)
const routeFallback: RouteResponseComposition = {
  zType: 'OrdersShowResponseSchema',
  tsType: 'OrdersShowResponse',
  isCollection: false, 
  isPaginated: false,
  isWrapped: false,
  isResourceAlias: false,  // Generated specifically for this route
  name: 'OrdersShowResponse'
};

// Collection response dengan pagination
const paginatedCollection: RouteResponseComposition = {
  zType: 'z.array(ProductResourceSchema)',
  tsType: 'ProductResourceResponse[]',
  isCollection: true,
  isPaginated: true,
  isWrapped: true,  // Laravel pagination wrapper
  isResourceAlias: true,
  name: 'ProductResource'
};
```

### 3. ParsedModel — Model Representation

```typescript
interface ParsedModel {
  name: string;                       // Model class name
  tableName?: string;                 // Database table name
  kind?: string;                      // Type classification
  fields?: Record<string, ParsedField | unknown>; // Model fields
  relations?: Record<string, unknown>; // Eloquent relations
  accessors?: Record<string, unknown>; // Model accessors
  layer?: string;                     // Layer classification
  
  // @routesync/core compatibility
  columns?: Array<{ name: string; type: string; nullable?: boolean }>;
  casts?: Record<string, string>;     // Laravel $casts
}
```

**Flexible Structure**: Compatible dengan @routesync/core dan local generation

### 4. ParsedRoute — Route Representation

```typescript
interface ParsedRoute {
  name?: string;           // Route name ('users.show')
  method?: string;         // HTTP method ('GET', 'POST')
  path?: string;           // URL path ('/users/{id}')
  actionName?: string;     // Controller action ('show')
  controllerName?: string; // Controller class
  groupName?: string;      // Route group classification
  response?: RuntimeAugmented<Record<string, unknown>>; // Response metadata
  schema?: { rules?: Record<string, unknown> };         // Validation rules
  assignments?: Record<string, string>; // Variable assignments
  
  // Semantic resolution results
  resolved?: SemanticNode;
  semantic?: SemanticNode;
}
```

**RuntimeAugmented Support**: Fields dapat di-augment at runtime dengan semantic info

### 5. TypeMapping — Type Inference Results

```typescript
interface TypeMapping {
  zodType: string;    // 'z.string()', 'z.number().nullable()'
  tsType: string;     // 'string', 'number | null'  
  baseType: string;   // 'string', 'number'
  isNullable: boolean; // Nullable flag
}
```

**Computed dari SQL type + cast, used by ContractLayer & ReadLayer**

**📋 TypeMapping Examples:**
```typescript
// Simple string field
const stringMapping: TypeMapping = {
  zodType: 'z.string()',
  tsType: 'string',
  baseType: 'string', 
  isNullable: false
};

// Nullable number field
const nullableNumberMapping: TypeMapping = {
  zodType: 'z.number().nullable()',
  tsType: 'number | null',
  baseType: 'number',
  isNullable: true
};

// DateTime field dengan custom transform
const dateTimeMapping: TypeMapping = {
  zodType: 'z.string().datetime().transform(val => new Date(val))',
  tsType: 'Date',
  baseType: 'datetime',
  isNullable: false
};

// JSON field
const jsonMapping: TypeMapping = {
  zodType: 'z.record(z.unknown())',
  tsType: 'Record<string, unknown>',
  baseType: 'json',
  isNullable: false
};
```

---
## 🔄 RUNTIME AUGMENTATION SYSTEM

### RuntimeAugmented Type Pattern

```typescript
type RuntimeAugmented<T = unknown> = T & {
  resolved?: SemanticNode;   // Result dari SemanticResolutionKernel  
  semantic?: SemanticNode;   // Alternative semantic resolution
  kind?: string;             // Type classification
  type?: string;             // Resolved type string
  collection?: boolean;      // Array flag
  paginated?: boolean;       // Laravel pagination
  wrapped?: boolean;         // JsonResource wrapping
  nullable?: boolean;        // Nullable field
  fields?: Record<string, unknown>; // Nested field metadata
}
```

**Purpose:** Allow runtime addition of semantic metadata to manifest objects

**📋 RuntimeAugmented Usage:**
```typescript
// Original manifest route
const originalRoute: ParsedRoute = {
  name: 'users.show',
  method: 'GET',
  path: '/users/{id}',
  response: {
    type: 'resource',
    resource: 'UserResource'
  }
};

// After semantic resolution (runtime augmented)
const augmentedRoute: ParsedRoute = {
  ...originalRoute,
  response: {
    ...originalRoute.response,
    // Runtime-added semantic fields
    resolved: {
      status: 'resolved',
      type: 'resource',
      resource: 'UserResource',
      collection: false,
      paginated: false,
      wrapped: true
    },
    semantic: {
      type: 'model',
      model: 'User',
      collection: false
    }
  }
};

// Usage dalam layers
function processRoute(route: ParsedRoute, context: LayerContext): RouteResponseComposition {
  const response = route.response;
  
  // Check runtime augmented fields first
  if (response?.resolved) {
    return createCompositionFromResolved(response.resolved);
  }
  
  if (response?.semantic) {
    return createCompositionFromSemantic(response.semantic);
  }
  
  // Fallback to manual inference
  return inferCompositionFromResponse(response);
}
```

### SemanticNode Structure

```typescript
interface SemanticNode {
  status?: string;         // 'resolved' | 'partial' | 'unknown'
  type?: string;           // Semantic type classification
  kind?: string;           // Alternative type classification
  model?: string;          // Model name (jika type=model)
  resource?: string;       // Resource name (jika type=resource)
  collection?: boolean;    // Array response
  paginated?: boolean;     // Laravel pagination wrapper
  wrapped?: boolean;       // JsonResource $wrap behavior
  nullable?: boolean;      // Can be null
  fields?: Record<string, unknown>; // Nested field metadata
}
```

---

## 🔄 FIELD-LEVEL TYPE SYSTEM

### ParsedField Structure

```typescript
interface ParsedField {
  name?: string;      // Field name
  type: string;       // SQL/Laravel type
  cast?: string;      // Laravel cast override
  nullable?: boolean; // Nullable flag
  default?: unknown;  // Default value
  kind?: string;      // Field kind classification
}
```

### FieldMetadata for Nested Generation

```typescript
interface FieldMetadata {
  name: string;              // Field name
  snakeCaseName: string;     // snake_case version
  zodType: string;           // Zod expression
  tsType: string;            // TypeScript type
  nullable: boolean;         // Nullable flag
  isArray: boolean;          // Array field
  isObject: boolean;         // Object field
  nestedFields?: FieldMetadata[]; // Recursive nesting
}
```

**Purpose:** Used by ContractLayer untuk emit z.object({ ... }) dengan correct indentation

**📋 FieldMetadata Example:**
```typescript
// Complex nested field metadata
const userProfileMetadata: FieldMetadata = {
  name: 'profile',
  snakeCaseName: 'profile',
  zodType: 'z.object({ ... })',
  tsType: 'UserProfile',
  nullable: true,
  isArray: false,
  isObject: true,
  nestedFields: [
    {
      name: 'bio',
      snakeCaseName: 'bio',
      zodType: 'z.string().nullable()',
      tsType: 'string | null',
      nullable: true,
      isArray: false,
      isObject: false
    },
    {
      name: 'socialLinks',
      snakeCaseName: 'social_links',
      zodType: 'z.array(z.string())',
      tsType: 'string[]',
      nullable: false,
      isArray: true,
      isObject: false
    }
  ]
};
```

### LayerOutput Structure

```typescript
interface LayerOutput {
  lines: string[];                    // Generated code lines
  metadata?: Record<string, unknown>; // Additional metadata
}
```

**Usage dalam Emitters:**
```typescript
// Layer emitter pattern
class ContractEmitter {
  emit(context: LayerContext): LayerOutput {
    const lines: string[] = [];
    
    // Generate imports
    lines.push('import { z } from "zod";');
    lines.push('');
    
    // Generate schemas for each model
    context.manifest.models?.forEach(model => {
      const schemaLines = this.generateModelSchema(model, context);
      lines.push(...schemaLines);
    });
    
    return {
      lines,
      metadata: {
        generatedSchemas: context.knownSchemas.size,
        timestamp: new Date().toISOString()
      }
    };
  }
}
```

---

## 🚨 POLA PENGGUNAAN KRITIS

### ✅ Implementasi yang Benar

**1. IR-First Processing:**
```typescript
// BENAR: Check IR first, fallback gracefully
function resolveFieldType(field: ParsedField, context: LayerContext): TypeMapping {
  // 1. Primary: Use IR if available
  if (context.ir?.fieldMappings) {
    const mapping = context.ir.fieldMappings.get(field.name);
    if (mapping) {
      return mapping;
    }
  }
  
  // 2. Secondary: Use semantic kernel
  if (context.kernel) {
    const resolved = context.kernel.resolve(field, context);
    return convertSemanticToTypeMapping(resolved);
  }
  
  // 3. Fallback: Manual inference
  return {
    zodType: inferZodType(field.type, field.cast),
    tsType: inferTsType(field.type, field.cast),
    baseType: field.type,
    isNullable: field.nullable || false
  };
}
```

**2. Immutable Context Usage:**
```typescript
// BENAR: Tidak mutate context, return new objects
function addKnownSchema(context: LayerContext, schemaName: string): LayerContext {
  return {
    ...context,
    knownSchemas: new Set([...context.knownSchemas, schemaName])
  };
}

// BENAR: Build compositions immutably
function createResponseComposition(
  response: RuntimeAugmented,
  context: LayerContext
): RouteResponseComposition {
  const resolved = response.resolved || response.semantic;
  
  return {
    zType: generateZodType(resolved, context),
    tsType: generateTsType(resolved, context),
    isCollection: resolved?.collection || false,
    isPaginated: resolved?.paginated || false,
    isWrapped: resolved?.wrapped || false,
    isResourceAlias: checkResourceAlias(resolved, context),
    name: generateName(resolved, context)
  };
}
```

**3. Type-Safe Field Processing:**
```typescript
// BENAR: Handle optional fields safely
function processModelField(
  model: ParsedModel,
  fieldName: string,
  context: LayerContext
): FieldMetadata | null {
  // Safe field access dengan type guards
  const field = model.fields?.[fieldName];
  if (!field || typeof field !== 'object') {
    return null;
  }
  
  const parsedField = field as ParsedField;
  const typeMapping = resolveFieldType(parsedField, context);
  
  return {
    name: fieldName,
    snakeCaseName: toSnakeCase(fieldName),
    zodType: typeMapping.zodType,
    tsType: typeMapping.tsType,
    nullable: typeMapping.isNullable,
    isArray: typeMapping.zodType.includes('z.array'),
    isObject: typeMapping.zodType.includes('z.object')
  };
}
```

### ❌ Anti-Pattern yang Harus Dihindari

**1. Direct Type Definitions dalam Layers:**
```typescript
// SALAH: Layer define types sendiri
class BadContractEmitter {
  // JANGAN! Harus import dari types.ts
  interface LocalResponse {
    name: string;
    type: string;
  }
  
  emit(context: any): any {  // JANGAN! Untyped context
    // Process without shared types
  }
}

// BENAR: Use shared types
import { LayerContext, RouteResponseComposition } from './types';

class GoodContractEmitter {
  emit(context: LayerContext): LayerOutput {
    // Use shared type definitions
  }
}
```

**2. Context Mutation:**
```typescript
// SALAH: Mutate context objects
function badProcessing(context: LayerContext): void {
  context.knownSchemas.add('NewSchema');  // JANGAN! Mutation
  context.manifest.routes?.push(newRoute); // JANGAN! Mutation
}

// BENAR: Immutable processing
function goodProcessing(context: LayerContext): LayerContext {
  return {
    ...context,
    knownSchemas: new Set([...context.knownSchemas, 'NewSchema'])
  };
}
```

**3. Ignoring IR Hierarchy:**
```typescript
// SALAH: Skip IR, langsung ke kernel atau manual
function badResolution(field: ParsedField, context: LayerContext): TypeMapping {
  // Skip IR completely!
  if (context.kernel) {
    return context.kernel.resolve(field, context);
  }
  return manualInference(field);
}

// BENAR: Follow IR-first hierarchy
function goodResolution(field: ParsedField, context: LayerContext): TypeMapping {
  // 1. IR first
  if (context.ir?.fieldMappings.has(field.name)) {
    return context.ir.fieldMappings.get(field.name);
  }
  
  // 2. Then kernel
  if (context.kernel) {
    return context.kernel.resolve(field, context);
  }
  
  // 3. Finally manual
  return manualInference(field);
}
```

---

## 🔍 DEBUGGING & VALIDATION

### Type System Validation

```typescript
// Validate LayerContext consistency
function validateLayerContext(context: LayerContext): string[] {
  const errors: string[] = [];
  
  // Check required fields
  if (!context.manifest) {
    errors.push('LayerContext.manifest is required');
  }
  
  if (!context.knownModels) {
    errors.push('LayerContext.knownModels is required');
  }
  
  // Validate consistency
  const manifestModels = context.manifest.models?.map(m => m.name) || [];
  const knownModelsArray = Array.from(context.knownModels);
  
  manifestModels.forEach(modelName => {
    if (!knownModelsArray.includes(modelName)) {
      errors.push(`Model ${modelName} in manifest but not in knownModels`);
    }
  });
  
  // Check IR integration
  if (context.ir && !context.kernel) {
    errors.push('IR provided without kernel - may cause fallback issues');
  }
  
  return errors;
}

// Validate RouteResponseComposition
function validateResponseComposition(
  composition: RouteResponseComposition
): boolean {
  // Check required fields
  if (!composition.zType || !composition.tsType) {
    console.error('RouteResponseComposition missing required type fields');
    return false;
  }
  
  // Check consistency flags
  if (composition.isPaginated && !composition.isCollection) {
    console.warn('Paginated response should typically be collection');
  }
  
  if (composition.isResourceAlias && !composition.name) {
    console.error('Resource alias must have name specified');
    return false;
  }
  
  // Validate type expressions
  if (!composition.zType.startsWith('z.') && !composition.zType.includes('Schema')) {
    console.warn('zType should be Zod expression or Schema reference:', composition.zType);
  }
  
  return true;
}
```

### Type Resolution Debugging

```typescript
// Debug type resolution flow
function debugTypeResolution(
  field: ParsedField,
  context: LayerContext
): TypeMapping {
  console.group(`Type Resolution: ${field.name || 'unnamed'}`);
  
  // Check IR
  if (context.ir?.fieldMappings?.has(field.name || '')) {
    const irResult = context.ir.fieldMappings.get(field.name || '');
    console.log('✅ Resolved from IR:', irResult);
    console.groupEnd();
    return irResult!;
  }
  
  // Check kernel
  if (context.kernel) {
    const kernelResult = context.kernel.resolve(field, context);
    const mapping = convertSemanticToTypeMapping(kernelResult);
    console.log('⚙️ Resolved from Kernel:', mapping);
    console.groupEnd();
    return mapping;
  }
  
  // Manual inference
  const manualResult = {
    zodType: `z.${field.type}()`,
    tsType: mapSqlToTs(field.type),
    baseType: field.type,
    isNullable: field.nullable || false
  };
  console.log('🔧 Manual inference:', manualResult);
  console.groupEnd();
  
  return manualResult;
}

// Monitor type consistency across layers
class TypeConsistencyMonitor {
  private typeUsages = new Map<string, Set<string>>();
  
  recordTypeUsage(layerName: string, typeName: string): void {
    if (!this.typeUsages.has(typeName)) {
      this.typeUsages.set(typeName, new Set());
    }
    this.typeUsages.get(typeName)!.add(layerName);
  }
  
  checkConsistency(): void {
    console.log('Type Usage Report:');
    this.typeUsages.forEach((layers, typeName) => {
      if (layers.size > 1) {
        console.log(`✅ ${typeName}: used by [${Array.from(layers).join(', ')}]`);
      } else {
        console.warn(`⚠️ ${typeName}: only used by [${Array.from(layers).join(', ')}]`);
      }
    });
  }
}
```

### Layer Integration Testing

```typescript
// Test layer type integration
describe('Layer Type Integration', () => {
  const mockManifest: RouteManifest = {
    models: [
      { name: 'User', columns: [{ name: 'email', type: 'varchar', nullable: false }] }
    ],
    routes: [
      { name: 'users.show', method: 'GET', response: { type: 'model', model: 'User' } }
    ]
  };
  
  const context: LayerContext = {
    manifest: mockManifest,
    knownModels: new Set(['User']),
    knownResources: new Set(),
    knownSchemas: new Set()
  };
  
  test('LayerContext validation passes', () => {
    const errors = validateLayerContext(context);
    expect(errors).toHaveLength(0);
  });
  
  test('RouteResponseComposition creation', () => {
    const composition: RouteResponseComposition = {
      zType: 'UserSchema',
      tsType: 'User',
      isCollection: false,
      isPaginated: false,
      isWrapped: false,
      isResourceAlias: false,
      name: 'User'
    };
    
    expect(validateResponseComposition(composition)).toBe(true);
  });
  
  test('TypeMapping consistency', () => {
    const field: ParsedField = { type: 'varchar', nullable: false };
    const mapping = debugTypeResolution(field, context);
    
    expect(mapping.zodType).toContain('z.');
    expect(mapping.tsType).toBe('string');
    expect(mapping.isNullable).toBe(false);
  });
});
```

---

## 🎯 INTEGRASI DENGAN LAYER EMITTERS

### Contract Layer Integration

```typescript
// ContractEmitter menggunakan shared types
class ContractEmitter {
  emit(context: LayerContext): LayerOutput & { 
    compositions: Map<string, RouteResponseComposition>
  } {
    const compositions = new Map<string, RouteResponseComposition>();
    const lines: string[] = [];
    
    // Process routes dengan shared types
    context.manifest.routes?.forEach(route => {
      const composition = this.createComposition(route, context);
      compositions.set(route.name || '', composition);
      
      // Generate schema lines
      const schemaLines = this.generateSchema(composition, context);
      lines.push(...schemaLines);
    });
    
    return {
      lines,
      compositions,  // Export compositions for other layers
      metadata: {
        generatedCount: compositions.size,
        usedTypes: Array.from(context.knownSchemas)
      }
    };
  }
  
  private createComposition(
    route: ParsedRoute,
    context: LayerContext
  ): RouteResponseComposition {
    const response = route.response;
    
    return {
      zType: this.generateZodType(response, context),
      tsType: this.generateTsType(response, context),
      isCollection: response?.collection || false,
      isPaginated: response?.paginated || false,
      isWrapped: response?.wrapped || false,
      isResourceAlias: this.checkResourceAlias(response, context),
      name: this.generateName(route, response)
    };
  }
}
```

### Read Layer Integration

```typescript
// ReadEmitter konsumen compositions dari ContractEmitter
class ReadEmitter {
  emit(
    context: LayerContext,
    compositions: Map<string, RouteResponseComposition>
  ): LayerOutput {
    const lines: string[] = [];
    
    // Use compositions from ContractEmitter (no re-computation)
    compositions.forEach((composition, routeName) => {
      if (!composition.isResourceAlias) {
        const typeLines = this.generateReadType(composition, context);
        lines.push(...typeLines);
      }
    });
    
    return {
      lines,
      metadata: {
        processedCompositions: compositions.size,
        generatedTypes: lines.filter(line => line.includes('export interface')).length
      }
    };
  }
  
  private generateReadType(
    composition: RouteResponseComposition,
    context: LayerContext
  ): string[] {
    const lines: string[] = [];
    
    lines.push(`export interface ${composition.name}Read {`);
    
    // Generate fields using shared TypeMapping
    if (composition.name) {
      const model = this.findModel(composition.name, context);
      if (model) {
        lines.push(...this.generateModelFields(model, context));
      }
    }
    
    lines.push('}');
    lines.push('');
    
    return lines;
  }
}
```

### Mapper Layer Integration

```typescript
// MapperEmitter juga konsumen compositions
class MapperEmitter {
  emit(
    context: LayerContext,
    compositions: Map<string, RouteResponseComposition>
  ): LayerOutput {
    const lines: string[] = [];
    
    // Generate mappers berdasarkan compositions
    compositions.forEach((composition, routeName) => {
      const mapperLines = this.generateMapper(composition, context);
      lines.push(...mapperLines);
    });
    
    return {
      lines,
      metadata: {
        generatedMappers: compositions.size
      }
    };
  }
}
```

---

## 📋 EXTENSION GUIDELINES

### Adding New Layer Types

**1. Extend LayerContext Interface:**
```typescript
interface LayerContext {
  // ... existing fields
  customCache?: Map<string, CustomData>;
  featureFlags?: Record<string, boolean>;
}
```

**2. Add New Composition Types:**
```typescript
interface RouteResponseComposition {
  // ... existing fields
  customMetadata?: CustomMetadata;
  optimizationHints?: OptimizationHint[];
}

interface CustomMetadata {
  cacheStrategy: 'memory' | 'redis' | 'none';
  validationLevel: 'strict' | 'loose';
}
```

**3. Update Processing Functions:**
```typescript
// All functions yang process LayerContext perlu update
function processWithExtensions(
  context: LayerContext
): ExtendedOutput {
  // Handle new fields
  if (context.customCache) {
    // Process custom cache
  }
  
  if (context.featureFlags?.newFeature) {
    // Handle new feature
  }
}
```

### Adding New Field Types

**1. Extend ParsedField:**
```typescript
interface ParsedField {
  // ... existing fields
  validation?: ValidationRule[];
  transformation?: TransformationRule[];
}

interface ValidationRule {
  type: 'required' | 'email' | 'min' | 'max';
  value?: unknown;
  message?: string;
}
```

**2. Update TypeMapping:**
```typescript
interface TypeMapping {
  // ... existing fields
  validationRules?: ValidationRule[];
  transformExpression?: string;
}
```

### Adding New Layer Output Types

**1. Extend LayerOutput:**
```typescript
interface LayerOutput {
  lines: string[];
  metadata?: Record<string, unknown>;
  // New output types
  assets?: AssetDefinition[];
  imports?: ImportStatement[];
}

interface AssetDefinition {
  type: 'css' | 'js' | 'svg';
  content: string;
  path: string;
}
```

---

## 🚀 PERFORMANCE & OPTIMIZATION

### Type Resolution Caching

```typescript
// Cache type resolutions untuk avoid recomputation
class TypeResolutionCache {
  private cache = new Map<string, TypeMapping>();
  
  get(fieldKey: string): TypeMapping | undefined {
    return this.cache.get(fieldKey);
  }
  
  set(fieldKey: string, mapping: TypeMapping): void {
    this.cache.set(fieldKey, mapping);
  }
  
  generateKey(field: ParsedField): string {
    return `${field.type}:${field.cast || 'none'}:${field.nullable || false}`;
  }
}

// Usage dalam layer processing
function optimizedTypeResolution(
  field: ParsedField,
  context: LayerContext,
  cache: TypeResolutionCache
): TypeMapping {
  const cacheKey = cache.generateKey(field);
  const cached = cache.get(cacheKey);
  
  if (cached) {
    return cached;
  }
  
  const resolved = resolveFieldType(field, context);
  cache.set(cacheKey, resolved);
  
  return resolved;
}
```

### Memory Management

```typescript
// Efficient context management untuk large manifests
class ContextManager {
  createLazyContext(manifest: RouteManifest): LayerContext {
    return {
      manifest,
      // Lazy initialization
      get knownModels() {
        return new Set(manifest.models?.map(m => m.name) || []);
      },
      get knownResources() {
        return new Set(manifest.resources?.map(r => r.name) || []);
      },
      knownSchemas: new Set(),
      kernel: undefined, // Load on demand
      ir: undefined      // Load on demand
    };
  }
  
  optimizeContext(context: LayerContext): LayerContext {
    // Remove unused references
    return {
      ...context,
      // Clear large objects if not needed
      manifest: context.ir ? undefined : context.manifest
    } as LayerContext;
  }
}
```

---

## 🎯 METRICS & SUCCESS INDICATORS

### Type System Quality Metrics

| Metric | Target | Purpose |
|--------|--------|---------|
| Type Consistency | 100% | Same types used across layers |
| IR Utilization | >80% | IR used before fallbacks |
| Cache Hit Ratio | >70% | Efficient type resolution |
| Context Validation | 100% pass | Valid context structure |
| Composition Reuse | >90% | Avoid duplicate computations |

### Developer Experience Metrics

- **Type Safety**: 0 runtime type errors
- **IntelliSense**: 100% autocomplete coverage
- **Import Consistency**: All layers import from types.ts
- **Documentation**: All interfaces documented
- **Testing**: 100% type interfaces tested

---

## 🔗 KOMPONEN TERKAIT

### Dependencies (Upstream)
- `packages/core/src/types/route.ts` - RouteManifest structure
- `packages/core/src/types/semantic.ts` - Semantic resolution system
- `packages/cli/src/resolvers/` - SemanticResolutionKernel

### Consumers (Downstream)
- `packages/cli/src/generators/layers/ContractEmitter.ts` - Contract generation
- `packages/cli/src/generators/layers/ReadEmitter.ts` - Type generation
- `packages/cli/src/generators/layers/MapperEmitter.ts` - Mapper generation
- `packages/cli/src/generators/layers/FieldEmitter.ts` - Field mapping generation

### Configuration Files
- `packages/cli/tsconfig.json` - TypeScript configuration
- `vitest.config.ts` - Test configuration untuk type testing

---

**Sistem types ini adalah foundation untuk consistent type sharing di seluruh layer emitter architecture RouteSync. Memahami struktur ini essential untuk maintaining type safety dan avoiding duplicate type definitions dalam refactored generator system.**

**Last Updated:** Juli 26, 2026  
**Types Version:** v1  
**Status:** Core infrastructure untuk layer emitter refactoring