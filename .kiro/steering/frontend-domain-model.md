# RouteSync: Frontend Domain Model Philosophy

## Filosofi Inti

RouteSync **BUKAN** generator DTO backend.  
RouteSync **ADALAH** generator Frontend SDK yang dioptimalkan untuk developer experience.

### Prinsip Fundamental

```
❌ SALAH: "Frontend mengikuti bentuk backend"
✅ BENAR: "Frontend memiliki Domain Model sendiri yang optimal untuk developer"
```

---

## Arsitektur Data Flow

### Response Flow (Backend → Frontend)

```
Laravel Response (snake_case + nested)
         ↓
    Mapper Layer
         ↓
 api-read.ts (camelCase + flattened)
         ↓
   Frontend Code
```

**Contoh Transformasi:**
```typescript
// Backend mengirim:
{
  shipping: {
    nama: "John",
    telepon: "08123456789",
    alamat: "Jl. Example"
  }
}

// Frontend menerima (api-read.ts):
{
  shippingNama: "John",
  shippingTelepon: "08123456789",
  shippingAlamat: "Jl. Example"
}
```

### Request Flow (Frontend → Backend)

```
Frontend Code
     ↓
api-form.ts (camelCase + flattened)
     ↓
Mapper Layer
     ↓
Laravel Request (snake_case + nested)
```

**Contoh Transformasi:**
```typescript
// Frontend mengirim (api-form.ts):
{
  shippingNama: "John",
  shippingTelepon: "08123456789",
  shippingAlamat: "Jl. Example"
}

// Backend menerima:
{
  shipping: {
    nama: "John",
    telepon: "08123456789",
    alamat: "Jl. Example"
  }
}
```

### Simetri Pipeline

```
Response: Backend → Mapper → Flat+camelCase → Frontend
Request:  Frontend → Flat+camelCase → Mapper → Backend
```

---

## Aturan Frontend Domain Model

### 1. ✅ Semua Field Menggunakan camelCase

**WAJIB:**
```typescript
// ✅ BENAR
shippingNama
shippingTelepon
produkItemId
```

**DILARANG:**
```typescript
// ❌ SALAH
shipping_nama
ShippingNama
shipping.nama
```

### 2. ✅ Semua Nested Object Di-flatten

**WAJIB:**
```typescript
// ✅ BENAR - Flat structure
export type OrderForm = {
  create: {
    shippingNama: string
    shippingTelepon: string
    shippingAlamat: string
    produkItemId: number
    qty: number
  }
}
```

**DILARANG:**
```typescript
// ❌ SALAH - Nested structure
export type OrderForm = {
  create: {
    shipping: {
      nama: string
      telepon: string
      alamat: string
    }
    produk: {
      itemId: number
    }
    qty: number
  }
}
```

### 3. ✅ Frontend Tidak Mengetahui Struktur Backend

**Prinsip:** Frontend code tidak pernah tahu bahwa backend menggunakan nested objects.

```typescript
// ✅ Frontend developer hanya tahu ini:
const form = useForm<OrderForm>()
form.register("shippingNama")
form.register("shippingTelepon")

// ❌ Frontend developer TIDAK tahu ini:
// shipping: { nama, telepon }
```

### 4. ✅ Mapper Bertanggung Jawab Penuh

**Tanggung Jawab Mapper:**
- Flatten nested objects ke flat structure
- Unflatten flat structure ke nested objects
- Convert camelCase ↔ snake_case
- Handle optional/nullable fields

**Lokasi:**
- Response Mapper: Runtime di HTTP client
- Request Mapper: Runtime di HTTP client

### 5. ✅ Backend Bebas Berubah Tanpa Mengubah Frontend API

**Contoh Skenario:**

Backend berubah dari:
```php
// LAMA
$request->input('shipping.nama')

// BARU
$request->input('delivery.recipient_name')
```

Frontend tetap menggunakan:
```typescript
// Tidak berubah sama sekali
form.register("shippingNama")
```

Yang berubah hanya **Mapper configuration**.

---

## Keuntungan Arsitektur Ini

### 1. 🎯 Frontend Tidak Pernah Tahu Struktur Backend

**Developer Experience:**
```typescript
// ✅ Simple dan straightforward
const { shippingNama, shippingTelepon } = orderData

// vs

// ❌ Complicated dan nested
const { shipping: { nama, telepon } } = orderData
```

### 2. 🎯 React Hook Form Lebih Nyaman

**Dengan Flat Structure:**
```typescript
// ✅ Clean
register("shippingNama")
watch("shippingTelepon")
errors.shippingAlamat

// ✅ Easy validation
const isShippingComplete = 
  shippingNama && 
  shippingTelepon && 
  shippingAlamat
```

**Dengan Nested Structure:**
```typescript
// ❌ Verbose
register("shipping.nama")
watch("shipping.telepon")
errors.shipping?.alamat

// ❌ Complex validation
const isShippingComplete = 
  shipping?.nama && 
  shipping?.telepon && 
  shipping?.alamat
```

