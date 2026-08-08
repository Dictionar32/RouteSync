# Model Generation: Engine Lama vs Engine Baru

## 🔍 Evidence-Based Analysis

### ✅ FAKTA (Facts from Implementation)

#### Engine Lama (CLI-based Generators)

**File:** `packages/cli/src/generators/ModelGenerator.ts`

**Evidence:**
```typescript
export class ModelGenerator {
  static async generate(manifest: RouteManifest, outputDir: string): Promise<void> {
    if (!manifest.models || manifest.models.length === 0) return

    const coreDir = path.join(outputDir, 'core')
    await fs.ensureDir(coreDir)

    // Generate models.ts
    await fs.writeFile(path.join(coreDir, 'models.ts'), lines.join('\n'))
  }
}
```

**Called from:** `packages/cli/src/commands/generate.ts`
```typescript
if (manifest.models) {
  spinner.text = 'Generating DB Models...'
  await ModelGenerator.generate(manifest, options.output)
}
```

**Output:**
- ✅ Generates `core/models.ts`
- ✅ Contains TypeScript interfaces for Eloquent models
- ✅ Maps SQL column types to TypeScript types
- ✅ Handles casts, hidden fields, appended attributes
- ✅ Supports MySQL enum types

**Example Generated Output:**
```typescript
// core/models.ts
export interface User {
  id: number
  name: string
  email: string
  emailVerifiedAt: string | null
  password: string
  rememberToken: string | null
  createdAt: string
  updatedAt: string
}

export interface Product {
  id: number
  name: string
  price: number
  status: 'draft' | 'published' | 'archived'  // MySQL enum
  createdAt: string
  updatedAt: string
}
```

---

#### Engine Baru (Compiler-based)

**Location:** `packages/core/src/compiler/emitters/`

**Evidence:**
```bash
$ ls packages/core/src/compiler/emitters/
BackendCapability.ts
ContractEmitter.ts
GeneratedArtifact.ts
IEmitter.ts
index.ts
README.md
typescript/
TypeScriptEmitter.ts
```

**Available Emitters:**
- ✅ `TypeScriptEmitter.ts` - Emits TypeScript types
- ✅ `ContractEmitter.ts` - Emits API contracts
- ❌ **No ModelEmitter** - Model generation not implemented

**Search Results:**
```bash
# Search for model-related emitters
$ grep -r "ModelEmitter\|generateModels" packages/core/src/compiler/
# Result: No matches found
```

---

### 🔍 INFERENSI (Logical Conclusions)

#### Current State

**Engine Lama (CLI):**
- ✅ **Fully functional** model generation
- ✅ **Active use** - called every `generate` command
- ✅ **Complete feature set** - SQL types, casts, enums, etc.
- ✅ **Output:** `src/api/core/models.ts`

**Engine Baru (Compiler):**
- ❌ **No model generation** capability
- ❌ **Not implemented** yet
- ❌ **Missing emitter** - would need `ModelEmitter` class
- ❌ **No output** for models

#### Why This Matters

**Problem:**
When we migrate fully to compiler-based engine (Phase 3 complete), we will **lose model generation** functionality unless we:

1. Keep the old `ModelGenerator` alongside compiler
2. Implement `ModelEmitter` in compiler architecture
3. Or use hybrid approach (old for models, new for everything else)

---

## 📊 Comparison Table

| Feature | Engine Lama (CLI) | Engine Baru (Compiler) |
|---------|-------------------|------------------------|
| **Model Generation** | ✅ Full support | ❌ Not implemented |
| **Output File** | `core/models.ts` | N/A |
| **SQL Type Mapping** | ✅ Complete | ❌ Missing |
| **Enum Support** | ✅ MySQL enums | ❌ Missing |
| **Cast Support** | ✅ Laravel casts | ❌ Missing |
| **Hidden Fields** | ✅ Optional typing | ❌ Missing |
| **Appends** | ✅ Typed as unknown | ❌ Missing |
| **Integration** | ✅ CLI command | ❌ Not integrated |

---

## 🎯 Impact Analysis

### User Impact

**Current Behavior:**
```bash
$ npx routesync generate --manifest manifest.json --output src/api

✅ Generates:
- api.ts
- types.ts
- hooks.ts
- core/models.ts  ← Database models
```

**After Full Compiler Migration (without fix):**
```bash
$ npx routesync generate --manifest manifest.json --output src/api

✅ Generates:
- api.ts (via compiler)
- types.ts (via compiler)
- hooks.ts (via compiler)
❌ core/models.ts  ← MISSING!
```

**Breaking Change:**
- Users who depend on `core/models.ts` will face **missing imports**
- TypeScript compilation errors in frontend
- Loss of type safety for database models

---

### Example User Code That Would Break

```typescript
// Frontend code using models
import { User, Product, Order } from '@/api/core/models'

interface UserProfile {
  user: User  // ❌ Error: Cannot find module '@/api/core/models'
  recentOrders: Order[]
}

// API response typing
const response: { data: Product[] } = await api.products.index()
//                     ❌ Error: 'Product' not found
```

---

