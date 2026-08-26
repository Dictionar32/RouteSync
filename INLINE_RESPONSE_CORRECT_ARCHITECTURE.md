# Inline Response: Arsitektur Yang Benar

## Critical Review: Mengapa Dokumen Sebelumnya Salah

Dokumen `INLINE_RESPONSE_IMPLEMENTATION.md` memiliki **diagnosis yang benar** tapi **solusi yang salah secara fundamental**.

### ✅ Diagnosis Yang Benar

1. **Root cause teridentifikasi**: `route.response.fields` tidak masuk ke jalur generator
2. **Titik putus ditemukan**: `processResponseTypes()` hanya bergantung pada `requestType.responseData`
3. **Data ada di manifest**: Inline response fields memang tersimpan di manifest

### ❌ Solusi Yang Salah

#### Problem 1: Layer Violation

```
❌ BAD ARCHITECTURE:
Manifest ────┐
              ├─→ ContractGeneratorPass (membaca manifest langsung)
RequestTypes ─┘      ↓
              Guess resource name, action, parse fields
```

**Masalah:**
- ContractGeneratorPass diberi akses langsung ke manifest
- Pass menjadi tahu tentang format source data
- Mencampur concern: compilation dengan parsing

#### Problem 2: Heuristic Guessing

```typescript
// ❌ Nama resource ditebak dari URL
generateResourceNameFromRoute(route: ManifestRoute): string {
    // /api/payment/confirm/{id} → paymentConfirm
    // Collision prone! Tidak deterministik!
}

// ❌ Action ditebak dari string pattern
determineActionType(route): Action {
    if (action.includes('index')) return 'index';
    if (method === 'GET') return 'show'; // fallback
}
```

**Masalah:**
- Name collision tidak terdeteksi
- Tidak ada canonical identity
- Semantics tidak konsisten

#### Problem 3: Schema Builder Misuse

```typescript
// ❌ Selalu panggil buildShowSchema, lalu override action
const schema = buildShowSchema(resourceName, fields);
schema.action = determineActionType(route); // SALAH!
```

**Masalah:**
- Builder bisa membedakan struktur show vs index
- Override action setelah build → schema bisa salah

#### Problem 4: Silent Failures

```typescript
catch (error) {
    console.warn(`Failed to parse field ${fieldName}`);
    // Field di-skip, tapi generator tetap "berhasil" ❌
}
```

**Masalah:**
- Contract bisa kehilangan fields tanpa error
- Correctness tidak terjamin

---

## ✅ Arsitektur Yang Benar

### Prinsip Desain

1. **Artifact Normalization**: Inline response harus dinormalisasi menjadi same representation dengan Resource-based response
2. **Pass Purity**: ContractGeneratorPass tidak boleh tahu source format (manifest vs Resource)
3. **Canonical Identity**: Resource name dan action harus dari source canonical, bukan guessing
4. **Type Safety**: Semua data ter-type dan ter-validate sebelum masuk pass

### Correct Pipeline

```
Manifest
   ↓
[ManifestGenerator/Normalizer]
   ├─ Parse routes
   ├─ Detect inline responses (route.response.fields exists)
   ├─ Convert inline fields → SemanticType (sama dengan Resource)
   ├─ Generate canonical resource name (deterministik)
   ├─ Generate canonical action (dari route metadata)
   ↓
RequestTypesArtifact
   ├─ requestTypes[]
   │    ├─ resourceName (canonical)
   │    ├─ action (canonical)
   │    └─ responseData? (INLINE MAUPUN RESOURCE SAMA FORMAT)
   ↓
ContractGeneratorPass
   ↓
[processResponseTypes]
   ↓
ResponseSchemaMapper
   ↓
ContractCodeBuilder
```

---

## 📋 Implementation Steps

### STEP 1: Locate Artifact Creation Point

**File to find**: Di mana `RequestTypesArtifact` dibuat dari manifest

**Evidence to gather:**
```typescript
// Cari di codebase:
grep -r "RequestTypesArtifact" packages/cli/src --include="*.ts"
grep -r "requestTypes\[\]" packages/cli/src --include="*.ts"
grep -r "createRequestType" packages/cli/src --include="*.ts"
```

**Goal**: Identifikasi method yang convert `manifest.routes[]` → `RequestType[]`

---

### STEP 2: Extend RequestTypesArtifact Interface

**File**: `packages/core/src/compiler/artifacts/RequestTypesArtifact.ts`

**Add responseData to RequestType:**

```typescript
export interface RequestType {
    resourceName: string;    // Canonical name
    action: ActionType;      // Canonical action
    formTypeName: string;
    validationRules: ValidationRule[];
    
    // ✨ ADD: Response data (normalized for inline and Resource)
    responseData?: {
        fields: Record<string, SemanticType>;  // SAME untuk inline dan Resource
        isCollection: boolean;
        isPaginated?: boolean;
        source: 'resource' | 'inline';  // Metadata untuk debugging
    };
}
```

