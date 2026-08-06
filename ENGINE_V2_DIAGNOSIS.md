# Engine V2 Diagnosis - Root Cause Analysis

## 🔍 Problem Summary

Engine V2 sebenarnya **berjalan dengan baik** dan menghasilkan struktur resource-grouped yang benar. Namun ada **3 masalah kritis** yang membuat output tidak siap production:

### 1. **❌ Missing Semantic Data**
```
Routes: 35
Resources: 0    ← PROBLEM!
Models: 0       ← PROBLEM!
```

**Root Cause**: Manifest dari scanning Laravel hanya menghasilkan route data mentah, tapi tidak ada:
- Resource metadata (UserResource, ProductResource, etc.)
- Model metadata (User, Product, etc.) 
- Type relationships dan dependencies

**Impact**: Engine V2 terpaksa **fallback ke naming conventions** alih-alih menggunakan actual type information.

### 2. **❌ Invalid TypeScript Identifiers**

**Generated Code (Invalid)**:
```typescript
// ❌ Invalid JavaScript identifiers
validateForgot-passwordCreatePayload    // Hyphen tidak boleh di identifier
toApiForgot-passwordCreate             // Hyphen tidak boleh di identifier
oauth_provider_redirect                // Underscore OK, tapi inconsistent
```

**Root Cause**: Engine V2 tidak melakukan **identifier sanitization** pada resource names yang extract dari route paths/names.

### 3. **❌ Missing Dependencies Integration**

**Generated Output**:
```typescript
// ❌ Semua imports di-comment, tidak aktif
// import type { RegisterForm, LoginForm } from "../types/api-read"
// import { validateRegisterCreatePayload } from "../contract/api-contract"
```

**Root Cause**: Engine V2 membuat struktur API yang reference ke files lain, tapi tidak memastikan files tersebut benar-benar ada dan terhubung.

---

## 🆚 Perbandingan Engine Lama vs V2

| Aspect | Engine Lama | Engine V2 | Status |
|--------|-------------|-----------|---------|
| **Data Requirements** | Cukup dengan routes mentah | Butuh Resources + Models metadata | ⚠️ V2 lebih demanding |
| **Type Safety** | Basic inference | Rich type relationships | ✅ V2 lebih baik |
| **Structure** | Flat per-route | Resource-grouped | ✅ V2 lebih organized |
| **Naming** | Simple | Complex (butuh sanitization) | ⚠️ V2 lebih error-prone |
| **Dependencies** | Self-contained | Multi-file integration | ⚠️ V2 lebih complex |

---

## 🎯 Apa Yang Kurang di Engine V2

### 1. **Semantic Resolution Layer Missing**

Engine lama punya pipeline:
```
Routes → Direct Generation → Working Output
```

Engine V2 dirancang untuk:
```
Routes → Semantic Resolution → Rich IR → Generation → Working Output
         ↑ LAYER INI MISSING!
```

**Yang Dibutuhkan**:
- Resource discovery dari controller analysis
- Model schema extraction dari database
- Type relationship mapping
- Dependency graph building

### 2. **Identifier Sanitization Missing**

Engine V2 tidak handle:
```javascript
// ❌ Yang terjadi sekarang
"forgot-password" → "Forgot-passwordForm"  // Invalid!

// ✅ Yang seharusnya
"forgot-password" → "ForgotPasswordForm"   // Valid!
```

### 3. **File Generation Orchestration Missing**

Engine V2 generate struktur API yang assume:
```typescript
import { validateUserCreate } from "../contract/api-contract"
import { toUserRead } from "../mappers/api-mapper"  
import type { UserForm } from "../types/api-read"
```

Tapi tidak memastikan files tersebut benar-benar di-generate dengan exports yang benar.

---

## 🛠️ Solutions Needed

### 1. **Enhanced Manifest Scanning**
```bash
# Current scanning (insufficient)
routesync scan --input routes/api.php

# Needed enhanced scanning
routesync scan --input routes/api.php --models --resources --relationships
```

### 2. **Identifier Sanitization**
```typescript
// Add to Engine V2
function sanitizeIdentifier(name: string): string {
    return name
        .replace(/[-\s]+/g, '_')           // hyphen/space → underscore
        .replace(/[^a-zA-Z0-9_]/g, '')     // remove invalid chars
        .replace(/^[0-9]/, '_$&')          // prefix number
        .toLowerCase()
}

// Convert to PascalCase for types
function toPascalCase(name: string): string {
    return sanitizeIdentifier(name)
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join('')
}
```

### 3. **Integrated File Generation**
```typescript
// Engine V2 should ensure ALL dependencies exist
class ContractGenerator {
    generate(manifest) {
        // 1. Generate all supporting files FIRST
        this.generateTypes()      // types/api-read.ts
        this.generateContracts()  // contract/api-contract.ts  
        this.generateMappers()    // mappers/api-mapper.ts
        
        // 2. THEN generate main API with verified imports
        this.generateSDK()        // sdk/api.ts
    }
}
```

---

## 🏆 Conclusion: V2 Architecture is Sound

**Engine V2 tidak bermasalah pada level arsitektur**. Masalahnya adalah:

1. **Input data kurang kaya** - Butuh enhanced scanning
2. **Implementation details** - Sanitization & orchestration
3. **Integration gaps** - Multi-file dependency management

Engine V2 sebenarnya **lebih advanced** dari engine lama, tapi butuh **complete pipeline** untuk berjalan optimal, bukan hanya route data mentah.

**Fix Strategy**: 
- ✅ Keep V2 architecture (resource-grouped, type-safe)
- 🔧 Fix input pipeline (enhanced scanning)
- 🔧 Fix identifier handling (sanitization)
- 🔧 Fix file orchestration (integrated generation)

Engine V2 dengan fixes ini akan **significantly better** dari engine lama.