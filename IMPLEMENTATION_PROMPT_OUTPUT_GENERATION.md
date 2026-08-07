# Implementation Prompt: Output Generation System (api-read.ts & api-form.ts)

## 🎯 Task Overview

**STATUS UPDATE:**
- ✅ **api-read.ts** - Sudah selesai di engine baru (`ReadEmitter` di compiler)
- ❌ **api-form.ts** - Belum ada di engine baru, masih pakai engine lama

**Task:** Implementasikan **FormEmitter baru di engine compiler** (`packages/core/src/compiler/emitters/FormEmitter.ts`) yang sejajar dengan ReadEmitter, menggunakan arsitektur compiler-based yang bersih.

**Engine Lama vs Baru:**
- Engine Lama: `packages/cli/src/generators/layers/FormEmitter.ts` (masih pakai IR architecture lama)
- Engine Baru: `packages/core/src/compiler/` (compiler-based, belum ada FormEmitter)

---

## 📋 Required Skills

Sebelum memulai implementasi, **WAJIB** activate 2 skills berikut:

### 1. Reverse Engineering Skill
```bash
# Activate skill untuk evidence-based analysis
disclose_context: "reverse-engineering"
```

**Why needed:**
- Memahami existing generator (ReadEmitter, FormEmitter)
- Trace data flow dari manifest → IR → output
- Identify duplicate type inference systems
- Document evidence-based findings

### 2. Compiler Bridge Architecture Skill
```bash
# Activate skill untuk clean architecture
disclose_context: "compiler-bridge-architecture"
```

**Why needed:**
- Memastikan Bridge hanya translate, tidak analyze
- Separate concerns antara semantic vs transformation
- Follow SSOT (Single Source of Truth) principle
- Proper artifact boundaries

---

## 📖 Context: Output Files Purpose

### api-read.ts — Backend → Frontend (Response Types)

**Purpose:** Representasi data yang **keluar** dari backend, sudah transformed untuk frontend consumption.

**Source:** Laravel Resources (UserResource::toArray())
**Target:** TypeScript interfaces dengan camelCase, nested fields flattened

**Data Flow:**
```
Backend Response (snake_case, nested)
    ↓
Resource Transformation
    ↓
api-read.ts (camelCase, flattened)
    ↓
Frontend UI Components
```

### api-form.ts — Frontend → Backend (Request Types)

**Purpose:** Representasi data yang **masuk** ke backend untuk create/update operations.

**Source:** Laravel FormRequest validation rules
**Target:** TypeScript types dengan multiple actions (Create, Update, Get)

**Data Flow:**
```
Frontend Form Input
    ↓
api-form.ts (camelCase, optional handling)
    ↓
API Request (transformed back to snake_case)
    ↓
Backend Validation & Storage
```

---

## 📊 Contoh Output Nyata

### 1. api-read.ts — Nested Resource Flattened

**Backend (Laravel Resource):**
```php
// OrderDetailResource.php
public function toArray($request): array
{
    return [
        'id' => $this->id,
        'produk_item_id' => $this->produk_item_id,
        'produk' => [
            'id' => $this->produk->id,
            'nama' => $this->produk->nama,
            'gambar' => $this->produk->gambar,
        ],
        'qty' => $this->qty,
        'harga' => $this->harga,
    ];
}
```

**Generated Output (api-read.ts):**
```typescript
export interface OrderDetailResourceTransformed {
  id: number
  produkItemId: number
  produkId: number              // ✅ Flattened from nested produk.id
  produkNama: string            // ✅ Flattened from nested produk.nama
  produkGambar: (string) | null // ✅ Flattened from nested produk.gambar
  produkImageUrl: (string) | null
  qty: number
  harga: number
  subtotal: number
}

export type OrderDetailResourceShow = OrderDetailResourceTransformed
export type OrderDetailResourceIndex = OrderDetailResourceTransformed[]
```

**Key Features:**
- ✅ snake_case → camelCase transformation
- ✅ Nested fields flattened with prefix (produk.nama → produkNama)
- ✅ Nullable encoding: `(string) | null` not `string | null`
- ✅ Show/Index aliases generated

