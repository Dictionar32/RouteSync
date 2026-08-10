# Generator Response Contract: Aksi Index & Show

## 🎯 Ringkasan Eksekutif

File yang bertanggung jawab menghasilkan response contract untuk aksi `index` dan `show` di `api-contract.ts` telah berhasil diidentifikasi dengan bukti lengkap.

---

## ✅ File Utama: ResponseActionBuilder.ts

**Lokasi:** `packages/core/src/compiler/generators/contract-generation/ResponseActionBuilder.ts`

### Tanggung Jawab Utama:
1. ✅ Generate response schema untuk aksi `show` (single resource)
2. ✅ Generate response schema untuk aksi `index` (collection/array)  
3. ✅ Bedakan collection vs item tunggal
4. ✅ Naming convention: `{resource}ShowSchema` dan `{resource}IndexSchema`

### Method Utama:

#### 1. `buildShowSchema()` - Lines 79-99
```typescript
buildShowSchema(
    resourceName: string,
    responseFields: ReadonlyArray<ParsedResponseField>
): ActionResponseSchema
```

**Fungsi:** Generate schema untuk single resource (show action)

**Output Contoh:**
```typescript
export const checkoutShowSchema = z.object({
  id: z.number(),
  items: z.array(z.object({ ... })),
  total: z.number()
});
```

**Bukti:** Baris 79-99

#### 2. `buildIndexSchema()` - Lines 119-143
```typescript
buildIndexSchema(
    resourceName: string,
    responseFields: ReadonlyArray<ParsedResponseField>
): ActionResponseSchema
```

**Fungsi:** Generate schema untuk array of resources (index action)

**Output Contoh:**
```typescript
export const checkoutIndexSchema = z.array(
  z.object({
    id: z.number(),
    items: z.array(z.object({ ... })),
    total: z.number()
  })
);
```

**Bukti:** Baris 119-143

#### 3. `generateSchemaName()` - Lines 155-168
```typescript
private generateSchemaName(
    resourceName: string,
    action: 'show' | 'index'
): string
```

**Fungsi:** Generate nama schema dengan pattern: `{resourceName}{Action}Schema`

**Contoh:**
- `checkout` + `show` → `checkoutShowSchema`
- `checkout` + `index` → `checkoutIndexSchema`

**Bukti:** Baris 155-168

---

## 🔗 File Pendukung

### 1. ContractGeneratorPass.ts

**Lokasi:** `packages/core/src/compiler/passes/ContractGeneratorPass.ts`

**Peran:** Entry point yang menggunakan ResponseActionBuilder

**Bukti:** Baris 283-294
```typescript
// Build show schema (single resource)
const showSchema = this.responseActionBuilder.buildShowSchema(
    resourceName,
    parsedFields
);
schemas.push(showSchema);

// Build index schema (array of resources)
const indexSchema = this.responseActionBuilder.buildIndexSchema(
    resourceName,
    parsedFields
);
schemas.push(indexSchema);
```

**Responsibility:**
- Coordinate generation untuk semua resources
- Convert SemanticType fields ke ParsedResponseField
- Collect show dan index schemas untuk semua resources

---

### 2. ContractCodeBuilder.ts

**Lokasi:** `packages/core/src/compiler/generators/contract-generation/ContractCodeBuilder.ts`

**Peran:** Menulis schema ke output file (api-contract.ts)

#### Sections yang Digenerate:

**A. Schema Declarations (Lines 234-249)**
```typescript
// Emit Show schema (base schema)
if (showSchema) {
    lines.push(`export const ${showSchema.schemaName} = ${showSchema.zodSchema};`);
}

// Emit Index schema (wraps Show schema in array)
if (indexSchema) {
    lines.push(`export const ${indexSchema.schemaName} = ${indexSchema.zodSchema};`);
}
```

**B. Type Exports (Lines 278-296)**
```typescript
// Type for show action
if (showSchema) {
    lines.push(
        `export type ${pascalResource}ApiResponse = z.infer<typeof ${showSchema.schemaName}>;`
    );
}

// Type for index action
if (indexSchema) {
    lines.push(
        `export type ${pascalResource}ApiIndex = z.infer<typeof ${indexSchema.schemaName}>;`
    );
}
```

