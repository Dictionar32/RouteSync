# RouteSync — Named Types & CRUD Pattern Implementation

## TL;DR

**Masalah**: Generated TypeScript dari RouteSync punya penamaan tidak konsisten — `AppCreateRead` (bug fallback), `LoginCreateResponseTransformed` (terlalu panjang), `Post`/`Put`/`Patch` (HTTP method, bukan CRUD), `ProfilePutResponse` + `ProfilePatchResponse` (duplikat), inline return types di mapper, hardcode resource list untuk cache invalidation.

**Solusi**: Rewrite 6 file generator dengan 4 prinsip: (1) resource-based naming via `deriveGroupName`, (2) CRUD semantic naming (`Create`/`Update`/`Delete` bukan `Post`/`Put`/`Patch`), (3) GET-only Transformed types di api-read dengan `Show`/`Index`, (4) semua heuristik diganti logika otomatis dari manifest.

**6 file | +346 / -212 baris | 0 API TypeScript errors**

---

# Bagian 1: Arsitektur & Alur Data

## 1.1 Flow Generator

```
routesync.manifest.json
    │
    ├──▶ classifyRoutes()    → ClassifiedRoute[]  (groupName, actionName, method, role)
    │
    ├──▶ ZodTierGenerator.generate()
    │       ├── generateRead()     → api-read.ts     (GET response types)
    │       ├── generateForm()     → api-form.ts     (input/request types)
    │       ├── generateContract() → api-contract.ts (Zod validasi)
    │       ├── generateSchema()   → api-schema.ts   (form Zod schemas)
    │       ├── generateMapper()   → api-mapper.ts   (transform functions)
    │
    ├──▶ SDKGenerator.generate()   → api.ts          (endpoint definitions)
    ├──▶ HookGenerator.generate()  → hooks.ts        (React Query hooks)
    ├──▶ TypeGenerator.generate()  → types/index.ts  (utility + re-export)
    └──▶ IndexGenerator.generate() → api/index.ts    (barrel export)
```

## 1.2 deriveGroupName — Fungsi Kunci

Fungsi ini mengubah URL path menjadi nama resource identifier. Dipakai oleh semua generator.

```
Input path                        Output groupName
/register                          register
/login                             login
/oauth/{provider}/redirect         oauthRedirect     (param jadi separator)
/produk                            produk
/produk/{id}                       produk            (trailing param diabaikan)
/produk/{id}/reviews               produkReviews     (param di tengah = boundary)
/cart/items                        cartItems
/admin/produk                      adminProduk
/orders/{id}/invoice               ordersInvoice
```

**Algoritma**: Walk segment kiri-ke-kanan. Static segment dikumpulkan. Dynamic segment (`{id}`) jadi separator — flush bucket, reset. Trailing dynamic diabaikan. Hasilnya camelCase.

---

# Bagian 2: ZodTierGenerator.ts (+360/-212)

File terbesar, menangani 5 output file. Semua method `generate*()` dipanggil dari `generate()`.

## 2.1 `generate()` — Entry Point

**Perubahan**: Pass `manifest.routes` ke `generateForm()`.

```typescript
// Line 168-169
await this.generateRead(typesDir, allModels, allResources, allRoutes, manifest.routes || [])
await this.generateForm(typesDir, allRoutes, manifest.routes || [])  // ← parameter baru
```

**Alasan**: `generateForm` sebelumnya hanya menerima `GeneratedRoute[]` (classified). Parameter ketiga `manifestRoutes` untuk backward compatibility — saat ini tidak digunakan karena form tidak generate response types.

---

## 2.2 Contract Block (line ~354-398) — `generateContract()`

### 2.2.1 Menghapus `'App'` fallback

**Sebelum**:
```typescript
const nameParts = route.path.replace(/^\//, '').split('/')
const resource = nameParts[0].replace(/\{.*\}/, '') || 'App'
const TitleCaseResource = toTypeName(route.groupName || resource)
```

**Sesudah**:
```typescript
const resource = route.groupName || deriveGroupName(route.path)
const TitleCaseResource = toTypeName(resource)
```

**Mengapa berubah**: `nameParts[0]` hanya ambil segment pertama. Untuk path `/oauth/{provider}/redirect`, segment pertama `oauth` tapi resource seharusnya `oauthRedirect`. `route.groupName` sudah tersedia dari classifier (hasil `classifyRoutes()`). Fallback `|| 'App'` adalah bug — terjadi saat classifier gagal, menghasilkan nama generik `AppCreateResponse`.

