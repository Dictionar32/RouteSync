# Nested Mapping Pattern Analysis

## Pattern yang Kamu Gunakan (PROPER)

```typescript
export const toApiRead = (api: PromoApiResponse): PromoShow => {
    return {
        // Flat structure - tidak nested objects
        id: api.id,
        promoCode: api.promotion.code,              // ← Nested field flattened
        promoDiscountMinor: api.promotion.discount_minor,
        
        // Single-level fields
        status: api.status,
        totalHargaMinor: api.total_harga_minor,
        
        // Nested objects dari shipping
        shippingAlamat: api.shipping.alamat,        // ← Nested field flattened
        shippingKota: api.shipping.kota,
        shippingKodePos: api.shipping.kode_pos,
        
        // Array inline mapping
        items: api.items.map(item => ({             // ← No helper function
            produkId: item.produk.id,                // ← Nested access inline
            produkNama: item.produk.nama,
            qty: item.qty,
            subtotal: item.subtotal,
        })),
    }
}
```

### Keuntungan Pattern Ini

✅ **Zero `as any`** - return type `PromoShow` otomatis inferred  
✅ **Flat structure** - lebih mudah dibaca, tidak nested objects  
✅ **Type-safe** - compiler knows setiap field type  
✅ **Composable** - array mapping inline  
✅ **Maintainable** - tidak perlu separate helpers  
✅ **IDE support** - perfect auto-complete  

---

## vs Pattern Sebelumnya (PROBLEMATIC)

```typescript
// RouteSync current (with nested objects):
produk: (api.produk ? {
    id: api.produk.id,
    nama: api.produk.nama,
    gambar: api.produk.gambar,
} : undefined) as any,  ❌ Nested object + cast

// Better (your pattern - flat):
produkId: api.produk.id,
produkNama: api.produk.nama,
produkGambar: api.produk.gambar,  ✅ Flat + type-safe
```

---

## Type Definition Structure untuk Pattern Flat

```typescript
// types/promo-read.ts

// Flat interface definition
export interface PromoShow {
    id: string
    promoCode: string                    // ← From api.promotion.code
    promoDiscountMinor: number           // ← From api.promotion.discount_minor
    
    status: string
    totalHargaMinor: number
    
    shippingAlamat: string               // ← From api.shipping.alamat
    shippingKota: string
    shippingKodePos: string
    shippingNama: string
    shippingTelepon: string
    
    items: Array<{
        produkId: string
        produkItemId: string
        produkNama: string
        produkGambar: string
        produkImageUrl: string
        qty: number
        harga: number
        subtotal: number
    }>
}

export type PromoIndex = PromoShow[]
```

**Key difference:**
- Interface FLAT (no nested PromoTransformed, ShippingTransformed)
- All fields at top level dengan prefix (promo*, shipping*, produk*)
- Array items typed inline

---

## How RouteSync Should Generate This

### Current Approach (WRONG)

```typescript
// Generates nested objects:
export interface OrderDetailResourceTransformed {
  id: string
  produk: ProdukTransformed | undefined  // ← Nested object type
  qty: number
}

export const toOrderDetailResourceRead = (...) => ({
  produk: (api.produk ? { ... } : undefined) as any  ← Nested + cast
})
```

### Correct Approach (YOUR PATTERN)

```typescript
// Should generate FLAT:
export interface OrderDetailResourceTransformed {
  id: string
  produkId: string                // ← Flattened from api.produk.id
  produkNama: string
  produkGambar: string
  qty: number
}

export const toOrderDetailResourceRead = (...) => ({
  id: api.id,
  produkId: api.produk?.id,      // ← Direct field access
  produkNama: api.produk?.nama,
  produkGambar: api.produk?.gambar,
  qty: api.qty,
})
```

---

## Generation Strategy untuk Nested Fields

### Strategy: Flatten at Interface Level