---

### 2. api-read.ts — Complex Nested with Arrays

**Backend:**
```php
// OrderResource.php
public function toArray($request): array
{
    return [
        'id' => $this->id,
        'status' => $this->status,
        'shipping_nama' => $this->shipping_nama,
        'shipping_telepon' => $this->shipping_telepon,
        'shipping_alamat' => $this->shipping_alamat,
        'promotion_code' => $this->promotion_code,
        'promotion_discount_minor' => $this->promotion_discount_minor,
        'items' => OrderDetailResource::collection($this->items),
    ];
}
```

**Generated Output:**
```typescript
export interface OrderResourceTransformed {
  id: number
  status: string
  totalHarga: number
  invoiceNumber: (string) | null
  
  // Nested prefixes flattened
  shippingNama: (string) | null
  shippingTelepon: (string) | null
  shippingAlamat: (string) | null
  shippingKota: (string) | null
  shippingKodePos: (string) | null
  
  // Promotion fields
  promotionCode: (string) | null
  promotionDiscountMinor: number
  
  // Nested array relation (NOT flattened further)
  items?: OrderDetailResourceTransformed[]
  
  createdAt: string
}

export type OrderResourceShow = OrderResourceTransformed
export type OrderResourceIndex = OrderResourceTransformed[]
```

**Key Features:**
- ✅ Multiple nested prefixes (shipping_*, promotion_*) flattened
- ✅ Array relations kept as array (items: T[])
- ✅ Optional arrays: `?: T[]` not `| undefined`

---

### 3. api-read.ts — Collection Wrapper

**Backend:**
```php
// CategoryController.php
public function index(): JsonResponse
{
    return CategoryResource::collection(Category::all());
}
```

**Generated Output:**
```typescript
export interface CategoriesTransformed {
  data: CategoryTransformed[]
}

export interface CategoryTransformed {
  id: number
  nama: string
  createdAt: string | null
  updatedAt: string | null
}
```

**Key Features:**
- ✅ Collection wrapper with `data: T[]` pattern
- ✅ Plural naming for collection (CategoriesTransformed)

---

### 4. api-form.ts — Simple Form (Single Action)

**Backend:**
```php
// RegisterRequest.php
public function rules(): array
{
    return [
        'name' => ['required', 'string'],
        'email' => ['required', 'email'],
        'password' => ['required', 'string', 'min:8'],
    ];
}
```

**Generated Output:**
```typescript
export type RegisterForm = {
  Create: {
    name: string
    email: string
    password: string
  }
}
```

**Key Features:**
- ✅ Action-based structure (Create)
- ✅ Required fields: `field: Type`
- ✅ Validation rules → TypeScript types

---

### 5. api-form.ts — Multi-Action Form

**Backend:**
```php
// CartItemsController.php

// StoreCartItemRequest
public function rules(): array {
    return [
        'produk_item_id' => ['required', 'string'],
        'qty' => ['required', 'integer'],
    ];
}

// UpdateCartItemRequest  
public function rules(): array {
    return [
        'qty' => ['required', 'integer'],
    ];
}
```

**Generated Output:**
```typescript
export type CartItemsForm = {
  Create: {
    produkItemId: string
    qty: number
  }
  
  Update: {
    qty: number
  }
}
```

**Key Features:**
- ✅ Multiple actions on same resource
- ✅ Different shapes per action
- ✅ snake_case → camelCase in form fields

---

### 6. api-form.ts — Optional & Nullable Fields

**Backend:**
```php
// ProfileUpdateRequest.php
public function rules(): array
{
    return [
        'name' => ['required', 'string'],
        'email' => ['required', 'email'],
        'avatar_url' => ['nullable', 'string'],
        'bio' => ['sometimes', 'string'],
    ];
}
```

**Generated Output:**
```typescript
export type ProfileForm = {
  Update: {
    name: string
    email: string
    avatarUrl?: string | undefined | null
    bio?: string | undefined | null
  }
}
```

**Key Features:**
- ✅ Required: `field: Type`
- ✅ Optional: `field?: Type | undefined | null`
- ✅ Nullable/sometimes rules → optional TypeScript field