## ✅ Solution Options

### Option 1: Keep Old ModelGenerator (Hybrid Approach)

**Pros:**
- ✅ Zero migration effort
- ✅ No breaking changes
- ✅ Proven, stable code

**Cons:**
- ❌ Mixed architecture (old + new)
- ❌ Technical debt
- ❌ Inconsistent with compiler vision

**Implementation:**
```typescript
// In CLI command
if (manifest.models) {
  // Keep using old generator
  await ModelGenerator.generate(manifest, options.output)
}
```

**Effort:** 0 hours (already working)
**Risk:** Low
**Recommended:** ✅ **Short-term solution**

---

### Option 2: Implement ModelEmitter in Compiler

**Pros:**
- ✅ Consistent architecture
- ✅ All generation in compiler
- ✅ Clean separation of concerns
- ✅ Testable in isolation

**Cons:**
- ❌ Implementation effort required
- ❌ Need to design emitter interface
- ❌ May need artifact changes

**Implementation:**

```typescript
// packages/core/src/compiler/emitters/ModelEmitter.ts
export class ModelEmitter implements IEmitter {
  emit(graph: ContractGraph, context: EmissionContext): GeneratedArtifact {
    const models = this.extractModelsFromGraph(graph)
    const code = this.generateModelInterfaces(models)
    
    return {
      fileName: 'core/models.ts',
      content: code,
      imports: [],
      metadata: {
        emitter: 'ModelEmitter',
        version: '1.0.0'
      }
    }
  }

  private generateModelInterfaces(models: ModelInfo[]): string {
    // Port logic from ModelGenerator
    return models.map(model => 
      this.generateInterface(model)
    ).join('\n\n')
  }
}
```

**Effort:** 4-6 hours
**Risk:** Medium
**Recommended:** ✅ **Long-term solution**

---

### Option 3: Enhanced Hybrid (Best of Both)

**Strategy:**
- Short-term: Keep `ModelGenerator` (Option 1)
- Long-term: Implement `ModelEmitter` (Option 2)
- Migration: Gradual replacement when compiler is stable

**Benefits:**
- ✅ No immediate breaking changes
- ✅ Time to design proper compiler integration
- ✅ Can test emitter alongside old generator
- ✅ Smooth migration path

**Timeline:**
- **Now:** Use `ModelGenerator` (working)
- **Phase 4:** Design `ModelEmitter` architecture
- **Phase 5:** Implement and test `ModelEmitter`
- **Phase 6:** Deprecate old `ModelGenerator`

**Recommended:** ✅ **BEST APPROACH**

---

## 📋 Action Items

### Immediate (Phase 3)

- [x] **Document model generation gap** (this file)
- [ ] **Keep ModelGenerator active** in CLI commands
- [ ] **Add tests** for model generation to prevent regression
- [ ] **Document dependency** in architecture docs

### Phase 4 (Architecture Design)

- [ ] **Design ModelEmitter interface**
- [ ] **Define model artifact structure**
- [ ] **Plan integration with ContractGraph**
- [ ] **Design SQL type mapping system**

### Phase 5 (Implementation)

- [ ] **Implement ModelEmitter class**
- [ ] **Port SQL type mapping logic**
- [ ] **Add enum support**
- [ ] **Handle casts and appends**
- [ ] **Write unit tests** (target: 90% coverage)
- [ ] **Write integration tests**

### Phase 6 (Migration)

- [ ] **Run both generators** in parallel (verify identical output)
- [ ] **Deprecation warning** for old generator
- [ ] **Switch to ModelEmitter** in CLI
- [ ] **Remove old ModelGenerator**

---

## 🔗 References

### Related Files

- **Old Generator:** `packages/cli/src/generators/ModelGenerator.ts`
- **CLI Integration:** `packages/cli/src/commands/generate.ts` (line 103)
- **Compiler Emitters:** `packages/core/src/compiler/emitters/`
- **Architecture Docs:** `.kiro/steering/architecture.md`

### Related Issues

- Phase 3 compiler migration
- Emitter architecture design
- Type system unification

---

## 📝 Summary

### TL;DR

**Question:** "Jadi engine lama masih generate model ya?"

**Answer:** 
- ✅ **YES** - Engine lama (CLI-based) **masih fully functional** untuk model generation
- ❌ **NO** - Engine baru (compiler-based) **belum implement** model generation
- ⚠️ **RISK** - Jika migrate fully ke compiler **tanpa fix**, akan **hilang** fitur model generation
- ✅ **SOLUTION** - Keep old `ModelGenerator` short-term, implement `ModelEmitter` long-term

### Key Takeaway

**Hybrid approach is correct for now:**
- Engine lama: Handle models (proven, stable)
- Engine baru: Handle types, contracts, API (new architecture)

**Future work needed:**
- Implement `ModelEmitter` in compiler
- Port SQL type mapping logic
- Maintain feature parity

---

**Status:** ✅ **DOCUMENTED**  
**Date:** 2026-08-07  
**Priority:** P1 (Critical for migration planning)  
**Action:** Keep old generator active, plan emitter implementation

