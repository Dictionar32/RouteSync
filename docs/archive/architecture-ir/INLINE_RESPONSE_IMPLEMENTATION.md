# Implementasi Inline Response Objects Generation

## Status: SIAP IMPLEMENTASI ✅

Dokumen ini berisi langkah-langkah terstruktur untuk mengimplementasikan generasi schema Zod untuk inline response objects (29 routes yang saat ini 0% coverage).

---

## 🎯 Tujuan

Menghasilkan Zod schemas untuk inline response objects yang saat ini tidak digenerate, seperti:

```typescript
// CONTOH: login.post response
{
  success: boolean,
  message: string,
  data: {
    token: string,
    user: {
      id: number,
      name: string,
      email: string
    }
  }
}
```

**Target:** 29 routes dengan inline responses → generate schemas di `api-contract.ts`

---

## 📋 Analisis Infrastruktur Yang Ada

### ✅ Komponen yang Sudah Ada dan Berfungsi

1. **ResponseFieldParser** (`ResponseFieldParser.ts`)
   - ✅ Sudah bisa parse `ResponseFieldData` dari manifest
   - ✅ Sudah handle `kind: 'primitive' | 'object' | 'array'`
   - ✅ Sudah handle nested fields dan array items
   - ✅ Output: `ParsedResponseField[]`

2. **ResponseSchemaMapper** (`ResponseSchemaMapper.ts`)
   - ✅ Sudah bisa convert `ParsedResponseField[]` → Zod schema string
   - ✅ Sudah ada method `mapFieldsToZod()` yang siap digunakan
   - ✅ Sudah handle show (single) dan index (array) schemas

3. **NestedObjectSchemaBuilder** (`NestedObjectSchemaBuilder.ts`)
   - ✅ Sudah bisa build recursive `z.object()` schemas
   - ✅ Sudah handle nested objects dalam objects
   - ✅ Sudah apply nullable/optional modifiers

4. **ResponseActionBuilder** (`ResponseActionBuilder.ts`)
   - ✅ Sudah bisa build show/index schemas
   - ✅ Sudah terintegrasi dengan `ResponseSchemaMapper`
   - ✅ Output: `ActionResponseSchema[]`

5. **ContractGeneratorPass** (`ContractGeneratorPass.ts`)
   - ✅ Sudah ada method `processResponseTypes()`
   - ✅ Sudah ada method `convertResponseFields()`
   - ✅ Sudah bisa convert `SemanticType` → `ParsedResponseField`
   - ⚠️ **TAPI:** Hanya berjalan jika `requestType.responseData` ada
   - ❌ **MASALAH:** Inline responses tidak masuk ke `requestType.responseData`

6. **ContractCodeBuilder** (`ContractCodeBuilder.ts`)
   - ✅ Sudah bisa menerima `responseSchemas: ActionResponseSchema[]`
   - ✅ Sudah bisa build 4 sections dengan response schemas
   - ✅ Sudah terintegrasi sempurna

### ❌ Yang Belum Ada (Perlu Implementasi)

1. **Inline Response Extractor**
   - Belum ada komponen yang extract inline responses dari manifest
   - Belum ada yang membaca `route.response.fields` untuk routes non-Resource
   - Belum ada yang mengkonversi ke format yang bisa diproses

2. **Route-to-Response Mapper**
   - Belum ada yang map route → inline response data
   - Belum ada yang generate resource name untuk inline responses

---

## 🔍 Root Cause Analysis

### Mengapa Inline Responses Tidak Digenerate?

**Alur Sekarang:**

```
RequestTypesArtifact
  └── requestTypes[]
       └── responseData? (OPTIONAL)
            └── fields: Record<string, SemanticType>

ContractGeneratorPass.processResponseTypes()
  └── if (!requestType.responseData) return [] ❌
       └── STOP! Inline responses tidak masuk sini
```

**Masalah:**

1. `RequestTypesArtifact` hanya include `responseData` untuk routes yang menggunakan Laravel Resources
2. Inline responses dari manifest **TIDAK** masuk ke `RequestTypesArtifact.responseData`
3. Data inline response **ADA** di manifest (`route.response.fields`) tapi tidak diproses

**Solusi:**

Perlu extract inline responses **langsung dari manifest** di `ContractGeneratorPass`, tidak mengandalkan `RequestTypesArtifact.responseData`.

---

## 🛠️ Implementasi Plan