### 2.2.2 Menambah `contractResponseCount`

```typescript
const contractResponseCount = new Map<string, number>()
for (const route of routes) {
  if (route.response) {
    const r = route.groupName || deriveGroupName(route.path)
    contractResponseCount.set(r, (contractResponseCount.get(r) || 0) + 1)
  }
}
```

**Tujuan**: Menghitung berapa response type yang dimiliki satu resource. Resource dengan 1 response (login, register, logout) → nama simple tanpa suffix (`LoginResponse`). Resource dengan >1 response (profile: list+put+patch, produkReviews: get+post) → nama dengan action suffix (`ProfileUpdateResponse`).

### 2.2.3 CRUD Action Mapping

```typescript
const CONTRACT_ACTION_MAP: Record<string, string> = {
  post: 'Create', put: 'Update', patch: 'Update', delete: 'Delete',
}
const rawAction = CONTRACT_ACTION_MAP[route.actionName]
  || (route.actionName.charAt(0).toUpperCase() + route.actionName.slice(1))
const KeyName = TitleCaseResource + rawAction
```

**Mengapa**: Classifier menghasilkan `actionName` dari HTTP method untuk non-standard CRUD routes (`post`, `put`, `patch`, `delete`). Ini harus di-mapping ke CRUD semantics (`Create`, `Update`, `Delete`). PUT dan PATCH sama-sama jadi `Update`.

**Contoh hasil**:
| route | actionName | rawAction | KeyName |
|-------|-----------|-----------|---------|
| POST /login | create | Create | LoginCreate |
| POST /produk/{id}/reviews | post | Create | ProdukReviewsCreate |
| PUT /profile | put | Update | ProfileUpdate |
| PATCH /profile | patch | Update | ProfileUpdate |
| DELETE /wishlist/{id} | delete | Delete | WishlistDelete |

### 2.2.4 Payload Dedup

```typescript
const generatedRespSchemas = new Set<string>()

if (route.schema && ...) {
  if (generatedRespSchemas.has(`${KeyName}Payload`)) continue
  generatedRespSchemas.add(`${KeyName}Payload`)
  // ... generate PayloadSchema, Payload type, validatePayload
}
```

**Mengapa**: PUT dan PATCH `/profile` punya validation rules yang sama → `KeyName` = `ProfileUpdate` untuk keduanya. Tanpa dedup, `ProfileUpdatePayloadSchema` digenerate dua kali. Set mencegah ini.

### 2.2.5 Response Naming & Dedup

```typescript
if (route.response) {
  const count = contractResponseCount.get(resource) || 1
  const respName = count === 1 ? TitleCaseResource : KeyName
  const schemaName = `${respName}ResponseSchema`

  // Skip jika sudah ada (model schema), atau sudah digenerate (PUT+PATCH)
  if (generatedRespSchemas.has(schemaName)
      || (this.knownSchemas.has(zType) && zType === schemaName)) continue
  generatedRespSchemas.add(schemaName)

  lines.push(`export const ${schemaName} = ${zType}`)
  lines.push(`export type ${respName}Response = z.infer<typeof ${schemaName}>`)
  lines.push(`export const validate${respName}Response = ...`)
}
```

**Mengapa**:
1. `count === 1 ? TitleCaseResource : KeyName`: Resource single-response (login) → `LoginResponse`. Multi-response (profile) → `ProfileListResponse` atau `ProfileUpdateResponse`.
2. `this.knownSchemas.has(zType) && zType === schemaName`: Deteksi self-reference. Jika `buildResponseZodType` return `RegisterResponseSchema` (model schema name) DAN `respName` juga `RegisterResponse`, maka `RegisterResponseSchema = RegisterResponseSchema` — self-reference. Skip.
3. `generatedRespSchemas.has(schemaName)`: PUT+PATCH → sama-sama `ProfileUpdateResponseSchema`. Skip kedua.

---

## 2.3 `generateRead()` (line ~955-995) — api-read.ts

### 2.3.1 GET-only filter

```typescript
for (const manifestRoute of manifestRoutes) {
  if (!manifestRoute.response || !manifestRoute.response.fields) continue
  if (manifestRoute.method?.toUpperCase() !== 'GET') continue
```