### 3. 🎯 Refactor Backend Tidak Memengaruhi Frontend

**Backend Breaking Change:**
```php
// Backend rename structure
'shipping' → 'delivery'
'shipping.nama' → 'delivery.recipient_name'
```

**Frontend Impact:**
```typescript
// ✅ Zero changes needed
shippingNama // Still works
shippingTelepon // Still works
```

**Mapper Update:**
```typescript
// Hanya update mapping rules
{
  shippingNama: 'delivery.recipient_name',
  shippingTelepon: 'delivery.contact_phone'
}
```

### 4. 🎯 Frontend Benar-Benar Independen

**Anti-Corruption Layer:**
```
Backend Domain ←→ Mapper ←→ Frontend Domain
   (nested)      (transform)    (flat)
 (snake_case)    (convert)   (camelCase)
```

Frontend Domain Model adalah **First-Class Citizen**, bukan sekadar cerminan backend.

### 5. 🎯 Testing Lebih Mudah

**Frontend Tests:**
```typescript
// ✅ Simple mock data
const mockOrder = {
  shippingNama: "Test",
  shippingTelepon: "123",
  produkItemId: 1,
  qty: 2
}

// vs

// ❌ Complex mock data
const mockOrder = {
  shipping: {
    nama: "Test",
    telepon: "123"
  },
  produk: {
    itemId: 1
  },
  qty: 2
}
```

---

## Implementasi di RouteSync

### Generator Responsibilities

#### TypeScriptGeneratorPass (api-read.ts)
```typescript
// ✅ Generate flat + camelCase types
export interface Order {
  shippingNama: string
  shippingTelepon: string
  shippingAlamat: string
  produkItemId: number
  qty: number
}
```

**Aturan:**
- Flatten all nested objects
- Convert to camelCase
- Preserve type safety

#### FormGeneratorPass (api-form.ts)
```typescript
// ✅ Generate flat + camelCase form types
export type OrderForm = {
  create: {
    shippingNama: string
    shippingTelepon: string
    shippingAlamat: string
  }
}
```

**Aturan:**
- Flatten all nested validation rules
- Convert to camelCase
- Group by action (create/update)

#### MapperGenerator (future)
```typescript
// 🔜 Generate mapper configuration
export const orderMapper = {
  toBackend: {
    shippingNama: 'shipping.nama',
    shippingTelepon: 'shipping.telepon',
    shippingAlamat: 'shipping.alamat'
  },
  fromBackend: {
    'shipping.nama': 'shippingNama',
    'shipping.telepon': 'shippingTelepon',
    'shipping.alamat': 'shippingAlamat'
  }
}
```

### Resource Flattening Utility

**Location:** `packages/cli/src/generators/utils/resource-flattening.ts`

**Purpose:** Flatten nested resource structures

```typescript
// Input (nested)
{
  shipping: {
    nama: 'string',
    telepon: 'string'
  }
}

// Output (flattened)
{
  shippingNama: 'string',
  shippingTelepon: 'string'
}
```

---

## Konsistensi Across Pipeline

### Semua Generator Harus Konsisten

| Generator | Output | Format | Structure |
|-----------|--------|--------|-----------|
| TypeScriptGeneratorPass | api-read.ts | camelCase | Flat |
| FormGeneratorPass | api-form.ts | camelCase | Flat |
| HookGenerator | hooks.ts | camelCase | Flat |
| ActionGenerator | actions.ts | camelCase | Flat |
| MapperGenerator | mapper.ts | camelCase | Mapping rules |

**Aturan Emas:**
> Jika satu generator menggunakan flat+camelCase, maka **SEMUA** generator harus menggunakan flat+camelCase.

### Verification Checklist

Setiap generator baru harus:
- [ ] Generate camelCase field names
- [ ] Flatten nested structures
- [ ] Not expose backend structure
- [ ] Work with mapper layer
- [ ] Maintain type safety

---

## Perbedaan dengan OpenAPI Generator

### OpenAPI Generator (DTO-based)
```typescript
// ❌ Mirrors backend structure exactly
export interface Order {
  shipping: {
    nama: string
    telepon: string
  }
  produk: {
    item_id: number
  }
}
```

**Karakteristik:**
- Backend-first
- DTO yang identik
- Struktur nested preserved
- snake_case preserved
- Frontend mengikuti backend

### RouteSync (Frontend-Optimized)
```typescript
// ✅ Optimized for frontend
export interface Order {
  shippingNama: string
  shippingTelepon: string
  produkItemId: number
}
```

**Karakteristik:**
- Frontend-first
- Domain Model independen
- Struktur flattened
- camelCase enforced
- Backend mengikuti contract (via mapper)

---

## Migration Path

### Dari Backend-Mirroring ke Frontend-Optimized

**Phase 1: Current State**
```typescript
// api-read.ts already flat+camelCase ✅
// api-form.ts already flat+camelCase ✅
```