---

### 7. api-form.ts — Nested Array Payload

**Backend:**
```php
// CheckoutRequest.php
public function rules(): array
{
    return [
        'items' => ['required', 'array'],
        'items.*.produk_item_id' => ['required', 'string'],
        'items.*.qty' => ['required', 'integer'],
        'shipping_nama' => ['nullable', 'string'],
        'shipping_telepon' => ['nullable', 'string'],
    ];
}
```

**Generated Output (with known bug):**
```typescript
export type CheckoutForm = {
  Create: {
    items?: {
    produkItemId: string  // ⚠️ BUG: Wrong indentation
    qty: number           // ⚠️ BUG: Should be indented
  }[] | undefined
    shippingNama?: string | undefined | null
    shippingTelepon?: string | undefined | null
  }
}
```

**Known Bug:**
- ❌ Nested object literal indentation broken
- ❌ `produkItemId` and `qty` not indented under `items?: {`
- ✅ Type structure correct, formatting wrong

---

## 🚨 Known Limitations & Bugs

### Limitation 1: Nested Array Object Indentation

**File:** api-form.ts
**Issue:** Nested object literals in array types tidak di-indent dengan benar

**Evidence:**
```typescript
// ❌ Current Output (Wrong)
items?: {
produkItemId: string
qty: number
}[] | undefined

// ✅ Expected Output (Correct)
items?: {
  produkItemId: string
  qty: number
}[] | undefined
```

**Root Cause:** Suspected separate code path for array-of-object payloads, tidak menggunakan rekursi yang sama dengan flat objects.

**Impact:** Cosmetic (code works, but formatting ugly)

**Files to Investigate:**
- `packages/cli/src/generators/layers/FormEmitter.ts` (suspected)
- Method yang handle array payloads dalam `generateForm()`

---

### Limitation 2: Duplicate Type Inference Systems

**Files:** ReadEmitter.ts, FormEmitter.ts, (potentially others)

**Issue:** Multiple independent type inference implementations:
1. `mapSqlTypeToTs()` — SQL column → TypeScript (for api-read.ts)
2. `buildResponseZodType()` — Response → Zod schema (for api-contract.ts)
3. Suspected third system in FormEmitter for validation rules → TypeScript

**Evidence:**
- ReadEmitter uses `mapSqlTypeToTs(field.type)`
- Each emitter has own type mapping logic
- No shared type inference kernel

**Impact:**
- ❌ Code duplication
- ❌ Inconsistent type mapping across emitters
- ❌ Hard to maintain (fix bug in 3 places)

**Recommendation:** Consolidate into single `TypeInferenceKernel` with pluggable strategies.

---

### Limitation 3: No Semantic Type Validation

**Issue:** Generated types assume manifest data is correct, no validation of semantic correctness.

**Example Problem:**
```typescript
// If manifest has wrong type inference
produkItemId: string  // Backend actually expects number
```

**Impact:** Runtime type mismatches not caught at generation time

**Recommendation:** Add semantic validation pass before emission.

---

### Limitation 4: Nullable vs Optional Encoding Inconsistency

**api-read.ts:**
```typescript
field: (string) | null  // ✅ Explicit nullable
```

**api-form.ts:**
```typescript
field?: string | undefined | null  // ✅ Optional + nullable
```

**Issue:** Different encoding strategies across files, can confuse developers.

**Recommendation:** Document encoding convention clearly, or unify.

---

### Limitation 5: Collection Wrapper Detection

**Issue:** Collection detection based on naming convention (plural resource name) not explicit API contract.

**Problem:**
```php
// UserResource::collection() → should wrap with data: []
// But detection might fail if resource name not pluralizable
```

**Recommendation:** Use explicit metadata from manifest, not naming inference.

---

### Limitation 6: Show/Index Alias Generation

**Issue:** Aliases generated for ALL resources, even synthetic nested ones.

**Problem:**
```typescript
// ❌ Generated for synthetic nested resource (wrong)
export type OrderShippingShow = OrderShippingTransformed
export type OrderShippingIndex = OrderShippingTransformed[]

// OrderShipping is NOT a real API endpoint resource,
// it's extracted from nested object in OrderResource
```