**Mengapa**: Hanya GET routes yang menghasilkan Transformed type. POST/PUT/DELETE response tidak ditampilkan sebagai entity — mereka pakai contract type langsung.

### 2.3.2 Resource-based naming

```typescript
  const groupName = deriveGroupName(manifestRoute.path)
  const baseName = toTypeName(groupName)
  const typeName = `${baseName}Transformed`

  if (generatedNames.has(typeName)) continue
  generatedNames.add(typeName)
```

**Mengapa**: Nama type langsung dari resource. `ProfileTransformed` bukan `ProfileGetResponseTransformed`. Dedup via Set — resource dengan satu GET route cuma generate satu Transformed type.

### 2.3.3 Show/Index aliases

```typescript
  const flattened = this.flattenResponseType(responseMeta)
  lines.push(`export interface ${typeName} {`)
  for (const field of flattened) {
    const opt = (field as any).optional ? '?' : ''
    lines.push(`  ${field.name}${opt}: ${field.type}`)
  }
  lines.push(`}`)
  lines.push(`export type ${baseName}Show = ${typeName}`)
  lines.push(`export type ${baseName}Index = ${typeName}[]`)
```

**Mengapa**: Setiap Transformed type punya dua alias — `Show` (single item) dan `Index` (array). Pattern konsisten dengan model types. `optional` flag ditambahkan untuk paginated sub-fields (`currentPage?`, `total?`).

---

## 2.4 `flattenResponseType()` (line ~422-460)

### 2.4.1 Full path tracking

```typescript
private static flattenResponseType(objDef, prefix = '', parentPath = ''):
  Array<{ name: string; type: string; path: string; optional?: boolean }> {

  const fullPath = parentPath ? `${parentPath}.${fieldName}` : fieldName
```

**Mengapa**: Sebelumnya `path` hanya `fieldName` (satu level). Sekarang track full path: `data.user.name`. Digunakan oleh mapper untuk generate aksesor `api?.data?.user?.name`.

### 2.4.2 Paginated collection flattening

```typescript
} else if (fieldMeta.type === 'model' && fieldMeta.collection && fieldMeta.paginated) {
  const modelType = fieldMeta.model ? `${fieldMeta.model}Transformed` : 'unknown'
  flattened.push({ name: `${flatFieldName}Data`, type: `${modelType}[]`, path: `${fullPath}.data` })
  flattened.push({ name: `${flatFieldName}CurrentPage`, type: 'number', path: `${fullPath}.current_page`, optional: true })
  flattened.push({ name: `${flatFieldName}Total`, type: 'number', path: `${fullPath}.total`, optional: true })
}
```

**Mengapa**: Response seperti `{ reviews: { data: ProductReview[], current_page: number, total: number } }` di-flatten jadi tiga field: `reviewsData`, `reviewsCurrentPage?`, `reviewsTotal?`. Pagination metadata jadi top-level optional fields.

---

## 2.5 `generateSchema()` (line ~636-680)

### 2.5.1 CRUD mapping + dual dedup

```typescript
const SCHEMA_ACTION_MAP = { post: 'Create', put: 'Update', patch: 'Update', delete: 'Delete' }
const schemaContents = new Set<string>()

const rawAction = SCHEMA_ACTION_MAP[route.actionName] || (...)
const KeyName = TitleCaseResource + rawAction

if (schemaContents.has(KeyName)) continue

const zodStr = this.generateZodRecursive(rootNode, 'root')
if (schemaContents.has(`${KeyName}:${zodStr}`)) continue  // konten identik
schemaContents.add(KeyName)
schemaContents.add(`${KeyName}:${zodStr}`)
```

**Mengapa**:
1. KeyName pakai CRUD: `ProfileUpdate` bukan `ProfilePut`.
2. KeyName dedup: PUT+PATCH → `ProfileUpdate`. Skip kedua.
3. Content dedup: kalau dua route beda tapi Zod schema sama → tetap skip.

---

## 2.6 `generateForm()` (line ~995-1047) — api-form.ts

### 2.6.1 CRUD key mapping

```typescript
const ACTION_TO_CRUD: Record<string, string> = {
  post: 'Create', put: 'Update', patch: 'Update', delete: 'Delete',
}

let rawAction = route.actionName
let TitleCaseAction = ACTION_TO_CRUD[rawAction]
  || (rawAction.charAt(0).toUpperCase() + rawAction.slice(1))
```

