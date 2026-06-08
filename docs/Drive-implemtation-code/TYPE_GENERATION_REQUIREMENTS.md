# RouteSync Type Generation Requirements

## Problem: Mengapa `as any` Digunakan?

```typescript
// Line 1273 (generateObjectReadMapper):
return `(${parentAccessor} ? {\n${props.join('\n')}\n  } : undefined) as any`
```

### Root Cause

```
Interface Generation:
  export interface OrderDetailResourceTransformed {
    id: string
    produk: ProdukTransformed | undefined  ✅ Tipe sudah diketahui
    // ...
  }

Mapper Generation:
  export const toOrderDetailResourceRead = (api: ...): OrderDetailResourceTransformed => ({
    id: api.id,
    produk: (api.produk ? { id: ..., nama: ... } : undefined) as any  ❌ Cast anon object
    //                                                                    ^
    //                                         Compiler tidak bisa infer tipe
  })
```

**Masalah:** 
- Object literal `{ id: ..., nama: ... }` adalah tipe anonymous
- TypeScript tidak bisa otomatis match ke `ProdukTransformed`
- Generator butuh explicit type reference

---

## Requirements untuk Type-Safe Return

### Requirement 1: Know the Expected Type

```typescript
// Generator perlu tahu:
const expectedType = 'ProdukTransformed'  // Type name

// Baru bisa generate:
return `(${parentAccessor} ? { ... } : undefined) as ${expectedType}`
// atau
return `(${parentAccessor} ? { ... } : undefined) as const satisfies ${expectedType} | undefined`
```

### Requirement 2: Track Nested Type References

```typescript
// saat walk through nested objects:
if (kind === 'object' && meta.fields) {
  // Current: tidak track type reference
  // Required: track apa tipe dari object ini seharusnya
  
  const nestedTypeName = this.getNestedTypeName(meta)  // ← MISSING!
  // Contoh: "ProdukTransformed" dari meta.resource atau meta.model
}
```

### Requirement 3: Meta Information Structure

Generator butuh metadata yang cukup:

```typescript
// Meta harus contain:
{
  kind: 'object',        // ✅ Have
  fields: { ... },       // ✅ Have
  
  // ❌ MISSING - untuk nested type resolution:
  resource?: 'Produk',   // Jika nested dari resource
  model?: 'Produk',      // Jika nested dari model
  // atau
  typeName?: 'ProdukTransformed'  // Direct type reference
}
```

---

## Current Structure vs Required

### Current (Line 718-766: Interface Generation)

```typescript
// api-read.ts
export interface OrderDetailResourceTransformed {
  id: string
  produkItemId: string
  produk: ProdukTransformed | undefined     // ✅ Type reference ada
  qty: number
  // ...
}

export interface ProdukTransformed {
  id: string
  nama: string
  gambar: string
  imageUrl: string
}
```

### Current (Line 1273: Mapper Generation)

```typescript
// api-mapper.ts (CURRENT - as any)
export const toOrderDetailResourceRead = (api: OrderDetailResourceResponse): OrderDetailResourceTransformed => ({
  id: api.id,
  produk: (api.produk ? {
    id: api.produk.id,
    nama: api.produk.nama,
    gambar: api.produk.gambar,
    imageUrl: api.produk.image_url,
  } : undefined) as any,   // ❌ CAST NEEDED
})
```

**Problem:** 
- Interface know tipe adalah `ProdukTransformed | undefined`
- Tapi mapper tidak bisa reference interface saat generate object literal
- Solusi: cast ke `any`

---

## Solution: Type-Aware Generation

### Approach 1: Extract Type dari Interface Definition

```typescript
// Saat generate mapper, baca interface yang sudah di-generate
// dan extract type per field:

class MapperGenerator {
  private typeMap: Map<string, string> = new Map()
  
  // Build type map dari interface definition
  extractTypesFromInterface(interfaceDef: string): Map<string, string> {
    // Parse:
    // "export interface OrderDetailResourceTransformed {
    //    produk: ProdukTransformed | undefined"
    // 
    // Result: Map{ 'produk' -> 'ProdukTransformed | undefined' }
    
    const typeMap = new Map<string, string>()
    // regex: /(\w+):\s*([^,;]+)/g
    return typeMap
  }
  
  // Generate mapper dengan proper type per field
  generateMapperField(fieldName: string, value: string): string {
    const fieldType = this.typeMap.get(fieldName)
    if (fieldType) {
      return `${fieldName}: ${value} as ${fieldType}`
    }
    return `${fieldName}: ${value}`
  }
}
```