**Fix Applied:** Check `isSynthetic` flag to skip alias generation (see ContractIRBuilder.ts line 451)

**Status:** ✅ Fixed in Phase 3

---

### Limitation 7: Raw Model Types Generation

**Issue:** `ModelGenerator` generates raw database model types in `core/models.ts`

**Problem:**
- ❌ Exposes internal DB structure (passwords, tokens)
- ❌ Different from actual API response
- ❌ Never used in actual code (0 imports found)
- ❌ Misleading for developers

**Recommendation:** 🗑️ **Remove ModelGenerator entirely** (documented in MODEL_GENERATION_CLARIFICATION.md)

**Priority:** P2 (not breaking, but cleanup needed)

---

## 🎯 Implementation Goals

### Primary Goals

1. **Generate api-read.ts** (Backend → Frontend)
   - ✅ Flatten nested resources dengan prefix
   - ✅ snake_case → camelCase transformation
   - ✅ Nullable encoding: `(Type) | null`
   - ✅ Show/Index aliases (exclude synthetic resources)
   - ✅ Collection wrappers dengan `data: T[]`

2. **Generate api-form.ts** (Frontend → Backend)
   - ✅ Action-based structure (Create/Update/Get)
   - ✅ Optional encoding: `?: Type | undefined | null`
   - ✅ Multi-action support per resource
   - ✅ Validation rules → TypeScript types
   - ⚠️ Fix nested array indentation bug

3. **Architectural Cleanness**
   - ✅ Follow CompilerBridge principles
   - ✅ Single Source of Truth for type inference
   - ✅ Evidence-based implementation (not assumptions)
   - ✅ Clear artifact boundaries

---

## 📝 Implementation Approach

### Phase 1: Evidence Collection (Use Reverse Engineering Skill)

**Tasks:**
1. Read existing `ReadEmitter.ts` implementation
2. Read existing `FormEmitter.ts` implementation (if exists)
3. Trace data flow: Manifest → IR → ReadEmitter → api-read.ts
4. Document all type inference systems found
5. Identify code duplication points

**Output:** Evidence document dengan file:line references

**Checklist:**
- [ ] All emitter files analyzed
- [ ] Data flow fully mapped
- [ ] Type inference systems catalogued
- [ ] Duplication points identified

---

### Phase 2: Architecture Design (Use Compiler Bridge Skill)

**Tasks:**
1. Design ReadEmitter interface following IEmitter contract
2. Design FormEmitter interface following IEmitter contract
3. Ensure Bridge only translates, semantic in passes
4. Design shared TypeInferenceKernel
5. Define artifact boundaries

**Output:** Architecture design document

**Checklist:**
- [ ] Emitter interfaces defined
- [ ] Bridge boundaries clear
- [ ] No semantic logic in Bridge
- [ ] Type inference centralized

---

### Phase 3: Implementation — ReadEmitter

**Tasks:**
1. Implement `ReadEmitter.emit(ir: ContractIR)`
2. Handle nested flattening with prefix
3. Handle snake_case → camelCase
4. Handle nullable encoding `(Type) | null`
5. Generate Show/Index aliases (skip synthetic)
6. Handle collection wrappers

**Test Cases:**
- OrderDetailResourceTransformed (nested flatten)
- OrderResourceTransformed (multiple prefixes + array)
- CategoryTransformed (collection wrapper)

**Output:** Working ReadEmitter + tests

---

### Phase 4: Implementation — FormEmitter

**Tasks:**
1. Implement `FormEmitter.emit(ir: ContractIR)`
2. Handle action-based structure
3. Handle optional encoding `?: Type | undefined | null`
4. Handle multi-action per resource
5. **FIX: Nested array indentation bug**

**Test Cases:**
- RegisterForm (single action)
- CartItemsForm (multi-action)
- CheckoutForm (nested array — verify indentation fix)

**Output:** Working FormEmitter + tests

---

### Phase 5: Integration & Testing

**Tasks:**
1. Integrate emitters into CLI generate command
2. Test with real manifest (toko-online)
3. Compare output dengan existing output
4. Verify no regressions
5. Update documentation