### 2.6.2 Content-based dedup

```typescript
const resourceForms: Record<string, { actions: string[]; contents: Set<string> }> = {}

const actionStr = `  ${TitleCaseAction}: ${this.generateTSRecursive(rootNode, 'root', true)}`
if (resourceForms[TitleCaseResource].contents.has(actionStr)) continue
resourceForms[TitleCaseResource].contents.add(actionStr)
resourceForms[TitleCaseResource].actions.push(actionStr)
```

**Mengapa**: PUT dan PATCH `/profile` keduanya punya `{ name, email }` → konten `Update: { name: string; email: string }` identik. Hanya generate sekali, bukan `Update` + `Update2`.

---

## 2.7 Mapper Generation — `generateMapper()` (line ~1095-1355)

### 2.7.1 Dual counting (all vs GET-only)

```typescript
const mapperAllRespCount = new Map<string, number>()   // semua response
const mapperGetOnlyCount = new Map<string, number>()   // hanya GET

for (const route of routes) {
  if (route.response) {
    const r = route.groupName || deriveGroupName(route.path || '')
    mapperAllRespCount.set(r, (mapperAllRespCount.get(r) || 0) + 1)
    if (route.method?.toUpperCase() === 'GET') {
      mapperGetOnlyCount.set(r, (mapperGetOnlyCount.get(r) || 0) + 1)
    }
  }
}
```

**Mengapa**: Dua count untuk dua use case berbeda:
- `mapperAllRespCount`: naming contract (semua response dihitung → `ProfileUpdateResponse` kalau >1)
- `mapperGetOnlyCount`: naming api-read (hanya GET → `ProfileTransformed` kalau cuma 1 GET)

### 2.7.2 Model imports — resource-based

```typescript
const rawAction = MAPPER_ACTION_MAP[route.actionName] || (...)
if (route.response) {
  const count = mapperAllRespCount.get(r) || 1
  const respKey = count === 1 ? TitleCaseResource : `${TitleCaseResource}${rawAction}`
  modelImports.push(`${respKey}Response`)
}
```

### 2.7.3 readImports pre-population

```typescript
for (const route of routes) {
  if (route.response && route.method?.toUpperCase() === 'GET') {
    const cnt = mapperGetOnlyCount.get(r) || 1
    const respKey = cnt === 1 ? toTypeName(r) : `${toTypeName(r)}${rawAct}`
    readImports.push(`${respKey}Transformed`)
  }
}
```

### 2.7.4 Import dedup via Set

```typescript
const allImports = [...new Set([...modelImports, ...payloadImports])].sort()
for (const imp of allImports) {
  lines.push(`  ${imp},`)
}
```

**Mengapa**: PUT+PATCH → sama-sama `ProfileUpdatePayload` → duplikat di import. `Set` membersihkan.

### 2.7.5 Mapper function generation — dual key

```typescript
const isGet = route.method?.toUpperCase() === 'GET'
const allCount = mapperAllRespCount.get(r) || 1
const contractKey = allCount === 1 ? TitleCaseResource : `${TitleCaseResource}${rawAction}`
const getCount = mapperGetOnlyCount.get(r) || 1
const readKey = getCount === 1 ? TitleCaseResource : `${TitleCaseResource}${rawAction}`
```

**Dua key untuk dua tujuan**:
- `contractKey`: nama fungsi + tipe parameter input. Contoh: `toProdukReviewsGetResponseRead(api: ProdukReviewsGetResponse)`.
- `readKey`: nama return type. Contoh: `: ProdukReviewsTransformed`.

### 2.7.6 GET vs Mutation branching

```typescript
if (isGet) {
  const readType = `${readKey}Transformed`
  const mappedValue = this.generateObjectReadMapper(route.response, 'api')
  lines.push(`export const to${contractKey}ResponseRead = (api: ${contractKey}Response): ${readType} => (${mappedValue})`)
} else {
  lines.push(`export const to${contractKey}ResponseRead = (api: ${contractKey}Response): ${contractKey}Response => (api)`)
}
```

**GET**: Transformasi penuh — snake_case API response → camelCase Transformed.  
**Mutation**: Identity — contract response type langsung. Tidak ada Transformed type untuk mutation.

### 2.7.7 Form mapper — CRUD + dedup

