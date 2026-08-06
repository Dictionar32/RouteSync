# Type Import Architecture Fix

**Status**: ✅ FIXED  
**Date**: July 28, 2026  
**Issue**: Response types were incorrectly imported from `api-read.ts` instead of `api-contract.ts`

## 🔍 Problem Identified

User pointed out a critical architectural issue in type imports:

> "ProdukApiResponse kamu ambil dari api-read.ts kan? soalnya api-read.ts itu transformed index show ngak ada apiresponse response itu ambil dari api-contract.ts bagian infer show jadi zod di infer ke typescript digunakan di api.ts semua layer bukan asal asal an ada penggunaan nya"

**Translation**: Response types should come from `api-contract.ts` (Zod inferred types), not from `api-read.ts` (frontend types).

## ❌ Wrong Pattern (Before Fix)

### api-read.ts (Wrong - manual type definition)
```typescript
// ❌ Manual definition - NOT from Zod schema
export type ProdukApiResponse = {
  id: number
  name: string
  price: number
  description: string | null
  category_id: number
  created_at: string
  updated_at: string
}
```

### api.ts (Wrong - importing from read)
```typescript
// ❌ Wrong source - response types should come from contract
import type {
  ProdukApiResponse  // ❌ From api-read.ts
} from '../types/api-read'
```

### Problems:
- ❌ Duplicate type definitions
- ❌ Manual maintenance required
- ❌ No single source of truth
- ❌ Schema changes don't auto-propagate

## ✅ Correct Pattern (After Fix)

### api-contract.ts (Correct - single source of truth)
```typescript
import { z } from 'zod'

// Zod schema (backend structure)
export const ProdukResourceSchema = z.object({
  id: z.number(),
  name: z.string(),
  price: z.number(),
  description: z.string().nullable(),
  category_id: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
})

// ⭐ INFERRED TYPE - single source of truth
export type ProdukResourceResponse = z.infer<typeof ProdukResourceSchema>

export const validateProdukResourceResponse = (payload: unknown): ProdukResourceResponse => 
  ProdukResourceSchema.parse(payload)
```

### api-read.ts (Correct - no response types)
```typescript
// Frontend display types (camelCase)
export interface ProdukRead {
  id: number
  name: string
  price: number
  description: string | null
  categoryId: number     // ⭐ camelCase (frontend)
  createdAt: string      // ⭐ camelCase (frontend)
  updatedAt: string      // ⭐ camelCase (frontend)
}

// Form interfaces
export interface ProdukForm {
  Create: { ... }
  Update: { ... }
}

// API payload interfaces (snake_case for backend)
export interface ProdukApiCreate {
  name: string
  price: number
  description: string | null
  category_id: number    // ⭐ snake_case for backend
}

// ❌ NOTE: NO ProdukApiResponse here!
// Response types come from contract (z.infer results)
```

### api.ts (Correct - imports from proper sources)
```typescript
// Frontend types dari ReadEmitter
import type {
  ProdukIndex,
  ProdukShow,
  ProdukForm,
  ProdukApiCreate,
  ProdukApiUpdate,
} from '../types/api-read'

// ⭐ Response types dari ContractEmitter (z.infer results)
import type {
  ProdukResourceResponse,
} from '../contract/api-contract'

export const api = defineApi({
  produk: {
    endpoint({
      types: {
        response: typeOf<ProdukResourceResponse>(), // ⭐ FROM CONTRACT
        // ... other types from read
      }
    })
  }
})
```

## 🔧 Implementation Changes

### 1. SDKEmitter.ts - Fixed Type Imports

**Before:**
```typescript
private generateTypeImports(ir: ContractIR): string {
  const imports: string[] = []
  for (const resource of ir.resources) {
    const resourceName = this.capitalize(resource.name)
    imports.push(`import type {
      ${resourceName}Index,
      ${resourceName}Show,
      ${resourceName}Form,
      ${resourceName}ApiCreate,
      ${resourceName}ApiUpdate,
      ${resourceName}ApiResponse,  // ❌ From read
    } from '../types/api-read'`)
  }
  return imports.join('\n')
}
```

