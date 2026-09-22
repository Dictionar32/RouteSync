# Phase 2: Root Cause Analysis - Nested Object Type Resolution

## 🔍 Discovery: Manifest Structure Analysis

**Status**: ✅ Evidence-based analysis complete

### Critical Finding

**OrderResource dalam manifest memiliki 3 TIPE nested object berbeda:**

1. **✅ NESTED OBJECT yang SUDAH FLATTEN** (WORKS):
   - `produk` field dalam `OrderDetailResource`
   - Type: `{ kind: 'object', fields: { ... } }`
   - Flattening: ✅ BERHASIL → `produkId`, `produkNama`, `produkGambar`

2. **❌ RESOURCE COLLECTION** (NOT FLATTENED):
   - `items` field dalam `OrderResource`
   - Type: `{ kind: 'static_method_call', resolved: { type: 'resource', resource: 'OrderDetailResource', collection: true } }`
   - Current output: `items: unknown`
   - Expected: `items: OrderDetailResourceTransformed[]` ATAU flatten semua items

3. **❌ NESTED OBJECT dengan RESOLVED TYPES** (NOT FLATTENED):
   - `promotion` field: `{ kind: 'object', fields: { code: {...}, discount_minor: {...} } }`
   - `shipping` field: `{ kind: 'object', fields: { nama: {...}, telepon: {...}, ... } }`
   - Current output: `promotionCode: unknown`, `shippingNama: unknown`
   - Expected: `promotionCode: string`, `shippingNama: string`

---

## 📋 Evidence: Manifest Structure

### ✅ OrderDetailResource.produk (WORKING)

```json
{
  "produk": {
    "kind": "object",
    "fields": {
      "id": {
        "kind": "property_access",
        "resolved": { "type": "number" }
      },
      "nama": {
        "kind": "property_access",
        "resolved": { "type": "string" }
      },
      "gambar": {
        "kind": "property_access",
        "resolved": { "type": "string" }
      },
      "image_url": {
        "kind": "property_access",
        "resolved": { "type": "string" }
      }
    }
  }
}
```

**Flattening result**: ✅
```typescript
produkId: number;
produkNama: string;
produkGambar: string;
produkImageUrl: string;
```

---

### ❌ OrderResource.items (NOT WORKING)

```json
{
  "items": {
    "kind": "static_method_call",
    "originalCode": "OrderDetailResource::collection($this->details)",
    "className": "OrderDetailResource",
    "name": "collection",
    "args": [...],
    "resolved": {
      "status": "resolved",
      "type": "resource",
      "resource": "OrderDetailResource",
      "collection": true,
      "confidence": 100
    }
  }
}
```

**Current output**: ❌
```typescript
items: unknown;
```

**Expected Phase 2 output**:
```typescript
// Option 1: Flatten semua items (sesuai Phase 2 prompt)
itemsId: number[];
itemsProdukItemId: number[];
itemsProdukId: number[];
itemsProdukNama: string[];
// ... dst

// Option 2: Keep as array of transformed resource
items: OrderDetailResourceTransformed[];
```

---

### ❌ OrderResource.promotion (NOT WORKING)

```json
{
  "promotion": {
    "kind": "object",
    "fields": {
      "code": {
        "kind": "nullsafe_property_access",
        "resolved": {
          "status": "resolved",
          "type": "string",
          "nullable": true,
          "confidence": 100
        }
      },
      "discount_minor": {
        "kind": "type_cast",
        "resolved": {
          "status": "resolved",
          "type": "number",
          "confidence": 100
        }
      }
    }
  }
}
```

**Current output**: ❌
```typescript
promotionCode: unknown;
promotionDiscountMinor: unknown;
```

**Expected output**: ✅
```typescript
promotionCode: string | null;
promotionDiscountMinor: number;
```

---

### ❌ OrderResource.shipping (NOT WORKING)

```json
{
  "shipping": {
    "kind": "object",
    "fields": {
      "nama": { "resolved": { "type": "string", "nullable": true } },
      "telepon": { "resolved": { "type": "string", "nullable": true } },
      "alamat": { "resolved": { "type": "string", "nullable": true } },
      "kota": { "resolved": { "type": "string", "nullable": true } },
      "kode_pos": { "resolved": { "type": "string", "nullable": true } }
    }
  }
}
```

**Current output**: ❌
```typescript
shippingNama: unknown;
shippingTelepon: unknown;
shippingAlamat: unknown;
shippingKota: unknown;
shippingKodePos: unknown;
```

**Expected output**: ✅
```typescript
shippingNama: string | null;
shippingTelepon: string | null;
shippingAlamat: string | null;
shippingKota: string | null;
shippingKodePos: string | null;
```

---

## 🎯 Root Cause Identification

### Why `produk` works but `promotion` and `shipping` don't?

**File**: `packages/cli/src/generators/utils/resource-flattening.ts`

**Evidence**: Lines 145-175