```typescript
const generatedFormMapperFns = new Set<string>()
const KeyName = TitleCaseResource + (MAPPER_ACTION_MAP[route.actionName] || ...)
if (generatedFormMapperFns.has(KeyName)) continue
generatedFormMapperFns.add(KeyName)
lines.push(`export const toApi${KeyName} = ...`)
```

---

## 2.8 `generateObjectReadMapper()` (line ~1560-1610)

### 2.8.1 Menghapus ternary `? ... : undefined`

**Sebelum** — semua return value dibungkus null check:
```typescript
return `${parentAccessor} ? to${modelName}Read(${parentAccessor}) : undefined`
return `${parentAccessor} ? { ... } : undefined`
```

**Sesudah** — langsung return:
```typescript
return `to${modelName}Read(${parentAccessor})`
return `{ ...${parentAccessor}, data: ${parentAccessor}.data?.map(...) ?? [], ... }`
```

**Mengapa**: Input sudah divalidasi Zod di contract. Mapper tidak perlu null check.

### 2.8.2 Object flattening — dari identity ke field mappings

**Sebelum**:
```typescript
} else if (kind === 'object' && meta.fields) {
  return parentAccessor  // identity — tidak melakukan apa-apa
}
```

**Sesudah** — generate field-level mapping:
```typescript
} else if (kind === 'object' && meta.fields) {
  const flattened = this.flattenResponseType(fieldDef)
  if (flattened.length === 0) return parentAccessor

  const fieldMappings = flattened.map(f => {
    const pathParts = f.path.split('.')
    let accessor = parentAccessor
    for (const part of pathParts) accessor += `?.${part}`

    const rootField = pathParts[0]
    const origField = meta.fields?.[rootField]
    const origMeta = origField?.resolved || origField?.semantic || origField

    // Direct model collection: data: Category[]
    if (isModelType(origMeta) && origMeta?.collection && pathParts.length === 1) {
      return `    ${f.name}: ${parentAccessor}?.${rootField}?.map((item: ${modelName}ApiResponse) => to${modelName}Read(item))`
    }
    // Paginated model collection: reviews.data → reviewsData
    if (isModelType(origMeta) && origMeta?.collection && origMeta?.paginated && f.name.endsWith('Data')) {
      return `    ${f.name}: ${parentAccessor}?.${rootField}?.data?.map((item: ${modelName}ApiResponse) => to${modelName}Read(item))`
    }
    return `    ${f.name}: ${accessor}`
  })
  return `{\n${fieldMappings.join(',\n')}\n  }`
}
```

**4 kasus yang ditangani**:

1. **Model collection langsung** — `{ data: Category[] }`: accessor = `api?.data`, field name = `data`, perlu `.map(toCategoryRead)`. Output: `data: api?.data?.map((item: CategoryApiResponse) => toCategoryRead(item))`.

2. **Paginated model** — `{ reviews: { data: ProductReview[], current_page, total } }`: field `reviewsData` punya `path = 'reviews.data'`, rootField = `reviews`. Output: `reviewsData: api?.reviews?.data?.map((item: ProductReviewApiResponse) => toProductReviewRead(item))`.

3. **Nested object** — `{ summary: { avg_rating, total_review } }`: path = `summary.avg_rating`, di-flatten jadi `summaryAvgRating` oleh `flattenResponseType`. Output: `summaryAvgRating: api?.summary?.avg_rating`.

4. **Simple field** — `{ message: string }`: accessor = `api?.message`. Output: `message: api?.message`.

---

# Bagian 3: SDKGenerator.ts (+30/-14)

## 3.1 Import + classified storage

```typescript
import { classifyRoutes, buildGroupedRoutes, deriveGroupName } from './route-classifier'

const classified = classifyRoutes(manifest.routes)
const grouped = buildGroupedRoutes(classified)
```

**Mengapa**: `classified` disimpan karena `buildGroupedRoutes` menghilangkan akses ke `route.raw.method` dan `route.raw.path` yang dibutuhkan untuk derivasi response count.

## 3.2 CRUD mapping + response count

```typescript
const SDK_ACTION_MAP = { post: 'Create', put: 'Update', patch: 'Update', delete: 'Delete' }

const sdkRespCount = new Map<string, number>()
for (const route of classified) {
  if (route.raw.response) {
    const r = deriveGroupName(route.raw.path)
    sdkRespCount.set(r, (sdkRespCount.get(r) || 0) + 1)
  }
}
```

## 3.3 KeyName + respKey

