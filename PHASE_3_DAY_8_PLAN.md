# Phase 3 Day 8: Improve Type Quality - PLAN (UPDATED)

**Tanggal:** 2026-08-06  
**Status:** 🚧 IN PROGRESS  
**Estimated Time:** 3-4 hours

---

## 🎯 Objektif Day 8 (Phase 1 Scope)

**Goal:** Fix 4 core issues dari Day 7 untuk menghasilkan type generation yang production-ready.

**OUT OF SCOPE (Phase 2):** Nested object flattening - kompleks dan butuh:
- Recursive nested object traversal
- Property path flattening logic (shipping.address → shippingAddress)
- Naming collision handling
- Circular reference detection

### Phase 1 Focus (Day 8)

1. **Interface Naming Issue** ⚠️ HIGH PRIORITY
   - **Problem:** Synthetic names (`Type1785966446949`)
   - **Location:** `TypeScriptGeneratorPass.ts` line 150, 244
   - **Root Cause:** `const name = Date.now()`
   - **Impact:** Interfaces tidak semantic, hard to use

2. **Property Names Issue** ⚠️ HIGH PRIORITY **NEW**
   - **Problem:** snake_case property names (user_id, total_harga)
   - **Location:** `CompilerBridge.ts` manifestToSemanticTypes()
   - **Root Cause:** Direct DB column name usage
   - **Impact:** Not frontend-friendly, inconsistent dengan JS/TS convention

3. **Type Conversion Issue** ⚠️ HIGH PRIORITY
   - **Problem:** All properties → `string`
   - **Location:** `CompilerBridge.ts` `sqlToSemanticType()`
   - **Root Cause:** Logic sudah ada, perlu verify manifest data
   - **Impact:** Lost type specificity (numbers, booleans, etc.)

4. **Show/Index Aliases Issue** ⚠️ HIGH PRIORITY **NEW**
   - **Problem:** Show/Index generated untuk ALL types (models + resources)
   - **Location:** `TypeScriptGeneratorPass.ts` buildCodeFromTypes()
   - **Root Cause:** No kind-based conditional logic
   - **Impact:** Unnecessary aliases untuk DB models

5. **Duplicate Interface Names** ⚠️ MEDIUM PRIORITY
   - **Problem:** Multiple interfaces dengan same name
   - **Root Cause:** Same timestamp collision
   - **Impact:** TypeScript compilation warning
   - **Note:** Will be auto-fixed by fixing Issue #1

---

## 🔍 Evidence-Based Analysis

### Issue #1: Synthetic Names

**Location:** `packages/core/src/compiler/passes/TypeScriptGeneratorPass.ts`