---

### STEP 3: Create Inline Response Normalizer

**File**: `packages/cli/src/generators/utils/inline-response-normalizer.ts` (NEW FILE)

```typescript
import type { ResponseFieldData, SemanticType } from '@routesync/core';

/**
 * Normalize inline response fields ke format SemanticType
 * 
 * Converts manifest ResponseFieldData → SemanticType yang sama
 * dengan Resource-based responses.
 */
export class InlineResponseNormalizer {
    /**
     * Detect dan normalize inline response dari manifest route
     */
    static normalizeRoute(route: ManifestRoute): ResponseData | undefined {
        // Case 1: Route has inline response
        if (route.response?.fields && Object.keys(route.response.fields).length > 0) {
            return {
                fields: this.convertFields(route.response.fields),
                isCollection: route.response.collection || false,
                isPaginated: route.response.paginated || false,
                source: 'inline'
            };
        }
        
        // Case 2: Route has Resource response (already handled elsewhere)
        if (route.response?.type) {
            // Resource-based responses dihandle oleh existing logic
            return undefined;
        }
        
        // Case 3: No response data
        return undefined;
    }
    
    /**
     * Convert manifest fields ke SemanticType format
     */
    private static convertFields(
        fields: Record<string, ResponseFieldData>
    ): Record<string, SemanticType> {
        const result: Record<string, SemanticType> = {};
        
        for (const [fieldName, fieldData] of Object.entries(fields)) {
            result[fieldName] = this.convertField(fieldData);
        }
        
        return result;
    }
    
    /**
     * Convert single field ke SemanticType
     */
    private static convertField(fieldData: ResponseFieldData): SemanticType {
        switch (fieldData.kind) {
            case 'primitive':
                return {
                    kind: 'primitive',
                    type: fieldData.type as PrimitiveType,
                    nullable: fieldData.nullable || false,
                    optional: fieldData.optional || false
                };
                
            case 'object':
                if (!fieldData.fields) {
                    throw new Error(`Object field missing 'fields' property`);
                }
                return {
                    kind: 'object',
                    fields: this.convertFields(fieldData.fields),
                    nullable: fieldData.nullable || false,
                    optional: fieldData.optional || false
                };
                
            case 'array':
                if (!fieldData.items) {
                    throw new Error(`Array field missing 'items' property`);
                }
                return {
                    kind: 'array',
                    items: this.convertField(fieldData.items),
                    nullable: fieldData.nullable || false,
                    optional: fieldData.optional || false
                };
                
            default:
                throw new Error(`Unknown field kind: ${(fieldData as any).kind}`);
        }
    }
}

// Types
interface ManifestRoute {
    path: string;
    method: string;
    action: string;
    resource?: string;
    controller?: string;
    response?: {
        type?: string;
        collection?: boolean;
        paginated?: boolean;
        fields?: Record<string, ResponseFieldData>;
    };
}

interface ResponseData {
    fields: Record<string, SemanticType>;
    isCollection: boolean;
    isPaginated?: boolean;
    source: 'resource' | 'inline';
}
```

---

### STEP 4: Create Canonical Name Generator

**File**: `packages/cli/src/generators/utils/canonical-name-generator.ts` (NEW FILE)

```typescript
/**
 * Generate canonical resource names dengan collision detection
 */
export class CanonicalNameGenerator {
    private usedNames = new Set<string>();
    
    /**
     * Generate canonical resource name dari route
     * 
     * Priority:
     * 1. Explicit route.resource
     * 2. Controller + Action
     * 3. Path-based (deterministik)
     */
    generate(route: ManifestRoute): string {
        // Priority 1: Explicit resource name
        if (route.resource) {
            return this.registerName(route.resource, route);
        }
        
        // Priority 2: Controller + Action (Laravel convention)
        if (route.controller && route.action) {
            const name = `${this.camelCase(route.controller)}${this.pascalCase(route.action)}`;
            return this.registerName(name, route);
        }
        
        // Priority 3: Path-based (deterministic)
        const pathName = this.generateFromPath(route.path);
        if (!pathName) {
            throw new Error(
                `Cannot derive resource name for route: ${route.method} ${route.path}`
            );
        }
        
        // Add method suffix untuk avoid collision
        const fullName = `${pathName}_${route.method.toLowerCase()}`;
        return this.registerName(fullName, route);
    }
    
    /**
     * Register name dan detect collision
     */
    private registerName(name: string, route: ManifestRoute): string {
        if (this.usedNames.has(name)) {
            throw new Error(
                `Resource name collision detected: '${name}' ` +
                `(route: ${route.method} ${route.path})`
            );
        }
        
        this.usedNames.add(name);
        return name;
    }
    
    /**
     * Generate name dari path
     */
    private generateFromPath(path: string): string {
        // Remove /api prefix
        let normalized = path.replace(/^\/api\/?/, '');
        
        // Remove path parameters
        normalized = normalized.replace(/\{[^}]+\}/g, '');
        
        // Split dan filter empty
        const segments = normalized.split('/').filter(s => s.length > 0);
        
        if (segments.length === 0) {
            return '';
        }
        
        // Convert to camelCase
        return segments
            .map((seg, idx) => 
                idx === 0 
                    ? seg.toLowerCase() 
                    : this.pascalCase(seg)
            )
            .join('');
    }
    
    private camelCase(str: string): string {
        return str.charAt(0).toLowerCase() + str.slice(1);
    }
    
    private pascalCase(str: string): string {
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }
}
```

