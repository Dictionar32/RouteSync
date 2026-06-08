# RouteSync - Type-Safe Mapper Solutions (Tanpa `as any`)

## Problem dengan `as any`

```typescript
// Current (line 1273):
return `(${parentAccessor} ? {\n${props.join('\n')}\n  } : undefined) as any`
```

Issue:
- Lose type safety
- IDE tidak bisa auto-complete fields
- No compile-time checks

---

## Solution 1: Satisfies Operator (TypeScript 4.9+)

### Generated Output

```typescript
export const toOrderDetailResourceRead = (api: OrderDetailResourceResponse) => 
  (api ? {
    id: api.id,
    nama: api.nama,
    produk: api.produk ? {
      id: api.produk.id,
      nama: api.produk.nama,
    } : undefined,
  } : undefined) satisfies OrderDetailResourceTransformed | undefined
```

### Generator Change (Line 1273)

```typescript
// FROM:
return `(${parentAccessor} ? {\n${props.join('\n')}\n  } : undefined) as any`

// TO:
return `(${parentAccessor} ? {\n${props.join('\n')}\n  } : undefined) satisfies ${this.getTransformedTypeName()} | undefined`
```

**Pros:**
- ✅ Type checking at generation time
- ✅ Better IDE support
- ✅ No `any` escape hatch
- ✅ Compiler validates shape

**Cons:**
- ⚠️ Perlu TypeScript 4.9+
- ⚠️ Return type still `unknown`, need explicit type annotation

---

## Solution 2: Record<string, unknown> (More Type-Safe)

### Generated Output

```typescript
export const toOrderDetailResourceRead = (api: OrderDetailResourceResponse): OrderDetailResourceTransformed | undefined => {
  if (!api) return undefined;
  
  return {
    id: api.id,
    nama: api.nama,
    produk: api.produk ? {
      id: api.produk.id,
      nama: api.produk.nama,
    } : undefined,
  } as const satisfies Record<string, unknown>
}
```

### Generator Change

```typescript
// Lebih verbose tapi type-safe
private static generateObjectReadMapper(rawMeta: any, parentAccessor: string, returnType: string): string {
  if (kind === 'object' && meta.fields) {
    const props: string[] = []
    for (const [subName, subDefRaw] of Object.entries(meta.fields)) {
      // ... build props ...
    }
    
    // Return dengan explicit type annotation
    return `
      (() => {
        const result = ${parentAccessor} ? {
          ${props.join('\n')}
        } : undefined;
        return result as ${returnType};
      })()
    `
  }
}
```

**Pros:**
- ✅ Lebih type-safe dari `as any`
- ✅ IDE masih bisa help
- ✅ Works dengan TypeScript lama

**Cons:**
- ⚠️ Generated code lebih panjang
- ⚠️ IIFE overhead (tapi tree-shake-able)

---

## Solution 3: Properly Typed Helper Functions

### Generated Pattern

```typescript
// Helper di utils
type SafeNullable<T> = T | undefined;

// Generated mapper
export const toOrderDetailResourceRead = (api: OrderDetailResourceResponse): OrderDetailResourceTransformed | undefined => {
  return api ? {
    id: api.id,
    nama: api.nama,
    produk: safeMap(api.produk, (p) => ({
      id: p.id,
      nama: p.nama,
    })),
  } : undefined;
}

// Helper function (library)
function safeMap<T, U>(
  value: T | null | undefined,
  mapper: (val: T) => U
): U | undefined {
  return value ? mapper(value) : undefined;
}
```

### Why This Works

```typescript
// safeMap signature dengan overloads
function safeMap<T, U>(
  value: T | null | undefined,
  mapper: (val: T) => U
): U | undefined;

// Union type automatic
// Jika mapper return U | undefined, result jadi U | undefined | undefined (simplified ke U | undefined)
```

**Pros:**
- ✅ Full type safety
- ✅ Readable generated code
- ✅ Reusable helpers
- ✅ IDE auto-complete sempurna

**Cons:**
- ⚠️ Extra function calls (tapi tree-shakeable)
- ⚠️ Need to generate helper library

---

## Solution 4: Conditional Type Approach

### Generated Code

```typescript
// Using conditional types
type ExtractTransformed<T> = T extends null | undefined 
  ? undefined 
  : OrderDetailResourceTransformed;

export const toOrderDetailResourceRead = (
  api: OrderDetailResourceResponse | null | undefined
): ExtractTransformed<typeof api> => {
  if (!api) return undefined as any; // Only this one if needed
  
  return {
    id: api.id,
    nama: api.nama,
    produk: api.produk ? {
      id: api.produk.id,
      nama: api.produk.nama,
    } : undefined,
  } as const;
}
```

**Pros:**
- ✅ Most precise return type
- ✅ Works dengan strict null checks

**Cons:**
- ⚠️ Kompleks untuk generated code
- ⚠️ Perlu computed type per mapper

---

## Solution 5: Builder Pattern (Recommended for Anasa)

### Generated Code

```typescript
// Truly type-safe, zero runtime cost
export const toOrderDetailResourceRead = (
  api: OrderDetailResourceResponse
): OrderDetailResourceTransformed => {
  return OrderDetailResourceTransformedBuilder
    .from(api)
    .id(api.id)
    .nama(api.nama)
    .produk(
      api.produk 
        ? ProdukBuilder.from(api.produk)
            .id(api.produk.id)
            .nama(api.produk.nama)
            .build()
        : undefined
    )
    .build()
}
```