### Phase 1: Tambah Inline Response Extraction (CORE)

**File:** `ContractGeneratorPass.ts`

**Perubahan:**

1. Tambah import untuk manifest types
2. Tambah method baru: `extractInlineResponsesFromManifest()`
3. Modifikasi method `run()` untuk process inline responses
4. Tambah method helper: `generateResourceNameFromRoute()`

### Phase 2: Integrate ke Pipeline (INTEGRATION)

**File:** `ContractGeneratorPass.ts`

**Perubahan:**

1. Tambah parameter manifest ke constructor (optional untuk backward compatibility)
2. Store manifest reference di pass instance
3. Call inline response extraction di `run()` method
4. Merge inline response schemas dengan resource-based schemas

### Phase 3: Testing & Validation (QUALITY)

**File:** `__tests__/ContractGeneratorPass.test.ts`

**Perubahan:**

1. Tambah test cases untuk inline response extraction
2. Tambah test untuk resource name generation
3. Tambah integration test dengan mock manifest

---

## 📝 Implementasi Detail

### STEP 1: Tambah Interface Types

**File:** `packages/core/src/compiler/passes/ContractGeneratorPass.ts`

**Tambahkan di bagian atas file (setelah imports):**

```typescript
/**
 * Route data dari manifest untuk inline response extraction
 */
interface ManifestRoute {
    path: string;
    method: string;
    action: string;
    response?: {
        type?: string;
        collection?: boolean;
        fields?: Record<string, >; // ResponseFieldData format
    };
}

/**
 * Manifest structure (minimal interface)
 */
interface RouteManifest {
    routes: ManifestRoute[];
}
```

### STEP 2: Tambah Property ke Class

**File:** `packages/core/src/compiler/passes/ContractGeneratorPass.ts`

**Tambahkan di class `ContractGeneratorPass`:**

```typescript
export class ContractGeneratorPass
    implements CompilerPass<readonly ['RequestTypes'], readonly ['GeneratedContract']> {

    // ... existing properties ...

    /** Optional manifest reference for inline response extraction */
    private readonly manifest?: RouteManifest;

    /**
     * Create ContractGeneratorPass with dependency injection
     * 
     * @param deps - Optional dependency overrides for testing
     * @param manifest - Optional manifest for inline response extraction
     */
    constructor(
        deps?: {
            readonly schemaMapper?: ContractSchemaMapper;
            readonly actionGenerator?: ContractActionGenerator;
            readonly codeBuilder?: ContractCodeBuilder;
            readonly responseActionBuilder?: ResponseActionBuilder;
        },
        manifest?: RouteManifest
    ) {
        // ... existing constructor code ...
        this.manifest = manifest;
    }

    // ... rest of class ...
}
```

### STEP 3: Tambah Helper Method - Generate Resource Name

**File:** `packages/core/src/compiler/passes/ContractGeneratorPass.ts`

**Tambahkan method baru di class `ContractGeneratorPass`:**

```typescript
/**
 * Generate resource name dari route path dan action
 * 
 * Examples:
 * - /api/login + store → login
 * - /api/auth/register + store → register
 * - /api/checkout/process + store → checkoutProcess
 * - /api/payment/confirm/{id} + update → paymentConfirm
 * 
 * @param route - Route data from manifest
 * @returns Generated resource name (camelCase)
 */
private generateResourceNameFromRoute(route: ManifestRoute): string {
    // Remove /api prefix if exists
    let path = route.path.replace(/^\/api\/?/, '');
    
    // Remove path parameters like {id}, {userId}, etc
    path = path.replace(/\{[^}]+\}/g, '');
    
    // Split by slashes and filter empty
    const segments = path.split('/').filter(s => s.length > 0);
    
    // Convert to camelCase
    if (segments.length === 0) {
        // Fallback to action name if path is empty
        return route.action || 'unknown';
    }
    
    if (segments.length === 1) {
        // Single segment: just return it
        return segments[0];
    }
    
    // Multiple segments: camelCase them
    return segments
        .map((seg, idx) => 
            idx === 0 
                ? seg.toLowerCase() 
                : seg.charAt(0).toUpperCase() + seg.slice(1).toLowerCase()
        )
        .join('');
}
```

### STEP 4: Tambah Core Method - Extract Inline Responses

**File:** `packages/core/src/compiler/passes/ContractGeneratorPass.ts`