**Result:**
```typescript
export const toOrderDetailResourceRead = (api: ...): OrderDetailResourceTransformed => ({
  id: api.id as string,
  produk: (api.produk ? { ... } : undefined) as ProdukTransformed | undefined,  // ✅ Type-aware cast
})
```

### Approach 2: Generate Typed Constructors

```typescript
// Instead of:
produk: (api.produk ? { ... } : undefined) as any

// Generate:
produk: api.produk ? toProdukTransformed(api.produk) : undefined
```

**Requirements:**
- Setiap nested resource/model harus punya `to${Name}Transformed()` function
- Mapper reference function alih-alih inline object
- Automatic type-safe

**Result:**
```typescript
// api-mapper.ts
export const toOrderDetailResourceRead = (api: OrderDetailResourceResponse): OrderDetailResourceTransformed => ({
  id: api.id,
  produkItemId: api.produk_item_id,
  produk: api.produk ? toProdukTransformed(api.produk) : undefined,  // ✅ No cast needed!
  qty: api.qty,
})

// Helper:
function toProdukTransformed(api: ProdukResponse): ProdukTransformed {
  return {
    id: api.id,
    nama: api.nama,
    gambar: api.gambar,
    imageUrl: api.image_url,
  }
}
```

**Why This Works:**
- `toProdukTransformed()` return type adalah `ProdukTransformed`
- Compiler otomatis verify assignment
- Zero `as` casts needed

### Approach 3: Inline Type Assertions (Minimal Change)

```typescript
// Instead of:
} : undefined) as any

// Use:
} : undefined) as ReturnType<typeof extractProduk>
```

atau:

```typescript
// Metadata-driven:
} : undefined) satisfies ProdukTransformed | undefined
```

---

## Required Metadata Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Route/Model Analysis Phase                              │
│    Input: Laravel route dengan response type               │
├─────────────────────────────────────────────────────────────┤
│ ✅ Extract: response_type = "OrderDetailResource"          │
│ ✅ Extract: nested fields dan tipe mereka                  │
│ ❌ MISSING: Type references untuk nested objects           │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Type Definition Generation (api-read.ts)                │
│    Input: Resource metadata                                │
├─────────────────────────────────────────────────────────────┤
│ ✅ Generate: export interface OrderDetailResourceTransformed
│ ✅ Generate: export interface ProdukTransformed            │
│ ✅ KNOW: produk field has type ProdukTransformed | undefined
│    BUT: Generator tidak pass info ini ke mapper generator   │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Mapper Generation (api-mapper.ts)                        │
│    Input: Resource metadata (AGAIN - no type context!)     │
├─────────────────────────────────────────────────────────────┤
│ ❌ Lost: Tidak tahu produk harus type ProdukTransformed     │
│ ❌ Result: Generate { ... } as any                          │
│                                                              │
│ REQUIRED FIX:                                               │
│ - Pass type info dari step 2 ke step 3                      │
│ - Atau reference type dari interface yang sudah ada        │
│ - Atau use helper functions (to${Type}Transformed)        │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Requirement Summary

### Requirement R1: Type Context in generateObjectReadMapper()

```typescript
private static generateObjectReadMapper(
  rawMeta: any, 
  parentAccessor: string,
  expectedType?: string  // ← NEW PARAM: tipe yang diharapkan
): string {
  // Sekarang bisa generate dengan type:
  if (expectedType) {
    return `(${parentAccessor} ? { ... } : undefined) as ${expectedType}`
  }
  // fallback
  return `(${parentAccessor} ? { ... } : undefined) as any`
}
```

### Requirement R2: Track Type References While Generating

```typescript
// Saat generate interface fields (line 734):
const fieldType = this.getFieldType(col)  // "ProdukTransformed | undefined"

// Store reference:
this.fieldTypeMap.set('produk', 'ProdukTransformed | undefined')

// Later saat generate mapper:
const mappedVal = this.generateObjectReadMapper(
  fieldDef, 
  safeOriginal,
  this.fieldTypeMap.get(fieldName)  // Pass type!
)
```