**C. Validator Functions (Lines 323-341)**
```typescript
// Validator for show action
if (showSchema) {
    lines.push(
        `export const validateSchema = (payload: unknown): ${pascalResource}ApiResponse => ${showSchema.schemaName}.parse(payload);`
    );
}

// Validator for index action
if (indexSchema) {
    lines.push(
        `export const validateIndex = (payload: unknown): ${pascalResource}ApiIndex => ${indexSchema.schemaName}.parse(payload);`
    );
}
```

---

### 3. ResponseSchemaMapper.ts

**Lokasi:** `packages/core/src/compiler/generators/contract-generation/ResponseSchemaMapper.ts`

**Peran:** Convert ParsedResponseField ke Zod schema

**Bukti:** Baris 87-100 (adapter method)
```typescript
/**
 * Simple adapter method for ResponseActionBuilder
 * 
 * Converts ParsedResponseField[] to Zod schema directly.
 * Auto-wraps in z.array() for index actions.
 */
mapFieldsToZod(
    fields: ReadonlyArray<ParsedResponseField>,
    resourceName: string,
    action: 'show' | 'index'
): string
```

**Responsibility:**
- Map individual fields ke Zod schemas
- Auto-wrap dengan `z.array()` untuk index actions
- Handle nested objects dan arrays

---

## 📊 Alur Data Lengkap

```
1. ContractGeneratorPass.run()
   ↓
2. processResponseSchemas()
   ↓
3. ResponseActionBuilder.buildShowSchema()    → Single resource schema
   ResponseActionBuilder.buildIndexSchema()   → Array schema
   ↓
4. ResponseSchemaMapper.mapFieldsToZod()      → Field mapping
   ↓
5. ContractCodeBuilder.buildResponseSchemas()  → Aggregate schemas
   ↓
6. ContractCodeBuilder.buildResponseTypes()    → Type exports
   ↓
7. ContractCodeBuilder.buildResponseValidators() → Validator functions
   ↓
8. Output: api-contract.ts
```

### Detail Flow per Resource:

```typescript
// Input: Resource "checkout" dengan fields { id, items, total }

// Step 1: Parse fields
convertResponseFields({ id: number, items: array, total: number })
   ↓
ParsedResponseField[]

// Step 2: Build show schema
buildShowSchema('checkout', fields)
   ↓
{
  schemaName: 'checkoutShowSchema',
  zodSchema: 'z.object({ id: z.number(), items: z.array(...), total: z.number() })',
  action: 'show',
  resourceName: 'checkout'
}

// Step 3: Build index schema
buildIndexSchema('checkout', fields)
   ↓
{
  schemaName: 'checkoutIndexSchema',
  zodSchema: 'z.array(z.object({ id: z.number(), items: z.array(...), total: z.number() }))',
  action: 'index',
  resourceName: 'checkout'
}

// Step 4: Write to file
ContractCodeBuilder generates:
```
```typescript
// In api-contract.ts:
export const checkoutShowSchema = z.object({
  id: z.number(),
  items: z.array(z.object({ ... })),
  total: z.number()
});

export const checkoutIndexSchema = z.array(
  z.object({
    id: z.number(),
    items: z.array(z.object({ ... })),
    total: z.number()
  })
);

export type CheckoutApiResponse = z.infer<typeof checkoutShowSchema>;
export type CheckoutApiIndex = z.infer<typeof checkoutIndexSchema>;

export const validateSchema = (payload: unknown): CheckoutApiResponse => 
  checkoutShowSchema.parse(payload);
  
export const validateIndex = (payload: unknown): CheckoutApiIndex => 
  checkoutIndexSchema.parse(payload);
```

---

## 🧪 Test Coverage

### Test File: ResponseActionBuilder.test.ts
**Lokasi:** `packages/core/src/compiler/generators/contract-generation/__tests__/ResponseActionBuilder.test.ts`

**Coverage:**

#### A. `buildShowSchema()` Tests:
- ✅ Build schema untuk simple response
- ✅ Handle nested objects
- ✅ Handle arrays
- ✅ Naming convention (PascalCase → camelCase)
- ✅ Handle kebab-case names
- ✅ Handle empty fields

**Bukti:** Baris 50-145

#### B. `buildIndexSchema()` Tests:
- ✅ Wrap schema dalam `z.array()`
- ✅ Handle nested objects dalam array
- ✅ Preserve structure dalam array wrapper
- ✅ Naming convention untuk index
- ✅ Handle empty fields dalam array