**Tambahkan method baru di class `ContractGeneratorPass`:**

```typescript
/**
 * Extract inline response schemas dari manifest routes
 * 
 * Process routes yang TIDAK menggunakan Laravel Resources,
 * tapi memiliki inline response objects di manifest.
 * 
 * @returns Array of response schemas untuk inline responses
 */
private extractInlineResponsesFromManifest(): ActionResponseSchema[] {
    // Early exit jika manifest tidak tersedia
    if (!this.manifest) {
        console.log('[ContractGeneratorPass] No manifest available for inline response extraction');
        return [];
    }

    const inlineSchemas: ActionResponseSchema[] = [];
    let processedCount = 0;
    let skippedCount = 0;

    console.log(`[ContractGeneratorPass] Scanning ${this.manifest.routes.length} routes for inline responses`);

    for (const route of this.manifest.routes) {
        // Skip jika tidak ada response data
        if (!route.response) {
            skippedCount++;
            continue;
        }

        // Skip jika tidak ada fields (berarti mungkin Resource-based)
        if (!route.response.fields) {
            skippedCount++;
            continue;
        }

        // Skip jika fields kosong
        const fieldKeys = Object.keys(route.response.fields);
        if (fieldKeys.length === 0) {
            skippedCount++;
            continue;
        }

        try {
            // Generate resource name dari route
            const resourceName = this.generateResourceNameFromRoute(route);

            console.log(
                `[ContractGeneratorPass] Processing inline response: ` +
                `${route.method} ${route.path} → ${resourceName}`
            );

            // Convert fields ke ParsedResponseField format
            const parsedFields = this.convertManifestFieldsToP arsedFields(
                route.response.fields
            );

            if (parsedFields.length === 0) {
                console.warn(
                    `[ContractGeneratorPass] No fields parsed for ${route.path}, skipping`
                );
                skippedCount++;
                continue;
            }

            // Determine action type dari route method dan action
            const action = this.determineActionType(route);

            // Build schema using ResponseActionBuilder
            const schema = this.responseActionBuilder.buildShowSchema(
                resourceName,
                parsedFields
            );

            // Override action jika perlu
            schema.action = action;

            inlineSchemas.push(schema);
            processedCount++;

            console.log(
                `[ContractGeneratorPass] ✓ Generated inline response schema: ` +
                `${schema.schemaName} (${parsedFields.length} fields)`
            );

        } catch (error) {
            console.error(
                `[ContractGeneratorPass] Failed to process inline response for ${route.path}:`,
                error
            );
            skippedCount++;
        }
    }

    console.log(
        `[ContractGeneratorPass] Inline response extraction complete: ` +
        `${processedCount} generated, ${skippedCount} skipped`
    );

    return inlineSchemas;
}
```

### STEP 5: Tambah Helper Methods

**File:** `packages/core/src/compiler/passes/ContractGeneratorPass.ts`

**Tambahkan methods helper:**

```typescript
/**
 * Convert manifest response fields ke ParsedResponseField format
 * 
 * Menggunakan ResponseFieldParser yang sudah ada.
 * 
 * @param fields - Record of field name to ResponseFieldData from manifest
 * @returns Array of ParsedResponseField
 */
private convertManifestFieldsToParsedFields(
    fields: Record<string, >
): ParsedResponseField[] {
    const parser = new (require('../generators/contract-generation/ResponseFieldParser').ResponseFieldParser)();
    const result: ParsedResponseField[] = [];

    for (const [fieldName, fieldData] of Object.entries(fields)) {
        try {
            const parsed = parser.parseField(fieldName, fieldData);
            result.push(parsed);
        } catch (error) {
            console.warn(
                `[ContractGeneratorPass] Failed to parse field ${fieldName}:`,
                error
            );
            // Skip field that fails parsing
        }
    }

    return result;
}

/**
 * Determine action type dari route method dan action
 * 
 * @param route - Route dari manifest
 * @returns Action type untuk schema
 */
private determineActionType(route: ManifestRoute): 'show' | 'index' | 'store' | 'update' | 'destroy' {
    // Jika collection response, biasanya index
    if (route.response?.collection) {
        return 'index';
    }

    // Map dari HTTP method + action
    const method = route.method.toUpperCase();
    const action = route.action?.toLowerCase() || '';

    // Explicit action mapping
    if (action.includes('index') || action.includes('list')) {
        return 'index';
    }
    if (action.includes('show') || action.includes('get')) {
        return 'show';
    }
    if (action.includes('store') || action.includes('create')) {
        return 'store';
    }
    if (action.includes('update') || action.includes('edit')) {
        return 'update';
    }
    if (action.includes('destroy') || action.includes('delete')) {
        return 'destroy';
    }

    // Fallback based on HTTP method
    switch (method) {
        case 'GET':
            return 'show'; // Default GET to show
        case 'POST':
            return 'store'; // Default POST to store
        case 'PUT':
        case 'PATCH':
            return 'update';
        case 'DELETE':
            return 'destroy';
        default:
            return 'show'; // Fallback
    }
}
```