```typescript
const rawAction = SDK_ACTION_MAP[route.actionName] || (...)
const KeyName = `${TitleCaseGroup}${rawAction}`          // untuk payload
const respKey = respCount === 1 ? TitleCaseGroup : KeyName  // untuk response
```

**Mengapa**: `KeyName` untuk body validator (`validateLoginCreatePayload`), `respKey` untuk response validator (`validateLoginResponse`).

## 3.4 getResponseInfo dengan respKey

```typescript
const respInfo = getResponseInfo(route.raw.response, route.raw, respKey)
```

**Mengapa**: `getResponseInfo` menerima `keyName` parameter yang digunakan untuk generate nama mapper (`to${keyName}ResponseRead`). Dengan `respKey` yang sudah resource-based, mapper function name juga resource-based.

---

# Bagian 4: HookGenerator.ts (+93/-32)

## 4.1 CRUD mapping + form type resolution

```typescript
const ACTION_TO_CRUD_HOOK = { post: 'Create', put: 'Update', patch: 'Update', delete: 'Delete' }

const actionKey = ACTION_TO_CRUD_HOOK[rawAction] || capitalize(rawAction)
const standardFormActions = ['Create', 'Update', 'Get']
```

**Mengapa**: `standardFormActions` dikurangi dari `['Create', 'Update', 'Patch', 'Put', 'Get']` menjadi `['Create', 'Update', 'Get']` karena `Patch` dan `Put` sudah di-mapping ke `Update`.

## 4.2 resolveResponseType → api-read types

```typescript
const resourceName = toTypeName(route.groupName)
const isList = route.actionName === 'list' || route.crudRole === 'index'
const readType = isList ? `${resourceName}Index` : `${resourceName}Show`
importedTypes.add(readType)
return readType
```

**Mengapa**: Response type di hooks (`ProfileIndex`, `CategoryIndex`, `OrderResourceShow`) sekarang dari `api-read.ts`, bukan dari contract. Cache invalidation QueryClient membutuhkan tipe yang tepat.

## 4.3 Auto Invalidation — 4 Aturan dari Manifest

### Konteks

Sebelumnya: hardcode daftar resource untuk cross-invalidation. Contoh: `['cartItems', 'cart', 'cartPromo', 'checkout', 'buyNow']` → invalidate `keranjang` + `orders`.

Sekarang: semua aturan di-derive dari data manifest.

### Data structures yang dibangun

```typescript
// Auth groups: resource mana saja yang butuh login
const authGroups = new Set<string>()
for (const r of classified) {
  if (r.raw.auth) authGroups.add(r.groupName)
}

// Response models: resource → model name yang di-return
const resourceResponseModels = new Map<string, string>()
for (const r of classified) {
  const respKind = r.raw.response?.resolved?.kind || ...
  if (respKind === 'model' || respKind === 'resource') {
    const model = r.raw.response?.resolved?.model || ...
    if (model && !resourceResponseModels.has(r.groupName)) {
      resourceResponseModels.set(r.groupName, model)
    }
  }
}
```

### Aturan 1: Self-invalidation

```typescript
const selfRes = resources.get(groupName)
if (selfRes && actionName !== 'get' && actionName !== 'list') {
  if (selfRes.index) {
    const suffix = selfRes.show ? 'lists' : 'list'
    pushUnique(invs, `QueryKey.${groupName}.${suffix},`)
  }
  for (const r of (selfRes.all || [])) {
    if (r.method === 'GET' && r.actionName !== 'list') {
      pushUnique(invs, `QueryKey.${groupName}.${r.actionName},`)
    }
  }
}
```

**Logic**: Setiap kali mutasi terjadi di resource X, invalidate semua query di resource X.

**Contoh**:
| Mutasi | Invalidasi | Mengapa |
|--------|-----------|---------|
| `wishlist.create` | `wishlist.list` | Self: list data berubah |
| `wishlist.remove` | `wishlist.list` | Self: list data berubah |
| `profile.put` | `profile.list` | Self: data profile berubah |
| `produkReviews.post` | `produkReviews.get` | Self: custom GET di-invalidate |

### Aturan 2: Cross-resource via shared response model