---

### STEP 5: Integrate Normalization di Artifact Creation

**File**: Di mana artifact dibuat (perlu diidentifikasi via STEP 1)

**Pseudocode integration:**

```typescript
import { InlineResponseNormalizer } from './utils/inline-response-normalizer';
import { CanonicalNameGenerator } from './utils/canonical-name-generator';

function createRequestTypesArtifact(manifest: RouteManifest): RequestTypesArtifact {
    const requestTypes: RequestType[] = [];
    const nameGenerator = new CanonicalNameGenerator();
    
    for (const route of manifest.routes) {
        // Generate canonical resource name
        const resourceName = route.resource || nameGenerator.generate(route);
        
        // Normalize inline response (jika ada)
        const responseData = InlineResponseNormalizer.normalizeRoute(route);
        
        // Create request type
        const requestType: RequestType = {
            resourceName,
            action: route.action as ActionType,
            formTypeName: `${resourceName}Form`,
            validationRules: extractValidationRules(route),
            
            // ✨ Inline response sudah dinormalisasi di sini!
            responseData  // undefined jika tidak ada, atau normalized data
        };
        
        requestTypes.push(requestType);
    }
    
    return {
        requestTypes,
        version: '1.0.0'
    };
}
```

---

### STEP 6: ContractGeneratorPass - NO CHANGES NEEDED!

**File**: `packages/core/src/compiler/passes/ContractGeneratorPass.ts`

```typescript
// ✅ NO CHANGES! Pass tetap pure

private processResponseTypes(requestType: RequestType): ActionResponseSchema[] {
    if (!requestType.responseData) {
        return []; // Tidak ada response
    }
    
    // ✅ Proses SAMA untuk inline maupun Resource
    const fields = this.convertResponseFields(requestType.responseData.fields);
    
    if (requestType.responseData.isCollection) {
        return [this.responseActionBuilder.buildIndexSchema(
            requestType.resourceName, 
            fields
        )];
    } else {
        return [this.responseActionBuilder.buildShowSchema(
            requestType.resourceName,
            fields
        )];
    }
}
```

**Key Point**: Pass tidak tahu apakah response dari inline atau Resource. Semua sudah dinormalisasi di artifact!

---

## 🧪 Testing Strategy

### Test 1: Inline Response Normalization

```typescript
describe('InlineResponseNormalizer', () => {
    it('should normalize inline response to SemanticType format', () => {
        const route = {
            path: '/api/login',
            method: 'POST',
            action: 'store',
            response: {
                fields: {
                    success: { kind: 'primitive', type: 'boolean' },
                    data: {
                        kind: 'object',
                        fields: {
                            token: { kind: 'primitive', type: 'string' }
                        }
                    }
                }
            }
        };
        
        const normalized = InlineResponseNormalizer.normalizeRoute(route);
        
        expect(normalized).toBeDefined();
        expect(normalized!.source).toBe('inline');
        expect(normalized!.fields.success.kind).toBe('primitive');
        expect(normalized!.fields.data.kind).toBe('object');
    });
});
```

### Test 2: Canonical Name Generation

```typescript
describe('CanonicalNameGenerator', () => {
    it('should generate names without collision', () => {
        const generator = new CanonicalNameGenerator();
        const routes = [
            { path: '/api/users', method: 'GET', action: 'index' },
            { path: '/api/users/{id}', method: 'GET', action: 'show' },
            { path: '/api/users', method: 'POST', action: 'store' }
        ];
        
        const names = routes.map(r => generator.generate(r));
        const uniqueNames = new Set(names);
        
        expect(uniqueNames.size).toBe(names.length); // No duplicates
    });
    
    it('should detect collision', () => {
        const generator = new CanonicalNameGenerator();
        generator.generate({ path: '/api/users', method: 'GET', action: 'index' });
        
        expect(() => {
            generator.generate({ path: '/api/users', method: 'GET', action: 'index' });
        }).toThrow('collision');
    });
});
```