```typescript
function flattenField(
  ctx: FlatteningContext,
  parentKey: string,
  field: ResourceFieldKind
): void {
  // Handle primitive types
  if (field.kind === 'primitive') {
    const key = toCamelCase(`${parentKey}_${field.type}`)
    const primitiveType = PrimitiveTypeFactory.fromString(field.type)
    ctx.result.set(key, primitiveType)
    return
  }

  // Handle property_access - RESOLVES FROM field.resolved
  if (field.kind === 'property_access') {
    const propertyName = field.property || 'unknown'
    const key = toCamelCase(`${parentKey}_${propertyName}`)
    
    // ✅ WORKS: Uses field.resolved.type
    if (field.resolved?.type) {
      const primitiveType = PrimitiveTypeFactory.fromString(field.resolved.type)
      ctx.result.set(key, primitiveType)
    } else {
      ctx.result.set(key, new PrimitiveType('string'))
    }
    return
  }

  // Handle nested objects - RECURSIVE
  if (field.kind === 'object' && field.fields) {
    for (const [nestedName, nestedField] of Object.entries(field.fields)) {
      const nestedKey = `${parentKey}_${nestedName}`
      flattenField(ctx, nestedKey, nestedField)
    }
    return
  }

  // ❌ PROBLEM: Other kinds fall through to warning
  ctx.warnings.push(`Unhandled field kind: ${field.kind} for key ${parentKey}`)
}
```

### Analysis

1. **`produk` (OrderDetailResource)**: ✅
   - Fields are `property_access` kind
   - Each field has `resolved.type`
   - Flattening logic: `if (field.resolved?.type)` → ✅ WORKS

2. **`promotion` and `shipping` (OrderResource)**: ❌
   - Parent is `object` kind
   - Children are `nullsafe_property_access`, `type_cast`, etc.
   - **CRITICAL**: `flattenField()` recursively calls with `nestedField`
   - `nestedField.kind` is NOT `property_access` → falls through to warning
   - **Result**: Types not extracted, becomes `unknown`

3. **`items` (OrderResource)**: ❌
   - Field kind is `static_method_call`
   - Resolved type is `{ type: 'resource', resource: 'OrderDetailResource', collection: true }`
   - **CRITICAL**: Flattening logic does NOT handle `resource` type
   - **Result**: Completely ignored, becomes `unknown`

---

## 🐛 Bug Location

### Issue 1: Missing Handler for `nullsafe_property_access`, `type_cast`, etc.

**File**: `packages/cli/src/generators/utils/resource-flattening.ts`  
**Lines**: 145-175

**Problem**:
```typescript
// Only handles: 'primitive', 'property_access', 'object'
// Missing: 'nullsafe_property_access', 'type_cast', 'binary_expression', 'method_call', etc.
```

**Fix needed**:
```typescript
// Add handlers for all field kinds that have resolved types
if (field.kind === 'nullsafe_property_access') {
  // Extract from field.resolved.type
}

if (field.kind === 'type_cast') {
  // Extract from field.resolved.type
}

if (field.kind === 'binary_expression') {
  // Extract from field.resolved.type
}

// ... etc for all kinds
```

### Issue 2: Missing Handler for Resource Collections

**File**: `packages/cli/src/generators/utils/resource-flattening.ts`  
**Lines**: 145-175

**Problem**:
```typescript
// No handler for resolved type: 'resource'
if (field.resolved?.type === 'resource') {
  // What to do?
  // - Flatten all items? (Phase 2 expected)
  // - Keep as typed array? (items: OrderDetailResourceTransformed[])
}
```

---

## 🎯 Solution Strategy

### Option 1: Universal Type Extraction (RECOMMENDED)

**Instead of switching on `field.kind`, extract type from `field.resolved`:**

```typescript
function flattenField(
  ctx: FlatteningContext,
  parentKey: string,
  field: ResourceFieldKind
): void {
  // Handle nested objects - recurse first
  if (field.kind === 'object' && field.fields) {
    for (const [nestedName, nestedField] of Object.entries(field.fields)) {
      const nestedKey = `${parentKey}_${nestedName}`
      flattenField(ctx, nestedKey, nestedField)
    }
    return
  }

  // ✅ UNIVERSAL TYPE EXTRACTION
  if (field.resolved?.type) {
    const resolvedType = field.resolved.type
    
    // Handle primitive types (string, number, boolean)
    if (['string', 'number', 'boolean'].includes(resolvedType)) {
      const key = toCamelCase(parentKey)
      const primitiveType = PrimitiveTypeFactory.fromString(resolvedType)
      ctx.result.set(key, primitiveType)
      return
    }
    
    // Handle resource type
    if (resolvedType === 'resource') {
      const resourceName = field.resolved.resource
      const isCollection = field.resolved.collection
      // TODO: Decide flattening strategy for resources
      ctx.warnings.push(`Resource type found: ${resourceName} (collection: ${isCollection})`)
      return
    }
    
    // Handle model type
    if (resolvedType === 'model') {
      // Model references - keep as is or resolve?
      ctx.warnings.push(`Model type found: ${field.resolved.model}`)
      return
    }
  }

  // Fallback
  ctx.warnings.push(`Could not extract type for ${parentKey} (kind: ${field.kind})`)
}
```