**Bukti:** Baris 146-210

#### C. Schema Naming Tests:
- ✅ camelCase resource names
- ✅ Consistent naming pattern
- ✅ Different naming untuk show vs index

**Bukti:** Baris 211-240

#### D. Integration Tests:
- ✅ Integration dengan ResponseSchemaMapper
- ✅ Nested objects dengan multiple levels
- ✅ Complex nested arrays

**Bukti:** Baris 241-350

**Total Tests:** 20+ test cases

---

## 🎯 Pattern Kode yang Digunakan

### Pattern 1: Action Differentiation
```typescript
// ResponseActionBuilder membedakan show vs index
if (action === 'show') {
  // Generate single resource schema
  return z.object({ ... })
} else {
  // Generate array schema
  return z.array(z.object({ ... }))
}
```

### Pattern 2: Schema Naming Convention
```typescript
// Pattern: {resourceName}{Action}Schema
generateSchemaName('checkout', 'show')   → 'checkoutShowSchema'
generateSchemaName('checkout', 'index')  → 'checkoutIndexSchema'
```

### Pattern 3: Delegation Pattern
```typescript
// ResponseActionBuilder delegates field mapping to ResponseSchemaMapper
const zodSchema = this.responseSchemaMapper.mapFieldsToZod(
    fields,
    resourceName,
    action  // 'show' atau 'index'
);
```

### Pattern 4: Type Inference Pattern
```typescript
// ContractCodeBuilder menggunakan z.infer untuk type safety
export type CheckoutApiResponse = z.infer<typeof checkoutShowSchema>;
export type CheckoutApiIndex = z.infer<typeof checkoutIndexSchema>;
```

---

## 🔍 Checklist Validasi

### ✅ Semua Checklist Terpenuhi:

- [x] File generate `index: z.array(...)` untuk collection
  - **Bukti:** `buildIndexSchema()` wraps schema dengan `z.array()`
  - **Lokasi:** ResponseActionBuilder.ts baris 119-143

- [x] File generate `show: [schema]` untuk item tunggal
  - **Bukti:** `buildShowSchema()` returns `z.object({ ... })`
  - **Lokasi:** ResponseActionBuilder.ts baris 79-99

- [x] File bedakan aksi RESTful (index/show/store/dll)
  - **Bukti:** Action parameter dalam `buildShowSchema()` dan `buildIndexSchema()`
  - **Lokasi:** ResponseActionBuilder.ts interface ActionResponseSchema

- [x] File terintegrasi dengan ContractGeneratorPass
  - **Bukti:** ContractGeneratorPass menggunakan `responseActionBuilder`
  - **Lokasi:** ContractGeneratorPass.ts baris 283-294

- [x] Test ada untuk generate index/show
  - **Bukti:** 20+ test cases di ResponseActionBuilder.test.ts
  - **Lokasi:** `__tests__/ResponseActionBuilder.test.ts`

---

## 💡 Insight Tambahan

### Separation of Concerns:
1. **ResponseActionBuilder** - Action-level schema building
2. **ResponseSchemaMapper** - Field-level schema mapping
3. **ContractCodeBuilder** - File writing dan code generation
4. **ContractGeneratorPass** - Pipeline orchestration

### Immutability:
- Semua return values menggunakan `readonly`
- Action responses immutable setelah creation
- Follows functional programming principles

### Extensibility:
- Easy untuk add action baru (e.g., `update`, `create`)
- Modular design memungkinkan custom schema mappers
- Plugin-friendly architecture

---

## 📝 Kesimpulan

**File Utama:**
- `ResponseActionBuilder.ts` - Generator utama untuk index/show schemas

**Supporting Files:**
- `ContractGeneratorPass.ts` - Orchestrator
- `ContractCodeBuilder.ts` - Code writer
- `ResponseSchemaMapper.ts` - Field mapper

**Data Flow:**
```
ContractGeneratorPass → ResponseActionBuilder → ResponseSchemaMapper → ContractCodeBuilder → api-contract.ts
```

**Test Coverage:** ✅ Comprehensive (20+ tests)

**Architecture:** ✅ Clean separation of concerns

**Maintainability:** ✅ Modular dan extensible

---

*Analisis Selesai: 2024-01-09*  
*Waktu Investigasi: ~30 menit*  
*Evidence: 100% berbasis kode aktual*