```typescript
// When meta contains nested resource/model:
{
  kind: 'object',
  fields: {
    produk: {
      kind: 'resource',
      resource: 'Produk',
      fields: {
        id: { type: 'string' },
        nama: { type: 'string' },
      }
    }
  }
}

// Generate interface as FLAT:
export interface OrderDetailTransformed {
  // ✅ Flatten: produk_* fields instead of nested object
  produkId: string
  produkNama: string
  produkGambar: string
}

// Generate mapper as FLAT:
export const to... = (api: ...) => ({
  produkId: api.produk?.id,      // ← Optional chaining safe
  produkNama: api.produk?.nama,
  produkGambar: api.produk?.gambar,
})
```

---

## Array Mapping Pattern (Inline)

### Your Pattern

```typescript
items: api.items.map(item => ({
    produkId: item.produk.id,
    produkNama: item.produk.nama,
    qty: item.qty,
    harga: item.harga,
}))
```

### RouteSync Should Generate

```typescript
// Type definition:
export interface OrderDetailTransformed {
  items: Array<{
    produkId: string
    produkNama: string
    produkGambar: string
    qty: number
    harga: number
  }>
}

// Mapper:
export const toOrderDetailRead = (api: ...) => ({
  items: api.items.map(item => ({
    produkId: item.produk.id,
    produkNama: item.produk.nama,
    produkGambar: item.produk.gambar,
    qty: item.qty,
    harga: item.harga,
  }))
})
```

**No helper functions needed!** Inline `.map()` dengan proper typing.

---

## Implementation in ZodTierGenerator

### Current Logic (Line 1262-1273)

```typescript
else if (kind === 'object' && meta.fields) {
  const props: string[] = []
  for (const [subName, subDefRaw] of Object.entries(meta.fields)) {
    const mappedVal = this.generateObjectReadMapper(subDef, safeSubOriginal)
    props.push(`    ${safeSubCamel}: ${mappedVal},`)  // ← Nested object
  }
  return `(${parentAccessor} ? {\n${props.join('\n')}\n  } : undefined) as any`
}
```

### Should Be: Flatten Strategy

```typescript
else if (kind === 'object' && meta.fields) {
  const props: string[] = []
  
  for (const [subName, subDefRaw] of Object.entries(meta.fields)) {
    const subDef = subDefRaw as any
    const subCamel = camelCase(subName)
    
    // For nested resource/model: FLATTEN
    if (subDef.kind === 'resource' || subDef.kind === 'model') {
      const nestedFields = subDef.fields || {}
      const prefix = subCamel  // e.g., 'produk' → 'produk*'
      
      for (const [fieldName, fieldDef] of Object.entries(nestedFields)) {
        const fieldCamel = camelCase(fieldName)
        const flatFieldName = `${prefix}${fieldCamel.charAt(0).toUpperCase()}${fieldCamel.slice(1)}`
        // Result: produk + Id → produkId, produk + nama → produkNama
        
        const accessPath = `${parentAccessor}.${subName}?.${fieldName}`
        props.push(`    ${flatFieldName}: ${accessPath},`)
      }
    } else {
      // Regular field
      const accessPath = `${parentAccessor}.${subName}`
      props.push(`    ${subCamel}: ${accessPath},`)
    }
  }
  
  // Return FLAT object, no cast needed!
  return `{\n${props.join('\n')}\n  }`
}
```

---

## Complete Example: What Should Generate

### Input Meta

```javascript
{
  kind: 'resource',
  resource: 'OrderDetailResource',
  fields: {
    id: { type: 'string' },
    produk: {
      kind: 'resource',
      resource: 'Produk',
      fields: {
        id: { type: 'string' },
        nama: { type: 'string' },
        gambar: { type: 'string' },
      }
    },
    items: {
      type: 'array',
      items: {
        kind: 'object',
        fields: {
          produk_item_id: { type: 'string' },
          qty: { type: 'number' },
        }
      }
    }
  }
}
```

### Generated Interface (FLAT)