**Output:** Integrated system + comparison report

---

## 🔍 Implementation Checklist

### Before Starting

- [ ] Activate `reverse-engineering` skill
- [ ] Activate `compiler-bridge-architecture` skill
- [ ] Read PHASE_2_ROOT_CAUSE_ANALYSIS.md (context)
- [ ] Read ISSUE-manifest-resource-linkage.md (synthetic resources)

### During Implementation

- [ ] Follow evidence-based approach (no assumptions)
- [ ] Document all decisions with file:line references
- [ ] Keep Bridge thin (translation only)
- [ ] Write tests for each feature
- [ ] Fix known bugs (array indentation)

### After Implementation

- [ ] Generate api-read.ts from test manifest
- [ ] Generate api-form.ts from test manifest
- [ ] Compare with existing output (should match)
- [ ] Document any differences found
- [ ] Update known limitations list

---

## 📊 Success Criteria

### Functional Requirements

- ✅ api-read.ts matches existing output format
- ✅ api-form.ts matches existing output format
- ✅ Nested flattening works correctly
- ✅ Case transformation accurate
- ✅ Nullable/optional encoding correct
- ✅ Array indentation bug fixed

### Architecture Requirements

- ✅ Follows CompilerBridge principles
- ✅ No semantic logic in Bridge
- ✅ Single type inference system
- ✅ Clean artifact boundaries
- ✅ Evidence-based implementation

### Quality Requirements

- ✅ 80%+ test coverage
- ✅ No TypeScript errors
- ✅ Matches existing output (byte-for-byte if possible)
- ✅ Documentation complete

---

## 🎓 Learning Resources

### Required Reading

1. `.kiro/steering/skills/reverse-engineering/SKILL.md`
   - Evidence collection methods
   - Data flow analysis
   - Ownership analysis

2. `.kiro/steering/skills/compiler-bridge-architecture/SKILL.md`
   - Bridge responsibilities
   - What Bridge can/cannot do
   - Architecture principles

3. `PHASE_2_ROOT_CAUSE_ANALYSIS.md`
   - Context on duplicate type systems
   - Why this refactoring needed

4. `packages/cli/src/generators/layers/ReadEmitter.ts`
   - Current implementation
   - Type inference logic

### Supporting Documents

- `ISSUE-manifest-resource-linkage.md` — Synthetic resource handling
- `RESOURCE_FLATTENING_EVIDENCE_ANALYSIS.md` — Flattening logic
- `MODEL_GENERATION_CLARIFICATION.md` — What NOT to generate

---

## 🚀 Execution Command

```bash
# Step 1: Activate required skills
# (Kiro will load skill instructions into context)

# Step 2: Start evidence collection
# Read existing emitters, trace data flow

# Step 3: Design architecture
# Follow CompilerBridge principles

# Step 4: Implement ReadEmitter
# Generate api-read.ts output

# Step 5: Implement FormEmitter  
# Generate api-form.ts output

# Step 6: Test & verify
# Compare with existing output
```

---

## 📝 Output Format

### Expected Generated Files

```
src/api/types/
├── api-read.ts       ← Backend → Frontend types
├── api-form.ts       ← Frontend → Backend types
└── api-contract.ts   ← Zod schemas (already done)
```

### File Structure — api-read.ts

```typescript
// Resource Transformed Interfaces
export interface XResourceTransformed {
  // Flattened fields, camelCase
}

// Show/Index Aliases
export type XResourceShow = XResourceTransformed
export type XResourceIndex = XResourceTransformed[]

// Collection Wrappers
export interface XsTransformed {
  data: XTransformed[]
}
```

### File Structure — api-form.ts

```typescript
// Action-based Forms
export type XForm = {
  Create: {
    // Create fields
  }
  Update: {
    // Update fields
  }
  Get: {
    // Query params
  }
}
```

---

**Status:** ✅ **READY FOR IMPLEMENTATION**  
**Priority:** P0 (Critical path for compiler migration)  
**Estimated Effort:** 2-3 days (with proper evidence collection)  
**Skills Required:** reverse-engineering + compiler-bridge-architecture