### Test 3: ContractGeneratorPass Unchanged

```typescript
describe('ContractGeneratorPass with inline responses', () => {
    it('should process inline response same as Resource response', () => {
        const inlineRequestType: RequestType = {
            resourceName: 'login',
            action: 'store',
            formTypeName: 'LoginForm',
            validationRules: [],
            responseData: {
                fields: {
                    success: { kind: 'primitive', type: 'boolean' },
                    message: { kind: 'primitive', type: 'string' }
                },
                isCollection: false,
                source: 'inline'
            }
        };
        
        const pass = new ContractGeneratorPass();
        const schemas = pass['processResponseTypes'](inlineRequestType);
        
        // ✅ Pass tidak tahu ini inline atau Resource
        expect(schemas).toHaveLength(1);
        expect(schemas[0].schemaName).toBe('loginShowSchema');
        expect(schemas[0].action).toBe('store');
    });
});
```

---

## 📊 Expected Results

### Before Implementation:
```
RequestTypesArtifact:
  - Routes dengan Resource: responseData = { fields, ... } ✅
  - Routes dengan inline: responseData = undefined ❌

ContractGeneratorPass:
  - Proses 6 resource responses ✅
  - Skip 29 inline responses ❌
  
Output:
  - 6 schemas (17%) ❌
```

### After Implementation:
```
RequestTypesArtifact:
  - Routes dengan Resource: responseData = { fields, source: 'resource' } ✅
  - Routes dengan inline: responseData = { fields, source: 'inline' } ✅
  - SAME FORMAT untuk kedua jenis ✅

ContractGeneratorPass:
  - Proses 6 resource responses ✅
  - Proses 29 inline responses ✅
  - Tidak tahu perbedaannya (by design) ✅
  
Output:
  - 35 schemas (100%) ✅
  - No collisions ✅
  - All type-safe ✅
```

---

## ✅ Implementation Checklist

### Phase 1: Foundation
- [ ] Create `InlineResponseNormalizer.ts`
- [ ] Create `CanonicalNameGenerator.ts`
- [ ] Extend `RequestTypesArtifact` interface dengan `responseData.source`
- [ ] Write unit tests untuk normalizer
- [ ] Write unit tests untuk name generator

### Phase 2: Integration
- [ ] Locate artifact creation point (STEP 1)
- [ ] Integrate normalizer di artifact creation
- [ ] Integrate name generator di artifact creation
- [ ] Add integration tests

### Phase 3: Validation
- [ ] Run dengan toko-online manifest
- [ ] Verify 29 inline response schemas generated
- [ ] Verify no regressions pada resource-based schemas
- [ ] Verify no name collisions
- [ ] Verify ContractGeneratorPass unchanged

---

## 🎯 Success Criteria

✅ **Implementation Complete When:**

1. Semua 29 inline response routes menghasilkan Zod schemas
2. Schemas muncul di `api-contract.ts` section "Response Schemas"
3. Resource-based schemas tetap berfungsi (no regressions)
4. ContractGeneratorPass **TIDAK DIUBAH SAMA SEKALI**
5. All tests passing
6. No TypeScript compilation errors
7. No name collisions detected

---

## 📝 Key Differences: Wrong vs Correct

| Aspect | Wrong Approach (Prev Doc) | Correct Approach (This Doc) |
|--------|---------------------------|------------------------------|
| **Architecture** | Pass reads manifest directly | Artifact normalization |
| **Layer** | Compilation + Parsing mixed | Clean separation |
| **Naming** | Guess from URL | Canonical from metadata |
| **Action** | Heuristic guessing | From route.action |
| **Schema Building** | Override after build | Correct builder call |
| **Dependencies** | require() in method | Proper import/inject |
| **Error Handling** | Warn and skip | Fail fast |
| **Collision** | Not detected | Detected and error |
| **Backward Compat** | API-level only | Pipeline-level |
| **Correctness** | Assumed from count | Guaranteed by type system |

---

## 🚀 Next Actions

1. **Immediate**: Locate artifact creation point (STEP 1)
2. **Create**: Normalizer dan NameGenerator utilities
3. **Integrate**: Di artifact creation boundary
4. **Test**: Unit + integration tests
5. **Validate**: Run dengan real manifest
6. **Verify**: No regressions + 100% coverage

---

**Status:** READY FOR CORRECT IMPLEMENTATION ✅  
**Complexity:** Medium (normalization di boundary)  
**Risk:** Low (isolated changes, pass unchanged)  
**Impact:** High (+83% coverage improvement)  
**Architecture:** Clean (proper layer separation)