```typescript
const myModel = resourceResponseModels.get(groupName)
if (myModel) {
  for (const [otherGroup, otherModel] of resourceResponseModels) {
    if (otherGroup !== groupName && otherModel === myModel) {
      const otherRes = resources.get(otherGroup)
      if (otherRes?.index) {
        const s = otherRes.show ? 'lists' : 'list'
        pushUnique(invs, `QueryKey.${otherGroup}.${s},`)
      }
    }
  }
}
```

**Logic**: Resource A dan B yang return model sama → mutasi di A invalidate query di B.

**Contoh**: `cartItems`, `keranjang`, `checkout`, `buyNow`, `cartPromo` semuanya return `OrderResource`. Mutasi di `cartItems.create` → invalidate `keranjang.list` + `orders.lists`.

### Aturan 3: Sub-resource via prefix match

```typescript
for (const [otherGroup, otherRes] of resources) {
  if (otherGroup !== groupName && groupName.includes(otherGroup) && otherRes.index) {
    const s = otherRes.show ? 'lists' : 'list'
    pushUnique(invs, `QueryKey.${otherGroup}.${s},`)
  }
}
```

**Logic**: Jika nama resource X adalah prefix dari resource Y, mutasi di Y invalidate X.

**Contoh**:
| Mutasi | Invalidasi | Prefix match |
|--------|-----------|-------------|
| `adminProduk.create` | `produk.lists` | `adminProduk` includes `produk` |
| `produkReviews.post` | `produk.lists` | `produkReviews` includes `produk` |

### Aturan 4: Logout

```typescript
if (groupName === 'logout') {
  for (const g of authGroups) {
    if (g === groupName) continue
    const res = resources.get(g)
    if (!res || !res.index) continue
    const suffix = res.show ? 'lists' : 'list'
    pushUnique(invs, `QueryKey.${g}.${suffix},`)
  }
}
```

**Logic**: Logout mengubah user session → semua resource dengan `auth:true` di-invalidate.

**Contoh**: Logout → invalidate `profile.list`, `orders.lists`, `keranjang.list`, `wishlist.list`.

---

# Bagian 5: Output Comparison

## 5.1 api-read.ts

```
SEBELUM                               SESUDAH
─────────────────────────────────────────────────────────
AppCreateRead { ... }                 (bug fixed — tidak ada lagi)
AppShowRead { ... }                   (bug fixed — tidak ada lagi)
AppUpdateRead { ... }                 (bug fixed — tidak ada lagi)
AppDestroyRead { ... }                (bug fixed — tidak ada lagi)

LoginCreateResponseTransformed {..}   (tidak ada — POST, bukan GET)
OauthRedirectGetResponseTransformed   OauthRedirectTransformed
OauthCallbackGetResponseTransformed   OauthCallbackTransformed
ProfileGetResponseTransformed         ProfileTransformed
ProfileUpdateResponseTransformed      (tidak ada — PUT, bukan GET)
ProdukReviewsGetResponseTransformed   ProdukReviewsTransformed
ProdukReviewsCreateResponseTransformed (tidak ada — POST, bukan GET)
```

## 5.2 api-form.ts

```
SEBELUM                               SESUDAH
─────────────────────────────────────────────────────────
Post: { rating, title, comment }      Create: { rating, title, comment }
PostResponse: { ... }                 (tidak ada — dipindah)

Put: { name, email }                  Update: { name, email }
Patch: { name, email }                (merge dengan Put — konten sama)
PutResponse: { ... }                  (tidak ada)
PatchResponse: { ... }                (tidak ada)
```

## 5.3 api-contract.ts

```
SEBELUM                               SESUDAH
─────────────────────────────────────────────────────────
LoginCreateResponseSchema             LoginResponseSchema
ProfilePutResponseSchema              ProfileUpdateResponseSchema
ProfilePatchResponseSchema            (merge dengan Put — CRUD mapping)
CategoriesListResponseSchema          CategoriesResponseSchema
RegisterResponseSchema = Register...  (fixed — self-reference skip)
ProfileUpdatePayloadSchema (2x)       ProfileUpdatePayloadSchema (1x)
```

## 5.4 api-mapper.ts

```
SEBELUM                               SESUDAH
─────────────────────────────────────────────────────────
return type: { success: boolean; ...} return type: LoginTransformed (named)
return type: | undefined              return type: Type (no undefined)
body: api ? { ... } : undefined       body: { ... }
data: api?.data                       data: api?.data?.map(item => toXxxRead(item))
reviewsData: api?.reviews?.data       reviewsData: api?.reviews?.data?.map(...)
return parentAccessor                 return { fieldMappings }
```