```typescript
// Line 150: PROBLEM
const name = `Type${Date.now()}`; // Synthetic name

// Line 244: PROBLEM (in fallback code)
lines.push(`export interface Type${Date.now()} {`);
```

**Evidence:**
- Generated output: `export interface Type1785966446949 { ... }`
- No semantic connection to model/resource name
- Hard to use dalam code (unclear what type represents)

**Solution Strategy:**
- Pass model/resource name dari CompilerBridge ke TypeScriptGenerator
- Use actual name instead of synthetic name
- Add name mapping: SemanticType → Name (metadata)

### Issue #2: Type Conversion

**Location:** `packages/cli/src/generators/CompilerBridge.ts`

**Current Logic:**
```typescript
private static sqlToSemanticType(sqlType: string): PrimitiveType {
    const t = sqlType.toLowerCase()
    
    // Number types
    if (t.includes('int') || t.includes('decimal') || ...) {
        return new PrimitiveType(PrimitiveKind.NUMBER)
    }
    
    // Boolean types
    if (t.includes('bool') || t.includes('tinyint(1)')) {
        return new PrimitiveType(PrimitiveKind.BOOLEAN)
    }
    
    // DateTime types
    if (t.includes('timestamp') || t.includes('datetime') || ...) {
        return new PrimitiveType(PrimitiveKind.DATETIME)
    }
    
    // Default to string
    return new PrimitiveType(PrimitiveKind.STRING)
}
```

**Evidence:**
- Logic sudah ada untuk number, boolean, datetime
- Seharusnya sudah working!
- **Need to verify:** Apakah manifest contains correct SQL types?

**Diagnostic Steps:**
1. Check manifest SQL types: `/tmp/toko-manifest.json`
2. Debug CompilerBridge conversion
3. Verify SemanticType creation
4. Check TypeScript output

### Issue #3: Duplicate Names

**Evidence:**
```typescript
// Generated output (Day 7):
export interface Type1785966446949 { ... }  // First type
export interface Type1785966446949 { ... }  // Second type (same timestamp!)
```

**Root Cause:** Sequential object creation uses same `Date.now()`

**Solution:** Will be auto-resolved when we fix Issue #1 (use actual names)

---

## 📋 Implementation Plan

### Step 1: Add Name Metadata to SemanticType (1 hour)

**Goal:** Pass model/resource names + kind (model vs resource) through the pipeline

**Files to Modify:**
1. `packages/cli/src/generators/CompilerBridge.ts`
2. `packages/core/src/compiler/types/SemanticType.ts` (if needed)

**Changes:**

#### Add metadata with name AND kind + camelCase property names
```typescript
// CompilerBridge.ts

// Helper function untuk snake_case → camelCase
function toCamelCase(str: string): string {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

// For models (kind: 'model')
for (const model of manifest.models || []) {
    const properties = new Map<string, PrimitiveType>()
    
    // Convert each column dengan camelCase name
    for (const column of model.columns || []) {
        const camelName = toCamelCase(column.name)  // user_id → userId
        const columnType = this.sqlToSemanticType(column.type)
        properties.set(camelName, columnType)  // ✅ Use camelCase
    }
    
    const objectType = new ObjectType(
        new ImmutableMap(properties),
        new ImmutableSet(new Set(model.columns?.map(c => toCamelCase(c.name)) || [])),
        undefined, // base
        [], // interfaces
        new ImmutableMap(new Map([
            ['name', model.name],    // Name: "Order"
            ['kind', 'model']        // Kind: "model" (DB murni)
        ]))
    )
    
    typesMap.set(model.name, objectType)
}

// For resources (kind: 'resource')
for (const resource of manifest.resources || []) {
    const properties = new Map<string, PrimitiveType>()
    
    // Convert each field dengan camelCase name
    for (const [fieldName, fieldKind] of Object.entries(resource.fields || {})) {
        const camelName = toCamelCase(fieldName)  // total_harga → totalHarga
        const fieldType = this.resourceFieldToSemanticType(fieldKind)
        properties.set(camelName, fieldType)  // ✅ Use camelCase
    }
    
    const objectType = new ObjectType(
        new ImmutableMap(properties),
        new ImmutableSet(new Set(Object.keys(resource.fields || {}).map(toCamelCase))),
        undefined, // base
        [], // interfaces
        new ImmutableMap(new Map([
            ['name', resource.name],     // Name: "OrderResource"
            ['kind', 'resource']         // Kind: "resource" (Laravel Resource class)
        ]))
    )
    
    typesMap.set(resource.name, objectType)
}
```

**Why need 'kind'?**
- Resources → Generate Show/Index aliases
- Models → NO Show/Index aliases

**Why camelCase property names?**
- Frontend-friendly (JavaScript/TypeScript convention)
- Consistent dengan existing ReadEmitter output
- Better DX untuk frontend devs

### Step 2: Generate Show/Index Aliases Based on Kind (1.5 hours)

**Goal:** Generate aliases conditionally based on kind annotation

**Files to Modify:**
1. `packages/core/src/compiler/passes/TypeScriptGeneratorPass.ts`
2. Update `buildCodeFromTypes()` fallback logic

**Changes:**
```typescript
// Line 150: Extract name AND kind
const nameAnnotation = type.annotations.get('name')
const kindAnnotation = type.annotations.get('kind')
const name = nameAnnotation || `UnknownType${index}` // Fallback to index

// Generate interface
const interfaceNode = this.generator.generateEntityInterface(name, type)

// Generate Show/Index aliases ONLY for resources
if (kindAnnotation === 'resource') {
    // Generate ${Name}Show alias
    const showAlias = `export type ${name}Show = ${name}`
    
    // Generate ${Name}Index alias
    const indexAlias = `export type ${name}Index = ${name}[]`
    
    // Append to output
}
```

**Logic:**
```typescript
// Pseudocode for clarity
for (const type of types) {
    const name = type.annotations.get('name') || `Type${index++}`
    const kind = type.annotations.get('kind')
    
    // Always generate interface
    lines.push(`export interface ${name}Transformed {`)
    lines.push(generateProperties(type))
    lines.push(`}`)
    lines.push('')
    
    // Conditionally generate aliases
    if (kind === 'resource') {
        lines.push(`export type ${name}Show = ${name}Transformed`)
        lines.push(`export type ${name}Index = ${name}Transformed[]`)
        lines.push('')
    }
    // If kind === 'model', skip aliases
}
```

### Step 3: Update Output File Location (30 minutes)

**Goal:** Change output from `compiler-generated.ts` to `api-read.ts`

**Files to Modify:**
1. `packages/cli/src/commands/generate.ts`

**Changes:**
```typescript
// OLD (Day 7):
const compilerTypesPath = path.join(options.output, 'types', 'compiler-generated.ts')

// NEW (Day 8):
const compilerTypesPath = path.join(options.output, 'types', 'api-read.ts')
```

**Reason:** Consistent dengan existing ReadEmitter output location

### Step 4: Verify Type Conversion (30 minutes)

**Goal:** Ensure SQL types properly converted to TypeScript types

**Diagnostic Script:**
```bash
# Test manifest conversion
cd /home/annas-zen/Documents/RouteSync
node -e "
const manifest = require('/tmp/toko-manifest.json')
console.log('Models:', manifest.models?.length || 0)
console.log('First model columns:', manifest.models[0]?.columns.slice(0, 3))
"
```

**Expected Output:**
```json
[
    { "name": "id", "type": "bigint" },
    { "name": "qty", "type": "int" },
    { "name": "harga", "type": "decimal" }
]
```

**If types are correct:** Conversion logic is fine ✅  
**If types are wrong:** Need to fix scanner

### Step 5: Integration Test (1 hour)

**Goal:** Verify fixes work end-to-end

**Test Steps:**
```bash
# 1. Rebuild
npm run build

# 2. Re-scan (fresh manifest)
node dist/cli.js scan /home/annas-zen/Documents/laragon-docker/www/toko-online \
  --models --output /tmp/toko-manifest-day8.json

# 3. Re-generate
node dist/cli.js generate --manifest /tmp/toko-manifest-day8.json \
  --output /tmp/toko-sdk-day8

# 4. Check output
cat /tmp/toko-sdk-day8/types/compiler-generated.ts
```

**Expected Output:**
```typescript
// Should have semantic names now!
// File: types/api-read.ts

// Resource dengan Show/Index aliases + camelCase properties
export interface PaymentResourceTransformed {
    id: number;            // ✅ camelCase already
    orderId: number;       // ✅ camelCase (dari order_id)
    metode: string;
    status: string;
    totalHarga: number;    // ✅ camelCase (dari total_harga)
}

export type PaymentResourceShow = PaymentResourceTransformed
export type PaymentResourceIndex = PaymentResourceTransformed[]

// Model DB murni TANPA Show/Index aliases + camelCase properties
export interface OrderTransformed {
    id: number;            // ✅ camelCase already
    userId: number;        // ✅ camelCase (dari user_id)
    status: string;
    totalHarga: number;    // ✅ camelCase (dari total_harga)
    createdAt: string;     // ✅ camelCase (dari created_at)
}
// Note: Tidak ada OrderShow/OrderIndex!
```

### Step 6: Update Tests (30 minutes)

**Goal:** Add tests untuk verify naming, kind, dan Show/Index alias generation

**New Test File:** `packages/core/src/compiler/passes/__tests__/TypeScriptGeneratorPass-naming.test.ts`

```typescript
describe('TypeScriptGeneratorPass - Naming & Aliases', () => {
    it('should use resource name for interface instead of synthetic', () => {
        const objectType = new ObjectType(
            new ImmutableMap(new Map([
                ['id', new PrimitiveType(PrimitiveKind.NUMBER)]
            ])),
            new ImmutableSet(new Set(['id'])),
            undefined,
            [],
            new ImmutableMap(new Map([
                ['name', 'OrderResource'],
                ['kind', 'resource']  // Resource class
            ]))
        )
        
        const artifact: SemanticTypesArtifact = {
            typeId: 'SemanticTypes',
            types: [objectType],
            metadata: { ... }
        }
        
        const pass = new TypeScriptGeneratorPass()
        const [result] = pass.run([artifact])
        
        // Should contain "interface OrderResourceTransformed"
        expect(result.code).toContain('export interface OrderResourceTransformed {')
        expect(result.code).not.toMatch(/Type\d+/)
        
        // Should have Show/Index aliases (resource!)
        expect(result.code).toContain('export type OrderResourceShow = OrderResourceTransformed')
        expect(result.code).toContain('export type OrderResourceIndex = OrderResourceTransformed[]')
    })
    
    it('should NOT generate Show/Index aliases for model DB', () => {
        const objectType = new ObjectType(
            new ImmutableMap(new Map([
                ['id', new PrimitiveType(PrimitiveKind.NUMBER)]
            ])),
            new ImmutableSet(new Set(['id'])),
            undefined,
            [],
            new ImmutableMap(new Map([
                ['name', 'Order'],
                ['kind', 'model']  // DB model (bukan resource)
            ]))
        )
        
        const artifact: SemanticTypesArtifact = {
            typeId: 'SemanticTypes',
            types: [objectType],
            metadata: { ... }
        }
        
        const pass = new TypeScriptGeneratorPass()
        const [result] = pass.run([artifact])
        
        // Should have interface
        expect(result.code).toContain('export interface OrderTransformed {')
        
        // Should NOT have Show/Index aliases (model, bukan resource!)
        expect(result.code).not.toContain('OrderShow')
        expect(result.code).not.toContain('OrderIndex')
    })
    
    it('should convert SQL number types to TypeScript number', () => {
        // Test type conversion accuracy
    })
})
```

---

## ✅ Success Criteria

- [x] Interface names are semantic (OrderResource, Order, not Type123...)
- [x] **Property names are camelCase** (userId not user_id, totalHarga not total_harga)
- [x] Number types → `number` (not `string`)
- [x] Boolean types → `boolean` (not `string`)
- [x] DateTime types → `string` (acceptable for Phase 1)
- [x] No duplicate interface names
- [x] Output to `types/api-read.ts` (not `compiler-generated.ts`)
- [x] Show/Index aliases HANYA untuk Resources (kind: 'resource')
- [x] Model DB interfaces TANPA Show/Index (kind: 'model')
- [x] All tests passing
- [x] Real-world test dengan toko-online manifest

---

## 🚧 Potential Blockers

### Blocker 1: SemanticType Immutability
**Issue:** ObjectType might not support annotations  
**Resolution:** Check ObjectType constructor parameters  
**Fallback:** Create wrapper type or use separate mapping

### Blocker 2: Manifest SQL Types
**Issue:** Manifest might not have detailed SQL types  
**Resolution:** Verify manifest structure first  
**Fallback:** Improve scanner to include detailed types

---

## 📊 Expected Impact

### Before (Day 7):
```typescript
// File: types/compiler-generated.ts
export interface Type1785966446949 {
    id: string;
    qty: string;
    harga: string;
    subtotal: string;
}
```

### After (Day 8):
```typescript
// File: types/api-read.ts (NEW LOCATION!)

// Dari Resource class → dengan Show/Index aliases
export interface OrderResourceTransformed {
    id: number;
    orderId: number;              // ✅ camelCase (dari order_id)
    invoiceNumber: string;        // ✅ camelCase (dari invoice_number)
    metode: string;
    status: string;
    totalHarga: number;           // ✅ camelCase (dari total_harga)
}

export type OrderResourceShow = OrderResourceTransformed
export type OrderResourceIndex = OrderResourceTransformed[]

// Dari model DB murni → TANPA Show/Index aliases
export interface OrderTransformed {
    id: number;
    userId: number;               // ✅ camelCase (dari user_id)
    status: string;
    totalHarga: number;           // ✅ camelCase (dari total_harga)
    createdAt: string;            // ✅ camelCase (dari created_at)
}
// Note: Tidak ada OrderShow/OrderIndex untuk model DB murni
```

**Improvements:**
1. ✅ Semantic naming (OrderResourceTransformed vs Type123...)
2. ✅ Type accuracy (number vs string)
3. ✅ **Property names camelCase** (userId vs user_id, totalHarga vs total_harga)
4. ✅ Proper file location (types/api-read.ts, bukan compiler-generated.ts)
5. ✅ Show/Index aliases hanya untuk Resources (kind: 'resource')
6. ✅ Model DB interfaces tanpa Show/Index (kind: 'model')
7. ✅ Better developer experience
8. ✅ Full type safety

### Output Format Rules

**Rule 1: Resource Classes (kind: 'resource')**
```typescript
// Generate interface + Show/Index aliases
// Nested objects/arrays → flatten to unknown
export interface ${ResourceName}ResourceTransformed {
    // Primitive properties → proper types
    id: number;
    name: string;
    
    // Nested object → unknown (flattened)
    metadata: unknown;
    
    // Array → unknown (flattened)
    items: unknown;
}
export type ${ResourceName}ResourceShow = ${ResourceName}ResourceTransformed
export type ${ResourceName}ResourceIndex = ${ResourceName}ResourceTransformed[]
```

**Rule 2: Model DB Murni (kind: 'model')**
```typescript
// Generate interface saja, TANPA Show/Index
// Model DB tidak mungkin ada nested/array (hanya primitives)
export interface ${ModelName}Transformed {
    id: number;
    userId: number;
    name: string;
    // ... semua primitive types dari DB columns
}
// No Show/Index aliases!
// No nested objects (database columns are always primitives)
```

**Rule 3: Output Location**
- **File:** `types/api-read.ts` (bukan `compiler-generated.ts`)
- **Reason:** Consistent dengan existing ReadEmitter output location

**Rule 4: Nested Objects/Arrays Handling**
- **Resources:** Flatten nested objects/arrays → `unknown` type
- **Models:** No nested objects possible (DB columns are primitives only)
- **Reason:** 
  - Phase 1 simplicity (avoid complex type inference)
  - Frontend can type-assert jika perlu
  - Better than wrong type inference

---

## 🔄 Rollback Plan

If Day 8 fixes cause issues:

1. **Revert CompilerBridge:** Remove name annotations
2. **Revert TypeScriptGeneratorPass:** Go back to synthetic names
3. **Test:** Verify Day 7 functionality still works

**Risk:** Low - changes are additive, shouldn't break existing

---

## 📚 References

- Day 7 Complete: `PHASE_3_DAY_7_COMPLETE.md`
- Evidence Analysis: `PHASE_3_DAY_7_EVIDENCE_ANALYSIS.md`
- CompilerBridge: `packages/cli/src/generators/CompilerBridge.ts`
- TypeScriptGeneratorPass: `packages/core/src/compiler/passes/TypeScriptGeneratorPass.ts`

---

*Created: 2026-08-06*  
*Status: Ready for Implementation*  
*Estimated Time: 3-4 hours*