### STEP 6: Integrate ke run() Method

**File:** `packages/core/src/compiler/passes/ContractGeneratorPass.ts`

**Modifikasi method `run()`:**

```typescript
public run(
    inputs: ResolveArtifacts<readonly ['RequestTypes']>
): ResolveArtifacts<readonly ['GeneratedContract']> {
    try {
        // Extract request types artifact
        const [requestTypesArtifact] = inputs;
        const requestTypes = requestTypesArtifact.requestTypes;

        console.log(`[ContractGeneratorPass] Processing ${requestTypes.length} request types`);

        // Early exit if no validation rules
        if (requestTypes.length === 0) {
            return this.buildEmptyArtifact();
        }

        // Process each request type (REQUEST SCHEMAS)
        const allContracts: Array<{ resourceName: string, actions: GeneratedContractAction[] }> = [];
        const warnings: string[] = [];
        let totalActions = 0;
        let zodSchemasCount = 0;
        let validatorsCount = 0;

        // Store response schemas (RESOURCE-BASED + INLINE)
        const allResponseSchemas: ActionResponseSchema[] = [];

        // ===== EXISTING: Process request types =====
        for (const requestType of requestTypes) {
            try {
                // Generate request actions
                const actions = this.processRequestType(requestType);

                allContracts.push({
                    resourceName: requestType.resourceName,
                    actions
                });

                totalActions += actions.length;
                zodSchemasCount += actions.length;
                validatorsCount += actions.length;

                // Process resource-based response types
                const responseSchemas = this.processResponseTypes(requestType);
                allResponseSchemas.push(...responseSchemas);

                console.log(
                    `[ContractGeneratorPass] ${requestType.resourceName}: ` +
                    `${actions.length} request actions, ${responseSchemas.length} resource response schemas`
                );

            } catch (error) {
                warnings.push(
                    `Failed to process ${requestType.formTypeName}: ${error instanceof Error ? error.message : String(error)}`
                );
            }
        }

        // ===== NEW: Extract inline response schemas =====
        console.log('[ContractGeneratorPass] ===== INLINE RESPONSE EXTRACTION =====');
        const inlineResponseSchemas = this.extractInlineResponsesFromManifest();
        allResponseSchemas.push(...inlineResponseSchemas);
        console.log(
            `[ContractGeneratorPass] Total response schemas: ` +
            `${allResponseSchemas.length} (${inlineResponseSchemas.length} inline)`
        );

        // Build final code (4 sections) - WITH ALL RESPONSE SCHEMAS
        const builtCode = this.codeBuilder.buildContractFile(allContracts, allResponseSchemas);

        console.log(`[ContractGeneratorPass] Generated ${allContracts.length} contracts with ${totalActions} actions`);
        console.log(`[ContractGeneratorPass] Generated ${allResponseSchemas.length} response schemas`);

        // Build artifact (existing code)
        const contractsInfo: GeneratedContractInfo[] = allContracts.map((contract, index) => ({
            name: contract.resourceName,
            schemaName: `${contract.resourceName}ContractSchema`,
            actions: contract.actions.map(a => ({
                name: a.name,
                zodSchema: a.schemaLines.join('\n'),
                validatorName: `validate${toPascalCase(contract.resourceName)}${this.capitalize(a.name)}`,
                fieldCount: a.fieldCount
            })),
            lineRange: [0, 0] as const
        }));

        const artifact = this.buildArtifact(
            builtCode,
            contractsInfo,
            totalActions,
            zodSchemasCount,
            validatorsCount,
            warnings
        );

        return [artifact];

    } catch (error) {
        throw new ContractGeneratorPassError(
            `Contract generation failed: ${error instanceof Error ? error.message : String(error)}`,
            error instanceof Error ? error : undefined
        );
    }
}
```