### Option 2: Add Explicit Handlers (Current Approach Extension)

```typescript
// Add cases for each kind
if (field.kind === 'nullsafe_property_access') {
  return extractTypeFromResolved(field, parentKey, ctx)
}

if (field.kind === 'type_cast') {
  return extractTypeFromResolved(field, parentKey, ctx)
}

if (field.kind === 'binary_expression') {
  return extractTypeFromResolved(field, parentKey, ctx)
}

// ... 20+ more cases
```

**Problem**: Manifest has 20+ different `kind` values. Tedious and error-prone.

---

## 🔑 Recommended Fix

### Phase 2 Completion Strategy

**Priority 1**: Fix `promotion` and `shipping` nested objects
- Implement universal type extraction from `field.resolved`
- Works for ALL field kinds that have resolved types

**Priority 2**: Decide resource collection strategy
- `items: OrderDetailResourceTransformed[]` (keep as typed array)
- OR flatten items (complex, may need array handling)

**Priority 3**: Update tests
- Fix test expectations to match actual behavior
- Add tests for new field kinds

---

## 📝 Implementation Plan

### Step 1: Universal Type Extraction (30 min)

```typescript
// packages/cli/src/generators/utils/resource-flattening.ts

function extractPrimitiveType(field: ResourceFieldKind): SemanticType | null {
  // Try resolved type first
  if (field.resolved?.type) {
    const resolvedType = field.resolved.type
    if (['string', 'number', 'boolean'].includes(resolvedType)) {
      return PrimitiveTypeFactory.fromString(resolvedType)
    }
  }
  
  // Fallback to primitive kind
  if (field.kind === 'primitive') {
    return PrimitiveTypeFactory.fromString(field.type)
  }
  
  return null
}

function flattenField(
  ctx: FlatteningContext,
  parentKey: string,
  field: ResourceFieldKind
): void {
  // Handle nested objects - recurse
  if (field.kind === 'object' && field.fields) {
    for (const [nestedName, nestedField] of Object.entries(field.fields)) {
      const nestedKey = `${parentKey}_${nestedName}`
      flattenField(ctx, nestedKey, nestedField)
    }
    return
  }

  // Extract primitive type universally
  const primitiveType = extractPrimitiveType(field)
  if (primitiveType) {
    const key = toCamelCase(parentKey)
    ctx.result.set(key, primitiveType)
    return
  }

  // Handle resource references
  if (field.resolved?.type === 'resource') {
    // For now, keep as unknown - will implement in next step
    const key = toCamelCase(parentKey)
    ctx.warnings.push(`Resource reference: ${field.resolved.resource}`)
    return
  }

  // Unhandled
  ctx.warnings.push(`Could not flatten: ${parentKey} (kind: ${field.kind})`)
}
```

### Step 2: Test & Verify (15 min)

```bash
# Build
npm run build

# Test flattening utility
cd packages/cli && npm test -- resource-flattening

# Generate with updated code
cd /home/annas-zen/Documents/laragon-docker/www/toko-online
node /home/annas-zen/Documents/RouteSync/dist/cli.js generate \
  --manifest routesync.manifest.fresh6.json \
  --output test-output-phase2-fix \
  --zod

# Verify output
cat test-output-phase2-fix/types/api-read.ts | grep -A 20 "OrderResourceTransformed"
```

### Step 3: Validate Success (10 min)

**Expected output after fix**:

```typescript
export interface OrderResourceTransformed {
  id: number;
  status: string;
  totalHarga: number;
  invoiceNumber: string;
  paymentStatus: string | null;          // ✅ FIXED
  financialStatus: string | null;        // ✅ FIXED
  fulfillmentStatus: string | null;      // ✅ FIXED
  subtotalMinor: number;
  discountMinor: number;
  shippingMinor: number;
  taxMinor: number;
  totalHargaMinor: number;
  items: unknown;                        // ⚠️ Still needs decision
  promotionCode: string | null;         // ✅ FIXED
  promotionDiscountMinor: number;       // ✅ FIXED
  shippingNama: string | null;          // ✅ FIXED
  shippingTelepon: string | null;       // ✅ FIXED
  shippingAlamat: string | null;        // ✅ FIXED
  shippingKota: string | null;          // ✅ FIXED
  shippingKodePos: string | null;       // ✅ FIXED
  createdAt: string;
}
```

---

## ✅ Success Criteria

1. **`promotion` fields resolve correctly**: ✅ `string | null` and `number`
2. **`shipping` fields resolve correctly**: ✅ All `string | null`
3. **Tests pass**: ✅ (after fixing test expectations)
4. **No regressions**: ✅ `produk` flattening still works

---

## 🚀 Next Steps

1. Implement universal type extraction
2. Test with toko-online manifest
3. Decide strategy for `items` (resource collections)
4. Update documentation

**Estimated time**: 1 hour total

---

**Date**: 2026-08-07  
**Status**: Root cause identified, solution designed  
**Next**: Implementation