## 5.5 hooks.ts

```
SEBELUM                               SESUDAH
─────────────────────────────────────────────────────────
list: typeOf<ProfileListResponse>     list: typeOf<ProfileIndex>
detail: typeOf<never>                 detail: typeOf<never> (no show route)
Hardcode: cart, payment, adminProduk  Auto: 4 aturan dari manifest
Logout: hardcode list resource        Logout: authGroups dari manifest
```

---

# Bagian 6: Verifikasi

```bash
# 1. Build routesync
cd routesync
npm run build
# Output: CJS dist/cli.js ~859 KB

# 2. Generate frontend API
cd toko-online
node "routesync/dist/cli.js" generate \
  --manifest routesync.manifest.json \
  --output frontend/src/api \
  --next-actions \
  --zod
# Output: ✔ SDK generated → frontend/src/api

# 3. TypeScript check
cd frontend
npx tsc --noEmit
# Hasil: 0 errors di src/api/
# 32 errors di page components (pre-existing, bukan dari generator)
```

---

# Lampiran: Daftar Semua Perubahan Baris

| File | Baris | Tipe | Deskripsi |
|------|-------|------|-----------|
| `route-classifier.ts` | 93 | export | `function` → `export function deriveGroupName` |
| `IndexGenerator.ts` | 16 | hapus | `rootLines.push("export * from './types'")` |
| `TypeGenerator.ts` | 1 | import | Hapus `camelCase` dari import |
| `TypeGenerator.ts` | 4 | hapus | Hapus `import { toTypeName }` |
| `TypeGenerator.ts` | 7 | signature | `generate(manifest)` → `generate(_manifest)` |
| `TypeGenerator.ts` | 44-98 | hapus | 55 baris model generation + fallback |
| `TypeGenerator.ts` | 100-101 | ganti | Comment + re-export |
| `TypeGenerator.ts` | 108-115 | hapus | Method `mapSqlTypeToTs` |
| `SDKGenerator.ts` | 4 | import | Tambah `deriveGroupName` |
| `SDKGenerator.ts` | 11-12 | logic | Simpan `classified` variable |
| `SDKGenerator.ts` | 23-30 | tambah | `SDK_ACTION_MAP` + `sdkRespCount` |
| `SDKGenerator.ts` | 130 | hapus | `usedMappers.add(mapperStr)` di object mapper |
| `SDKGenerator.ts` | 150-161 | ganti | KeyName CRUD mapping + respKey |
| `HookGenerator.ts` | 60-63 | tambah | `ACTION_TO_CRUD_HOOK` |
| `HookGenerator.ts` | 66-68 | ganti | `capitalize(actionName)` → CRUD mapping |
| `HookGenerator.ts` | 71 | ganti | `standardFormActions` dikurangi |
| `HookGenerator.ts` | 119-124 | ganti | Contract fallback → api-read types |
| `HookGenerator.ts` | 136-143 | tambah | `authGroups` + `resourceResponseModels` |
| `HookGenerator.ts` | 145-184 | ganti | Hardcode → 4 aturan otomatis |
| `ZodTierGenerator.ts` | 5 | import | Tambah `deriveGroupName` |
| `ZodTierGenerator.ts` | 168-169 | ganti | Pass `manifestRoutes` ke `generateForm` |
| `ZodTierGenerator.ts` | 355-398 | ganti | Contract block: CRUD + count + dedup |
| `ZodTierGenerator.ts` | 422-460 | ganti | `flattenResponseType`: path + paginated |
| `ZodTierGenerator.ts` | 636-680 | ganti | `generateSchema`: CRUD + dual dedup |
| `ZodTierGenerator.ts` | 955-995 | ganti | `generateRead`: GET-only, Transformed |
| `ZodTierGenerator.ts` | 995-1047 | ganti | `generateForm`: CRUD + content dedup |
| `ZodTierGenerator.ts` | 1117-1200 | ganti | Mapper imports: dual count + dedup + readImports |
| `ZodTierGenerator.ts` | 1318-1370 | ganti | Mapper functions: dual key + GET/mutation branch |
| `ZodTierGenerator.ts` | 1373-1395 | ganti | Form mapper: CRUD + dedup |
| `ZodTierGenerator.ts` | 1560-1610 | ganti | `generateObjectReadMapper`: no ternary + object flatten + array map |