### STEP 7: Update CLI Integration

**File:** `packages/cli/src/generators/ManifestGenerator.ts` (atau file yang instantiate ContractGeneratorPass)

**Modifikasi instantiation:**

```typescript
// BEFORE:
const contractPass = new ContractGeneratorPass();

// AFTER: Pass manifest to constructor
const contractPass = new ContractGeneratorPass(
    undefined, // Use default dependencies
    manifest   // Pass manifest for inline response extraction
);
```

### STEP 8: Tambah Import yang Diperlukan

**File:** `packages/core/src/compiler/passes/ContractGeneratorPass.ts`

**Pastikan imports ini ada:**

```typescript
import { ResponseFieldParser, type ParsedResponseField, type ResponseFieldData } from '../generators/contract-generation/ResponseFieldParser';
```

---

## 🧪 Testing Plan

### Test Case 1: Resource Name Generation

**File:** `__tests__/ContractGeneratorPass.test.ts`

```typescript
describe('generateResourceNameFromRoute', () => {
    it('should generate name from single segment path', () => {
        const route = {
            path: '/api/login',
            method: 'POST',
            action: 'store'
        };
        
        const name = pass['generateResourceNameFromRoute'](route);
        expect(name).toBe('login');
    });

    it('should generate camelCase from multi-segment path', () => {
        const route = {
            path: '/api/checkout/process',
            method: 'POST',
            action: 'store'
        };
        
        const name = pass['generateResourceNameFromRoute'](route);
        expect(name).toBe('checkoutProcess');
    });

    it('should remove path parameters', () => {
        const route = {
            path: '/api/payment/confirm/{id}',
            method: 'PUT',
            action: 'update'
        };
        
        const name = pass['generateResourceNameFromRoute'](route);
        expect(name).toBe('paymentConfirm');
    });
});
```

### Test Case 2: Inline Response Extraction

**File:** `__tests__/ContractGeneratorPass.test.ts`

```typescript
describe('extractInlineResponsesFromManifest', () => {
    it('should extract inline response schema', () => {
        const manifest = {
            routes: [{
                path: '/api/login',
                method: 'POST',
                action: 'store',
                response: {
                    fields: {
                        success: { kind: 'primitive', type: 'boolean' },
                        message: { kind: 'primitive', type: 'string' },
                        data: {
                            kind: 'object',
                            fields: {
                                token: { kind: 'primitive', type: 'string' },
                                user: {
                                    kind: 'object',
                                    fields: {
                                        id: { kind: 'primitive', type: 'number' },
                                        name: { kind: 'primitive', type: 'string' }
                                    }
                                }
                            }
                        }
                    }
                }
            }]
        };

        const pass = new ContractGeneratorPass(undefined, manifest);
        const schemas = pass['extractInlineResponsesFromManifest']();

        expect(schemas).toHaveLength(1);
        expect(schemas[0].schemaName).toBe('loginShowSchema');
        expect(schemas[0].zodSchema).toContain('z.object');
        expect(schemas[0].zodSchema).toContain('success');
        expect(schemas[0].zodSchema).toContain('data');
    });

    it('should skip routes without response fields', () => {
        const manifest = {
            routes: [
                { path: '/api/test1', method: 'GET', action: 'index' },
                { path: '/api/test2', method: 'GET', action: 'show', response: {} },
                { path: '/api/test3', method: 'GET', action: 'show', response: { fields: {} } }
            ]
        };

        const pass = new ContractGeneratorPass(undefined, manifest);
        const schemas = pass['extractInlineResponsesFromManifest']();

        expect(schemas).toHaveLength(0);
    });
});
```

---

## ✅ Checklist Implementasi

### Phase 1: Core Implementation
- [ ] Tambah interface `ManifestRoute` dan `RouteManifest`
- [ ] Tambah property `manifest?: RouteManifest` ke class
- [ ] Update constructor untuk accept manifest parameter
- [ ] Implement `generateResourceNameFromRoute()` method
- [ ] Implement `convertManifestFieldsToParsedFields()` method
- [ ] Implement `determineActionType()` method
- [ ] Implement `extractInlineResponsesFromManifest()` method

### Phase 2: Integration
- [ ] Modifikasi `run()` method untuk call inline extraction
- [ ] Merge inline schemas dengan resource-based schemas
- [ ] Update CLI integration untuk pass manifest
- [ ] Tambah import `ResponseFieldParser`