**After:**
```typescript
private generateTypeImports(ir: ContractIR): string {
  const imports: string[] = []
  for (const resource of ir.resources) {
    const resourceName = this.capitalize(resource.name)
    // Frontend types dari ReadEmitter
    imports.push(`import type {
      ${resourceName}Index,
      ${resourceName}Show,
      ${resourceName}Form,
      ${resourceName}ApiCreate,
      ${resourceName}ApiUpdate,
    } from '../types/api-read'`)
    
    // ⭐ Response types dari ContractEmitter (z.infer results)
    imports.push(`import type {
      ${resourceName}Response,
    } from '../contract/api-contract'`)
  }
  return imports.join('\n')
}
```

### 2. Type Reference Update

**Before:**
```typescript
// Always include response type
types.push(`response: typeOf<${this.capitalize(resource.resourceName)}ApiResponse>(),`)
```

**After:**
```typescript
// Always include response type (dari contract, bukan read)
types.push(`response: typeOf<${this.capitalize(resource.resourceName)}Response>(),`)
```

## 🎯 Architectural Layers

### Layer Responsibilities (Fixed)

| Layer | File | Responsibility | Types Generated |
|-------|------|----------------|-----------------|
| **Contract** | `api-contract.ts` | Zod schemas + inferred types | `ProdukResourceResponse` (z.infer) |
| **Read** | `api-read.ts` | Frontend display + form types | `ProdukRead`, `ProdukForm`, `ProdukApi*` |
| **SDK** | `api.ts` | API orchestration | Imports from both layers |
| **Mapper** | `api-mapper.ts` | Data transformations | Uses types from both layers |

### Type Flow (Fixed)

```
1. Contract Layer:
   Zod Schema → z.infer<typeof Schema> → TypeScript Type
   
2. Read Layer:
   Frontend Types (camelCase) + Form Types + Payload Types (snake_case)
   
3. SDK Layer:
   Import forms from Read + Import responses from Contract
   
4. Mapper Layer:
   Transform using types from both layers
```

## ✅ Benefits of Fix

### 1. Single Source of Truth
- ✅ Response types only defined in contract (z.infer)
- ✅ Schema changes auto-propagate to TypeScript
- ✅ No manual type maintenance

### 2. Contract-First Architecture
- ✅ Zod schema drives TypeScript types
- ✅ Runtime validation matches compile-time types
- ✅ Schema evolution is type-safe

### 3. Clear Separation of Concerns
- ✅ Contract: Backend response structure
- ✅ Read: Frontend display structure
- ✅ SDK: Orchestration layer
- ✅ Mapper: Transformation layer

### 4. Type Safety Improvements
- ✅ Guaranteed consistency between schema and types
- ✅ Compile-time errors for schema mismatches
- ✅ Auto-completion based on actual schema

### 5. Maintenance Benefits
- ✅ Change schema once, types update everywhere
- ✅ No risk of manual type drift
- ✅ Clear dependency flow

## 🔍 Verification

### Test Cases
1. ✅ `test-correct-type-imports.mjs` - Architecture demonstration
2. ✅ `test-fixed-architecture.mjs` - Complete fixed implementation
3. ✅ `test-all-emitters-output.mjs` - Real implementation test

### Key Checks
- ✅ No `ProdukApiResponse` in `api-read.ts`
- ✅ Response types imported from `api-contract.ts`
- ✅ Zod inferred types used in SDK
- ✅ Clear separation between frontend and backend types

## 📝 Usage Impact

### Before Fix (Problematic)
```typescript
// Manual type definition risk
const response: ProdukApiResponse = await api.get() // Type drift risk
```

### After Fix (Correct)
```typescript
// Type automatically from Zod schema
const response: ProdukResourceResponse = await api.get() // Always in sync
```

## 🏆 Conclusion

The type import architecture has been **fixed to follow contract-first principles**:

1. **✅ Response types**: Generated from Zod schemas via `z.infer` (single source)
2. **✅ Frontend types**: Specialized display and form types in read layer
3. **✅ Import separation**: SDK imports from appropriate layers
4. **✅ Type safety**: Schema changes auto-propagate to all consumers

**This ensures type consistency, reduces maintenance burden, and follows modern contract-first API development patterns.**