### Requirement R3: Helper Function Strategy (Easiest)

```typescript
// When field is nested resource/model:
if (kind === 'resource' || kind === 'model') {
  const resourceName = meta.resource || meta.model
  // Generate:
  return `${parentAccessor} ? to${resourceName}Transformed(${parentAccessor}) : undefined`
  // ✅ No type cast needed! Compiler infers from function return type
}
```

**Why R3 is Best:**
- ✅ Existing function reference
- ✅ Type-safe by construction
- ✅ Easy to trace/debug
- ✅ Composable
- ✅ No metadata plumbing needed

---

## Practical Example: What Should Generate

### Input
```yaml
# Laravel Route
Route::get('/orders/{id}', 'OrderController@show')
  -> response: OrderDetailResource
  -> fields: {
      id, produk_item_id, 
      produk: { id, nama, gambar, image_url },
      qty, harga, subtotal
    }
```

### Generated (CURRENT - with as any)
```typescript
export interface OrderDetailResourceTransformed {
  id: string
  produkItemId: string
  produk: ProdukTransformed | undefined  ← Known type!
  qty: number
  // ...
}

export const toOrderDetailResourceRead = (api: OrderDetailResourceResponse): OrderDetailResourceTransformed => ({
  id: api.id,
  produk: (api.produk ? {           ← Anonymous object
    id: api.produk.id,
    nama: api.produk.nama,
    // ...
  } : undefined) as any,  ← CAST!
})
```

### Generated (REQUIRED - with proper typing)

**Option A: Type-aware cast**
```typescript
export const toOrderDetailResourceRead = (api: OrderDetailResourceResponse): OrderDetailResourceTransformed => ({
  id: api.id,
  produk: (api.produk ? {
    id: api.produk.id,
    nama: api.produk.nama,
    // ...
  } : undefined) as ProdukTransformed | undefined,  ✅ Reference interface type
})
```

**Option B: Helper functions (RECOMMENDED)**
```typescript
export const toOrderDetailResourceRead = (api: OrderDetailResourceResponse): OrderDetailResourceTransformed => ({
  id: api.id,
  produk: api.produk ? toProdukTransformed(api.produk) : undefined,  ✅ No cast!
})

function toProdukTransformed(api: ProdukResponse): ProdukTransformed {
  return {
    id: api.id,
    nama: api.nama,
    gambar: api.gambar,
    imageUrl: api.image_url,
  }
}
```

---

## Summary: Type Generation Requirements

| Aspect | Current | Required |
|--------|---------|----------|
| Interface type definition | ✅ Generated | ✅ Same |
| Nested object types | ✅ Defined | ❌ Not passed to mapper |
| Mapper generation | ✅ Works | ⚠️ Uses `as any` |
| Type safety | ❌ No | ✅ Yes |
| IDE support | ❌ No inference | ✅ Full inference |

**To achieve requirements, pick ONE:**

1. **Approach A**: Pass type context ke `generateObjectReadMapper()` → use `as ${expectedType}`
2. **Approach B**: Generate helper `to${Type}Transformed()` functions → compose them
3. **Approach C**: Use `satisfies` operator → validate shape at generation time

**Rekomendasi untuk Anasa:** 
- **Approach B (helpers)** paling clean, composable, dan maintainable
- Setiap mapper punya utility function yang type-checked
- Extensible untuk validators, transformations

---

## Code Changes Needed

### For Approach B (Recommended)

```typescript
// ZodTierGenerator.ts line 1262-1273

else if (kind === 'object' && meta.fields) {
  // Check if nested resource/model:
  if (meta.resource || meta.model) {
    const name = meta.resource || meta.model
    // Generate helper call instead of inline object:
    return `${parentAccessor} ? to${name}Transformed(${parentAccessor}) : undefined`
    // ✅ Done! No type cast needed
  }
  
  // For plain objects, use inline with type reference:
  const props: string[] = []
  // ... build props ...
  return `(${parentAccessor} ? {\n${props.join('\n')}\n  } : undefined) as const`
  // or reference the interface type if available
}
```

**Result:** Zero `as any` casts needed! 🎉