### Phase 3: Testing
- [ ] Write tests untuk `generateResourceNameFromRoute()`
- [ ] Write tests untuk `extractInlineResponsesFromManifest()`
- [ ] Write integration test dengan mock manifest
- [ ] Test dengan toko-online manifest (29 routes)

### Phase 4: Validation
- [ ] Run generator dengan toko-online manifest
- [ ] Verify 29 inline response schemas generated
- [ ] Check api-contract.ts output
- [ ] Verify no regressions pada resource-based schemas

---

## 📊 Expected Results

### Before Implementation:
```
Response Schemas Generated:
- Resource-based: 6 schemas (100% of resources)
- Inline: 0 schemas (0% of 29 routes) ❌
- Total: 6 schemas
```

### After Implementation:
```
Response Schemas Generated:
- Resource-based: 6 schemas (100% of resources)
- Inline: 29 schemas (100% of inline routes) ✅
- Total: 35 schemas
```

### Coverage Improvement:
```
Before: 6/35 routes (17%) ❌
After:  35/35 routes (100%) ✅
Improvement: +83% coverage
```

---

## 🚀 Execution Order

1. **Implement core methods** (STEP 1-5) → 2 hours
2. **Integrate ke pipeline** (STEP 6-7) → 1 hour
3. **Add tests** (STEP 8 + Testing Plan) → 2 hours
4. **Run validation** → 30 minutes
5. **Fix issues & polish** → 30 minutes

**Total Estimated Time: 6 hours**

---

## 🎯 Success Criteria

✅ **Implementation Complete When:**

1. Semua 29 inline response routes menghasilkan Zod schemas
2. Schemas muncul di `api-contract.ts` section "Response Schemas"
3. Resource-based schemas tetap berfungsi (no regressions)
4. All tests passing
5. No TypeScript compilation errors

✅ **Quality Gates:**

1. Code coverage untuk new methods ≥ 80%
2. Integration test dengan real manifest passing
3. Generated schemas valid TypeScript
4. Schemas dapat digunakan untuk validation

---

## 📝 Notes

### Backwards Compatibility

Implementation ini **100% backward compatible**:

- Manifest parameter adalah **optional**
- Jika manifest tidak di-pass, inline extraction di-skip
- Resource-based extraction tetap berjalan normal
- No breaking changes ke existing API

### Performance Impact

- Inline extraction run 1x per generation
- Complexity: O(n) dimana n = jumlah routes
- Impact: Negligible (< 100ms untuk 100 routes)
- No caching needed untuk initial implementation

### Known Limitations

1. **Resource name conflicts:** Jika ada 2 routes generate sama resource name, schemas akan overwrite. Solusi: tambah route method ke name generation jika conflict detected.

2. **Complex nested validation:** Deep nested objects mungkin butuh custom validation rules yang tidak ada di manifest. Solusi: generate basic schemas, frontend dev bisa extend manual.

3. **Conditional responses:** Jika backend return different shapes berdasarkan condition, hanya 1 schema akan digenerate. Solusi: document limitation, atau support multiple schemas per route (future enhancement).

---

## 🔗 Related Files

**Files to Modify:**
- `packages/core/src/compiler/passes/ContractGeneratorPass.ts`
- `packages/cli/src/generators/ManifestGenerator.ts` (atau similar)

**Files to Reference:**
- `packages/core/src/compiler/generators/contract-generation/ResponseFieldParser.ts`
- `packages/core/src/compiler/generators/contract-generation/ResponseSchemaMapper.ts`
- `packages/core/src/compiler/generators/contract-generation/ResponseActionBuilder.ts`

**Test Files:**
- `packages/core/src/compiler/passes/__tests__/ContractGeneratorPass.test.ts`

---

## 📚 Additional Resources

- See `MANIFEST_COVERAGE_AUDIT.md` untuk detail 29 routes yang perlu inline schemas
- See `API_CONTRACT_KNOWN_LIMITATIONS.md` untuk context limitations sebelumnya
- See `ResponseActionBuilder.ts` untuk contoh schema building yang sudah berfungsi

---

**Status:** READY FOR IMPLEMENTATION ✅  
**Complexity:** Medium (6 hours estimated)  
**Risk:** Low (backward compatible, isolated changes)  
**Impact:** High (+83% coverage improvement)