```typescript
export interface OrderDetailResourceTransformed {
  id: string
  produkId: string        // ← Flattened from produk.id
  produkNama: string      // ← Flattened from produk.nama
  produkGambar: string
  
  items: Array<{
    produkItemId: string
    qty: number
  }>
}

export type OrderDetailResourceShow = OrderDetailResourceTransformed
export type OrderDetailResourceIndex = OrderDetailResourceTransformed[]
```

### Generated Mapper (TYPE-SAFE, NO `as any`)

```typescript
export const toOrderDetailResourceRead = (
  api: OrderDetailResourceResponse
): OrderDetailResourceTransformed => ({
  id: api.id,
  produkId: api.produk?.id,      // ✅ Type-safe
  produkNama: api.produk?.nama,  // ✅ Type-safe
  produkGambar: api.produk?.gambar,
  
  items: api.items.map(item => ({
    produkItemId: item.produk_item_id,
    qty: item.qty,
  }))
})

export const toOrderDetailResourceReadList = (
  api: OrderDetailResourceResponse[]
): OrderDetailResourceIndex => 
  api.map(toOrderDetailResourceRead)
```

**Result:**
- ✅ No `as any`
- ✅ Flat structure
- ✅ Type-safe inline
- ✅ Optional chaining for safety
- ✅ Inline array mapping
- ✅ Zero helper functions

---

## Comparison: Current vs Desired

### Current (RouteSync)

```typescript
export interface OrderDetailResourceTransformed {
  id: string
  produk: ProdukTransformed | undefined  // Nested type
}

export const toOrderDetailResourceRead = (...) => ({
  id: api.id,
  produk: (api.produk ? {
    id: api.produk.id,
    nama: api.produk.nama,
  } : undefined) as any  // ❌ Nested + cast
})
```

### Desired (Your Pattern)

```typescript
export interface OrderDetailResourceTransformed {
  id: string
  produkId: string        // Flattened fields
  produkNama: string
}

export const toOrderDetailResourceRead = (...) => ({
  id: api.id,
  produkId: api.produk?.id,    // ✅ Type-safe, flat
  produkNama: api.produk?.nama,
})
```

---

## Recommendation untuk ZodTierGenerator

### Change Strategy

1. **Interface Generation** (generateRead method):
   - Detect nested resources/models
   - **FLATTEN** fields dengan prefix convention
   - No nested interfaces

2. **Mapper Generation** (generateObjectReadMapper):
   - For nested resource/model: **FLATTEN** fields
   - Use optional chaining `?.` untuk safety
   - No anonymous nested objects
   - No `as any` casts needed

3. **Array Handling**:
   - Map inline with proper typing
   - No helper functions
   - Type definition inline in array

### Code Location Changes

```typescript
// Line 718-766: Interface generation
// Add flatten logic for nested resources

// Line 1232-1277: generateObjectReadMapper
// Change from nested objects → flat fields
```

### Result

- ✅ Zero `as any`
- ✅ Flat, readable structure
- ✅ Type-safe by construction
- ✅ Matches your current pattern
- ✅ No helper functions clutter

---

## Summary: Pattern Alignment

| Aspect | Current RouteSync | Your Pattern | Should Be |
|--------|-------------------|--------------|-----------|
| Nested objects | Nested type | Flattened | **Flattened** |
| Type safety | `as any` | Type-safe | **Type-safe** |
| Array mapping | Helper function | Inline map | **Inline map** |
| Structure | Nested | Flat | **Flat** |
| Maintainability | ❌ | ✅ | **✅** |
| Type casting | `as any` | None | **None** |

**Your pattern is the right one!** RouteSync should generate code exactly like this.

---

## Next Steps

1. **Modify `generateRead()` method**: Flatten nested fields in interface
2. **Modify `generateObjectReadMapper()`**: Return flat field list, not nested objects
3. **Optional chaining**: Use `api.field?.subfield` untuk safety
4. **Array inline mapping**: Keep `.map()` inline with proper typing

Result: Type-safe, clean, maintainable code dengan zero `as any` casts! 🎉