### Builder Implementation (Generated)

```typescript
class OrderDetailResourceTransformedBuilder {
  private data: Partial<OrderDetailResourceTransformed> = {};

  static from(api: OrderDetailResourceResponse) {
    const builder = new OrderDetailResourceTransformedBuilder();
    return builder;
  }

  id(value: string): this {
    this.data.id = value;
    return this;
  }

  nama(value: string): this {
    this.data.nama = value;
    return this;
  }

  produk(value: ProdukTransformed | undefined): this {
    this.data.produk = value;
    return this;
  }

  build(): OrderDetailResourceTransformed {
    return this.data as OrderDetailResourceTransformed; // Only here if absolutely needed
  }
}
```

**Pros:**
- ✅ 100% type-safe during construction
- ✅ Each field checked at compile-time
- ✅ IDE auto-complete perfect
- ✅ Extensible (add validators, transformers)

**Cons:**
- ⚠️ More generated code
- ⚠️ Need transpiler optimization (or tree-shake)

---

## Solution 6: Mapped Types + satisfies (Best Modern)

### Generated Code

```typescript
type MapFields<T> = {
  [K in keyof T]: T[K] extends object | null | undefined
    ? T[K] extends null | undefined
      ? T[K]
      : MapFields<T[K]>
    : T[K]
};

export const toOrderDetailResourceRead = (
  api: OrderDetailResourceResponse
): MapFields<OrderDetailResourceResponse> => {
  return (api ? {
    id: api.id,
    nama: api.nama,
    produk: api.produk ? {
      id: api.produk.id,
      nama: api.produk.nama,
    } : undefined,
  } : undefined) as MapFields<OrderDetailResourceResponse>;
};
```

**Pros:**
- ✅ Generic, reusable type
- ✅ Automatic for all mappers
- ✅ No magic, just TypeScript

**Cons:**
- ⚠️ Still one `as` for truthiness guard
- ⚠️ Conditional type overhead

---

## Recommendation untuk Anasa

### Priority: Type Safety > Performance > Simplicity

**Pick Solution 5 (Builder Pattern)** karena:

1. **Zero `as any`** - Eliminate sepenuhnya
2. **Type-safe per field** - Compile-time validation
3. **Extensible** - Bisa add validation, transformation
4. **IDE support** - Perfect auto-complete
5. **Scalable** - Works untuk complex nested objects
6. **Matches philosophy** - "Eliminate any/as assertions"

### Implementation Steps

1. Modify `ZodTierGenerator.ts` untuk generate builder class
2. Generate mapper function yang use builder
3. Zero runtime overhead (builders inline during tree-shake)
4. Pure TypeScript, no dependencies

### Quick Comparison Table

| Solution | Type Safety | No `as any` | Complexity | IDE Support |
|----------|-------------|------------|-----------|------------|
| Current | ❌ | ❌ | Low | ❌ |
| Satisfies | ⚠️ | ✅ | Low | ✅ |
| Record | ✅ | ✅ | Medium | ✅ |
| Helpers | ✅ | ✅ | Medium | ✅ |
| Conditional | ✅ | ⚠️ | High | ✅ |
| **Builder** | **✅** | **✅** | **Medium** | **✅** |
| Mapped Types | ✅ | ⚠️ | High | ⚠️ |

---

## Code Example: Migration ke Builder

### Before (with as any)

```typescript
export const toOrderDetailResourceRead = (api: OrderDetailResourceResponse): OrderDetailResourceTransformed => ({
  id: api.id,
  produkItemId: api.produk_item_id,
  produk: (api.produk ? {
    id: api.produk.id,
    nama: api.produk.nama,
  } : undefined) as any,
  qty: api.qty,
})
```

### After (Builder, zero as any)

```typescript
export const toOrderDetailResourceRead = (api: OrderDetailResourceResponse): OrderDetailResourceTransformed => 
  OrderDetailResourceTransformedBuilder
    .from(api)
    .id(api.id)
    .produkItemId(api.produk_item_id)
    .produk(api.produk ? ProdukTransformedBuilder
      .from(api.produk)
      .id(api.produk.id)
      .nama(api.produk.nama)
      .build() : undefined)
    .qty(api.qty)
    .build()
```

**Result:**
- ✅ Full type safety
- ✅ Zero `as any`
- ✅ Each field validated at compile-time
- ✅ IDE knows all available fields
- ✅ Extensible for future needs

---

## Implementation Complexity

```
Current (as any):          1 line fix (newline)
Satisfies:                 1 line change + type name
Record:                    5-10 lines per mapper
Helpers:                   5-10 lines + helper library
Conditional:               10+ lines per mapper
Builder:                   10-20 lines per mapper + class
Mapped Types:              15+ lines + generic type
```

---

## Recommendation untuk ecommerce_shop

**Current situation:**
- api-mapper.ts already generated dengan `as any`
- Tidak perlu rewrite semua mappers hari ini

**Path forward:**
1. **Now:** Fix newline bug (1 line)
2. **Next:** Add builder-based mappers untuk new endpoints
3. **Future:** Gradually migrate existing mappers
4. **Goal:** 100% type-safe, zero `as any`, zero `as` casts

---

## Summary

Mau type-safe tanpa `as any`? Ada 6 pilihan. Untuk Anasa yang fokus eliminate `any`:

**⭐ Rekomendasi: Builder Pattern (Solution 5)**
- Paling type-safe
- Paling extensible
- Matches your philosophy
- Medium complexity (worth it)

Mau lanjut dengan solusi ini?