**Phase 2: Add Mapper Layer**
```typescript
// Generate mapper configuration
// Update HTTP client to use mappers
```

**Phase 3: Document & Enforce**
```typescript
// Add architecture tests
// Update steering docs
// Enforce in code reviews
```

---

## Best Practices

### DO: Frontend Developer Experience First

```typescript
// ✅ Easy to use
const { shippingNama, shippingTelepon } = useOrderForm()

// ✅ Clean validation
if (!shippingNama || !shippingTelepon) {
  return <Error />
}

// ✅ Simple TypeScript
type Shipping = Pick<Order, 'shippingNama' | 'shippingTelepon'>
```
/**
 * Form type definitions untuk input validation
 * Generated by FormGeneratorPass - Compiler Architecture
 * 
 * Output path: forms/api-form.ts
 * Source: manifest.routes[].validation
 */

export type RegisterForm = {
  create: {
    name: string
    email: string
    password: string
  }
}

export type LoginForm = {
  create: {
    email: string
    password: string
  }
}

export type SocialForm = {
  create: {
    provider: string
    providerUserId: string
    email: string
    name?: string | null
    avatarUrl?: string | null
  }
}

export type ForgotPasswordForm = {
  create: {
    email: string
  }
}

export type ResetPasswordForm = {
  create: {
    email: string
    token: string
    password: string
  }
}

export type PaymentForm = {
  create: {
    metode: string

### DON'T: Expose Backend Complexity

```typescript
// ❌ Complex nested access
const nama = order.shipping?.nama

// ❌ Verbose validation
if (!order.shipping?.nama || !order.shipping?.telepon) {
  return <Error />
}

// ❌ Complex TypeScript
type Shipping = {
  [K in keyof Order]: K extends 'shipping' 
    ? Order[K] 
    : never
}['shipping']
```

---

## Architecture Tests

### Enforce Flat Structure

```typescript
// __tests__/architecture/flat-structure.test.ts
describe('Frontend Domain Model', () => {
  test('api-read.ts should have flat structure', () => {
    const apiRead = readGeneratedFile('api-read.ts')
    
    // Should not contain nested objects
    expect(apiRead).not.toMatch(/\w+:\s*{/)
    
    // Should use camelCase
    expect(apiRead).not.toMatch(/_/)
  })
  
  test('api-form.ts should have flat structure', () => {
    const apiForm = readGeneratedFile('api-form.ts')
    
    // Action blocks are OK, but fields inside should be flat
    expect(apiForm).toMatch(/create:\s*{/)
    expect(apiForm).not.toMatch(/create:\s*{\s*\w+:\s*{/)
  })
})
```

### Enforce Naming Convention

```typescript
describe('Naming Convention', () => {
  test('should use camelCase for all fields', () => {
    const fields = extractFieldNames('api-read.ts')
    
    for (const field of fields) {
      // Should be camelCase
      expect(field).toMatch(/^[a-z][a-zA-Z0-9]*$/)
      
      // Should not have underscores
      expect(field).not.toContain('_')
    }
  })
})
```

---

## Documentation Standards

### Code Comments

```typescript
/**
 * Frontend Domain Model - Optimized for developer experience
 * 
 * Note: This structure is DIFFERENT from backend structure.
 * - All fields are flattened (no nested objects)
 * - All fields use camelCase (not snake_case)
 * - Backend mapping is handled by mapper layer
 * 
 * @see Frontend Domain Model Philosophy in steering docs
 */
export interface Order {
  shippingNama: string
  shippingTelepon: string
}
```

### README Updates

```markdown
## Frontend Domain Model

RouteSync generates **frontend-optimized types**, not backend DTOs.

All generated types follow these principles:
- Flat structure (no nested objects)
- camelCase naming (not snake_case)
- Independent from backend structure
- Mapped via runtime mapper layer

This means your frontend code stays clean and simple, 
regardless of backend complexity.
```

---

## Summary

### Core Philosophy

RouteSync menghasilkan **Frontend SDK**, bukan Backend DTO.

### Key Principles

1. ✅ **Flat Structure** - No nested objects
2. ✅ **camelCase** - JavaScript/TypeScript convention
3. ✅ **Frontend-First** - Optimized for developer experience
4. ✅ **Anti-Corruption** - Backend changes don't break frontend
5. ✅ **Consistent** - All generators follow same rules

### Benefits

- 🎯 Simpler frontend code
- 🎯 Better React Hook Form integration
- 🎯 Backend refactor-proof
- 🎯 Easier testing
- 🎯 Better type safety

### Implementation

- ✅ TypeScriptGeneratorPass: Flat + camelCase
- ✅ FormGeneratorPass: Flat + camelCase
- 🔜 MapperGenerator: Runtime mapping
- 🔜 Architecture tests: Enforce consistency

---

**Status**: Active Architecture Principle  
**Version**: 1.0  
**Last Updated**: 2026-08-07  
**Applies To**: All RouteSync generators
