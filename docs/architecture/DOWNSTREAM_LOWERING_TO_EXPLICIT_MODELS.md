# Arsitektur & Desain: Pemindahan Ad-Hoc Downstream Lowering Menjadi Explicit Domain Models

Dokumen ini merangkum hasil audit mendalam terhadap logika *lowering* (kompilasi/inferensi ad-hoc) yang masih dilakukan secara mandiri oleh generator-generator hilir (*downstream*), serta menetapkan desain **Explicit Domain Models** di hulu (Origin Boundary / `@routesync/core`) agar seluruh generator downstream murni menjadi **Pure Consumers**.

---

## 1. Masalah Utama: Downstream Memikul Beban Kompiler

Pada arsitektur compiler ideal, lapisan hilir (*code generators/emitters*) seharusnya hanya melakukan **transkripsi/formatting deklaratif** dari model terstruktur ke sintaks bahasa target (TypeScript, Zod, React Query).

Namun saat ini, generator hilir masih melakukan **3 bentuk lowering ad-hoc**:
1. **Graph Traversal di Hilir**: `HookGenerator` menghitung relasi database Eloquent (`belongsTo`, `hasMany`) dan merakit aturan invalidasi cache React Query menggunakan string concatenation.
2. **Signature & Grouping Re-computation**: `NextActionGenerator` mengelompokkan ulang rute secara manual dan menghitung ulang apakah rute memerlukan payload/parameter/query.
3. **Fallback Type Inference**: `SDKGenerator` melakukan perabaan heuristik jika properti `route.response.mapperName` belum diisi lengkap dari hulu.

```mermaid
graph TD
    subgraph KONDISI LAMA (AD-HOC LOWERING DI HILIR)
        M1[RouteManifest Mentah] --> HG[HookGenerator.ts]
        M1 --> NAG[NextActionGenerator.ts]
        M1 --> SG[SDKGenerator.ts]

        HG -->|Ad-Hoc Relational Graph Traversal| HG_INV[Hitung QueryKey Invalidation]
        HG -->|Ad-Hoc Response Inference| HG_TYPE[Hitung Response Type Index/Show]
        NAG -->|Ad-Hoc Dictionary Grouping| NAG_GRP[Kelompokkan Rute Manual]
        NAG -->|Ad-Hoc Boolean Branching| NAG_SIG[Hitung Signature & Payload]
        SG -->|Ad-Hoc Model/Resource Probing| SG_MAP[Rakit Mapper String]
    end

    subgraph TARGET ARSITEKTUR BARU (EXPLICIT MODEL SSOT)
        SC[StaticLaravelScanner / Kernel Origin Boundary] -->|Bentuk Model Lengkap| MM[Complete RouteManifest]
        MM -->|Guaranteed Invalidation Keys| HG2[HookGenerator: Pure Consumer]
        MM -->|Guaranteed Route Groups & Signatures| NAG2[NextActionGenerator: Pure Consumer]
        MM -->|Guaranteed Response Mappers| SG2[SDKGenerator: Pure Consumer]
    end
```

---

## 2. Audit Mendalam Area Lowering di Downstream

### Kasus A: `HookGenerator.ts` (Cache Invalidation Graph & Response Types)

* **Lokasi Kode**: [`packages/cli/src/generators/HookGenerator.ts`](file:///home/annas-zen/Documents/RouteSync/packages/cli/src/generators/HookGenerator.ts#L129-L230)
* **Logika yang Dilakukan Sendiri**:
  1. Membangun indeks balik model Eloquent `modelToGroups = new Map<string, string[]>()`.
  2. Membaca `manifest.models[].relations` dan menelusuri graf relasi `belongsTo`:
     ```typescript
     // Pembacaan relasi database langsung di dalam string generator:
     if (rel.type === 'belongsTo') {
       const parentGroups = modelToGroups.get(rel.model);
       // ... rakit string QueryKey.${parent}.lists
     }
     ```
  3. Menangani sub-resource menggunakan pencocokan substring `groupName.includes(otherGroup)`.
  4. Menangani logout dengan mengiterasi `authGroups`.
  5. Memilih sufiks `lists` vs `list` vs `detail` menggunakan ternary defensif.
* **Mengapa Bermasalah**:
  Generator kode React Hooks tidak seharusnya memahami relasi database Eloquent (`belongsTo`, `hasMany`). Aturan invalidasi cache adalah domain semantik sistem, bukan domain format teks TypeScript.

---

### Kasus B: `NextActionGenerator.ts` (Grouping & Signature Lowering)

* **Lokasi Kode**: [`packages/cli/src/generators/NextActionGenerator.ts`](file:///home/annas-zen/Documents/RouteSync/packages/cli/src/generators/NextActionGenerator.ts#L27-L61)
* **Logika yang Dilakukan Sendiri**:
  1. Mengabaikan `manifest.routeGroups` yang telah dibuat di hulu, dan membuat dictionary pengelompokan sendiri:
     ```typescript
     const grouped: Record<string, typeof classified> = {}
     for (const route of classified) {
       if (!grouped[route.groupName]) grouped[route.groupName] = [];
       grouped[route.groupName].push(route);
     }
     ```
  2. Menghitung kebutuhan parameter dan payload menggunakan disjungsi boolean bertingkat di generator hilir:
     - Mengevaluasi `hasParams`, `hasBody`, dan `hasQuery` secara manual di downstream.
     - Menentukan `requiresPayload` menggunakan rantai logika boolean ad-hoc.
* **Mengapa Bermasalah**:
  Setiap generator yang membutuhkan signature eksekusi fungsi terpaksa menyalin logika inferensi parameter ini, menciptakan duplikasi logika jika ada penambahan tipe konten request baru (misal `multipart/form-data`).

---

### Kasus C: `SDKGenerator.ts` (Response Mapper & Heuristics)

* **Lokasi Kode**: [`packages/cli/src/generators/SDKGenerator.ts`](file:///home/annas-zen/Documents/RouteSync/packages/cli/src/generators/SDKGenerator.ts#L58-L112)
* **Logika yang Dilakukan Sendiri**:
  1. Jika `route.response.mapperName` kosong, jatuh ke fallback perabaan:
     - Mencari fallback antara metadata resolved dan semantic secara defensif.
     - Pengecekan `knownResources.has(...)` vs `knownModels.has(...)`
     - Evaluasi pagination `collection` vs `paginated`
     - Perakitan string fungsi mapper `to${baseModel}ReadList` atau `to${keyName}ResponseRead`.
* **Mengapa Bermasalah**:
  Pengetahuan tentang apakah response dibungkus pagination atau resource list seharusnya sudah final saat manifes dibentuk, bukan dirakit ulang di hilir.

---

## 3. Desain Explicit Domain Models di Hulu (`@routesync/core`)

Untuk menghapus seluruh lowering ad-hoc di hilir, kita mendefinisikan **3 Explicit Model kanonikal**:

### Model 1: `RouteCacheInvalidationDescriptor` (Origin Boundary SSOT)

Definisikan model eksplisit untuk aturan invalidasi cache di [`packages/core/src/types/route.ts`](file:///home/annas-zen/Documents/RouteSync/packages/core/src/types/route.ts):

```typescript
/**
 * InvalidationTargetKind
 * 
 * Target entitas yang di-invalidate oleh sebuah aksi mutasi.
 */
export const InvalidationTargetKind = Object.freeze({
  SelfList: 'self_list',
  SelfDetail: 'self_detail',
  ParentList: 'parent_list',
  ParentDetail: 'parent_detail',
  AuthResource: 'auth_resource',
  CustomRoute: 'custom_route'
} as const);

export type InvalidationTargetKind = typeof InvalidationTargetKind[keyof typeof InvalidationTargetKind];

export interface InvalidationTarget {
  readonly groupName: string;
  readonly kind: InvalidationTargetKind;
  readonly queryKeyExpression: string; // e.g. 'QueryKey.orders.lists'
}

export interface RouteCacheInvalidationDescriptor {
  readonly targets: readonly InvalidationTarget[];
  readonly queryKeyExpressions: readonly string[]; // Array string siap pakai: ['QueryKey.orders.lists', ...]
}
```

#### Compiler Pass di Hulu (`StaticLaravelScanner.execute()`):
Scanner menghitung graf dependensi invalidasi ini **sekali di awal**:
1. Menghubungkan relasi Eloquent (`belongsTo`, `hasMany`).
2. Menghubungkan rute auth dan sub-resource.
3. Membekukan hasilnya langsung ke setiap `route.invalidation`:
   ```typescript
   route.invalidation = new ScannedRouteCacheInvalidationDescriptor({
     targets: resolvedTargets
   });
   ```

#### Konsumsi di Hilir (`HookGenerator.ts`):
```typescript
// ✅ Downstream murni mengonsumsi via switch (route.hookKind) tanpa loose if:
switch (route.hookKind) {
  case RouteHookKind.Mutation:
    for (const expr of route.invalidation.queryKeyExpressions) {
      pushUnique(invs, `          ${expr},`);
    }
    break;

  case RouteHookKind.Query:
    // Read route tidak melakukan cache invalidation
    break;
}
```
**Hasil**: 100 baris logika graf, kondisi boolean bertingkat, dan 8 ternary di `HookGenerator` langsung musnah.

---

### Model 2: `RouteExecutionSignature` (Origin Boundary SSOT)

Definisikan model eksplisit untuk signature eksekusi aksi di [`packages/core/src/types/route.ts`](file:///home/annas-zen/Documents/RouteSync/packages/core/src/types/route.ts):

```typescript
export interface RouteExecutionSignature {
  readonly hasPathParams: boolean;
  readonly hasQueryParams: boolean;
  readonly hasBody: boolean;
  readonly requiresPayload: boolean;
  readonly isPayloadOptional: boolean;
  readonly functionParameterDeclaration: string; // e.g. "payload: Parameters<typeof api.orders.get>[0]"
  readonly callArgumentsExpression: string;       // e.g. "{ params: payload.params, body: payload.body }"
}
```

#### Konsumsi di Hilir (`NextActionGenerator.ts`):
```typescript
// ✅ Downstream langsung mengonsumsi manifest.routeGroups dan executionSignature:
for (const group of manifest.routeGroups) {
  for (const route of group.routes) {
    const { functionParameterDeclaration, callArgumentsExpression } = route.executionSignature;
    lines.push(`export async function ${actionFnName}(${functionParameterDeclaration}) {`);
    lines.push(`  const data = await api.${group.resourceName}.${route.actionName}(${callArgumentsExpression});`);
    ...
  }
}
```
**Hasil**: Penghapusan 100% dictionary grouping buatan dan eliminasi evaluasi boolean berulang.

---

### Model 3: `GuaranteedResponseDescriptor` (Origin Boundary SSOT)

Pastikan `ResponseDescriptor` selalu menjamin:
1. `readTypeName`: Tipe data yang valid (bukan tebakan `'never'` atau `'unknown'`).
2. `mapperName`: Nama fungsi mapper yang pasti (misal `toOrderReadList` atau `identity`).
3. `isCollection` dan `isPaginated`: Boolean yang dijamin (bukan tipe opsional).

#### Konsumsi di Hilir (`SDKGenerator.ts`):
`SDKGenerator` hanya mendelegasikan ke factory `ScannedSdkResponseResolution` (0 null):
```typescript
const resolution = ScannedSdkResponseResolution.validatedAndMapped(
  route.response.readTypeName,
  schemaStr,
  route.response.mapperName
);
return resolution;
```
**Hasil**: 60 baris perabaan heuristik di `SDKGenerator.ts` dihapus.

---

## 4. Matriks Perbandingan Sebelum vs Sesudah

| Aspek Arsitektur | Sebelum Refactoring (Ad-Hoc Lowering) | Sesudah Refactoring (Explicit Model SSOT) |
|---|---|---|
| **Lokasi Traversal Relasi** | Di dalam `HookGenerator.ts` (string generator) | Di dalam `StaticLaravelScanner` (Origin Boundary) |
| **Pengecekan Query Key** | Rantai ternary defensif (`selfRes.show` check) | Array terstruktur `route.invalidation.queryKeyExpressions` |
| **Grouping di NextAction** | Ad-hoc `grouped: Record<string, Route[]>` | Native konsumsi `manifest.routeGroups` |
| **Signature Payload** | 4-tingkat boolean check di setiap file generator | `route.executionSignature` terstandarisasi |
| **Mapper Heuristics** | Menelusuri AST di dalam `SDKGenerator.ts` | Dijamin 100% di `route.response.mapperName` |
| **Peran Downstream** | Kompiler mini + string emitter | **Pure Consumer & String Emitter Murni** |

---

## 5. Rencana Eksekusi Bertahap

1. **Tahap 1 — Vocabulary & Contract (Core)**:
   - Tambahkan `RouteCacheInvalidationDescriptor`, `InvalidationTarget`, dan `RouteExecutionSignature` di `packages/core/src/types/route.ts`.
   - Buat structured constructor: `ScannedRouteCacheInvalidationDescriptor` & `ScannedRouteExecutionSignature`.
2. **Tahap 2 — Resolusi di Origin Boundary (`StaticLaravelScanner.ts`)**:
   - Hitung relasi model dan invalidasi saat proses scanning manifes.
   - Hitung execution signature untuk setiap route.
   - Bekukan seluruh descriptor ke dalam `ScannedRouteDescriptor`.
3. **Tahap 3 — Purifikasi Downstream (`HookGenerator.ts` & `NextActionGenerator.ts`)**:
   - Refactor `HookGenerator.ts` untuk mengonsumsi `route.invalidation.queryKeyExpressions` langsung.
   - Refactor `NextActionGenerator.ts` untuk mengonsumsi `manifest.routeGroups` dan `route.executionSignature`.
4. **Tahap 4 — Verifikasi & Test**:
   - Buat contract & integration test baru.
   - Pastikan output kode yang dihasilkan 100% identik (output determinism).

---

## 6. Kode Perbaikan Konkret (100% Constructor-Driven & Zero Ternary)

Berikut adalah implementasi arsitektur terstruktur murni menggunakan **Dedicated Structured Constructors** untuk setiap model domain, tanpa ternary dan tanpa perakitan *raw object literal*:

### 6.1. Kontrak & Structured Constructors di `@routesync/core` (`packages/core/src/types/route.ts`)

```typescript
// =========================================================================
// 1. ROUTE HOOK KIND VOCABULARY (QUERY VS MUTATION)
// =========================================================================

export const RouteHookKind = Object.freeze({
  Query: 'query',       // useQuery (GET)
  Mutation: 'mutation'  // useMutation (POST, PUT, PATCH, DELETE)
} as const);

export type RouteHookKind = typeof RouteHookKind[keyof typeof RouteHookKind];

// =========================================================================
// 2. CACHE INVALIDATION EXPLICIT MODEL & CONSTRUCTORS
// =========================================================================

export const InvalidationTargetKind = Object.freeze({
  SelfList: 'self_list',
  SelfDetail: 'self_detail',
  ParentList: 'parent_list',
  ParentDetail: 'parent_detail',
  AuthResource: 'auth_resource',
  CustomRoute: 'custom_route'
} as const);

export type InvalidationTargetKind = typeof InvalidationTargetKind[keyof typeof InvalidationTargetKind];

export interface InvalidationTarget {
  readonly groupName: string;
  readonly kind: InvalidationTargetKind;
  readonly queryKeyExpression: string; // e.g. 'QueryKey.orders.lists'
}

/**
 * Reusable Constructor: Scanned Invalidation Target.
 * Menghilangkan perakitan raw object literal dan string query key di generator hilir.
 */
export class ScannedInvalidationTarget implements InvalidationTarget {
  public readonly groupName: string;
  public readonly kind: InvalidationTargetKind;
  public readonly queryKeyExpression: string;

  constructor({
    groupName,
    kind
  }: {
    readonly groupName: string;
    readonly kind: InvalidationTargetKind;
  }) {
    this.groupName = groupName;
    this.kind = kind;
    this.queryKeyExpression = ScannedInvalidationTarget.computeQueryKey(groupName, kind);
    Object.freeze(this);
  }

  public static computeQueryKey(groupName: string, kind: InvalidationTargetKind): string {
    switch (kind) {
      case InvalidationTargetKind.SelfList:
      case InvalidationTargetKind.ParentList:
      case InvalidationTargetKind.AuthResource:
        return `QueryKey.${groupName}.lists`;
      case InvalidationTargetKind.SelfDetail:
      case InvalidationTargetKind.ParentDetail:
        return `QueryKey.${groupName}.detail`;
      case InvalidationTargetKind.CustomRoute:
      default:
        return `QueryKey.${groupName}.all`;
    }
  }

  public static selfList(groupName: string): ScannedInvalidationTarget {
    return new ScannedInvalidationTarget({ groupName, kind: InvalidationTargetKind.SelfList });
  }

  public static parentList(groupName: string): ScannedInvalidationTarget {
    return new ScannedInvalidationTarget({ groupName, kind: InvalidationTargetKind.ParentList });
  }

  public static parentDetail(groupName: string): ScannedInvalidationTarget {
    return new ScannedInvalidationTarget({ groupName, kind: InvalidationTargetKind.ParentDetail });
  }

  public static authResource(groupName: string): ScannedInvalidationTarget {
    return new ScannedInvalidationTarget({ groupName, kind: InvalidationTargetKind.AuthResource });
  }
}

export interface RouteCacheInvalidationDescriptor {
  readonly targets: readonly InvalidationTarget[];
  readonly queryKeyExpressions: readonly string[]; // ['QueryKey.orders.lists', 'QueryKey.orders.detail']
}

export interface ScannedRouteCacheInvalidationParams {
  readonly targets: readonly InvalidationTarget[];
  readonly queryKeyExpressions: readonly string[];
}

/**
 * Reusable Constructor: Route Cache Invalidation Descriptor.
 * Zero ternary, 0 tanda tanya, guaranteed frozen collections.
 */
export class ScannedRouteCacheInvalidationDescriptor implements RouteCacheInvalidationDescriptor {
  public readonly targets: readonly InvalidationTarget[];
  public readonly queryKeyExpressions: readonly string[];

  constructor({
    targets,
    queryKeyExpressions
  }: ScannedRouteCacheInvalidationParams) {
    this.targets = Object.freeze([...targets]);
    this.queryKeyExpressions = Object.freeze([...queryKeyExpressions]);
    Object.freeze(this);
  }

  public static empty(): ScannedRouteCacheInvalidationDescriptor {
    return new ScannedRouteCacheInvalidationDescriptor({
      targets: [],
      queryKeyExpressions: []
    });
  }

  public static fromTargets(targets: readonly InvalidationTarget[]): ScannedRouteCacheInvalidationDescriptor {
    const expressions = Array.from(new Set(targets.map(t => t.queryKeyExpression)));
    return new ScannedRouteCacheInvalidationDescriptor({
      targets,
      queryKeyExpressions: expressions
    });
  }
}

// =========================================================================
// 3. ROUTE EXECUTION SIGNATURE EXPLICIT MODEL & CONSTRUCTORS
// =========================================================================

export const RoutePayloadMode = Object.freeze({
  None: 'none',         // Tidak butuh parameter (e.g. GET /health, POST /logout)
  Required: 'required', // Wajib ada payload (e.g. GET /orders/:id, POST /orders)
  Optional: 'optional'  // Payload opsional (query parameters)
} as const);

export type RoutePayloadMode = typeof RoutePayloadMode[keyof typeof RoutePayloadMode];

export interface RouteExecutionSignature {
  readonly payloadMode: RoutePayloadMode;
  readonly functionParameterDeclaration: string; // e.g. "payload: Parameters<typeof api.orders.get>[0]"
  readonly callArgumentsExpression: string;       // e.g. "{ params: payload.params, body: payload.body }"
}

/**
 * Reusable Constructor: Route Execution Signature.
 * Menggunakan dedicated factory methods (zero disjunction, zero ternary).
 */
export class ScannedRouteExecutionSignature implements RouteExecutionSignature {
  public readonly payloadMode: RoutePayloadMode;
  public readonly functionParameterDeclaration: string;
  public readonly callArgumentsExpression: string;

  private constructor({
    payloadMode,
    functionParameterDeclaration,
    callArgumentsExpression
  }: {
    readonly payloadMode: RoutePayloadMode;
    readonly functionParameterDeclaration: string;
    readonly callArgumentsExpression: string;
  }) {
    this.payloadMode = payloadMode;
    this.functionParameterDeclaration = functionParameterDeclaration;
    this.callArgumentsExpression = callArgumentsExpression;
    Object.freeze(this);
  }

  // ✅ Factory 1: Rute Publik Tanpa Payload (0 let, 0 if)
  public static noPayload(): ScannedRouteExecutionSignature {
    return new ScannedRouteExecutionSignature({
      payloadMode: RoutePayloadMode.None,
      functionParameterDeclaration: '',
      callArgumentsExpression: ''
    });
  }

  // ✅ Factory 1B: Rute Terautentikasi Tanpa Payload (0 let, 0 if)
  public static authOnly(): ScannedRouteExecutionSignature {
    return new ScannedRouteExecutionSignature({
      payloadMode: RoutePayloadMode.None,
      functionParameterDeclaration: '',
      callArgumentsExpression: '{ headers: await getAuthHeaders() }'
    });
  }

  // ✅ Factory 2: Rute Dengan Payload Wajib (zero disjunction)
  public static requiredPayload(
    groupName: string,
    actionName: string,
    callArgumentsExpression: string
  ): ScannedRouteExecutionSignature {
    return new ScannedRouteExecutionSignature({
      payloadMode: RoutePayloadMode.Required,
      functionParameterDeclaration: `payload: Parameters<typeof api.${groupName}.${actionName}>[0]`,
      callArgumentsExpression
    });
  }

  // ✅ Factory 3: Rute Dengan Payload Opsional (zero disjunction)
  public static optionalPayload(
    groupName: string,
    actionName: string,
    callArgumentsExpression: string
  ): ScannedRouteExecutionSignature {
    return new ScannedRouteExecutionSignature({
      payloadMode: RoutePayloadMode.Optional,
      functionParameterDeclaration: `payload: Partial<Parameters<typeof api.${groupName}.${actionName}>[0]>`,
      callArgumentsExpression
    });
  }
}

// =========================================================================
// 3. SDK RESPONSE RESOLUTION CONSTRUCTOR (DISCRIMINATED UNION, 0 NULL, 0 OPTIONAL)
// =========================================================================

export const SdkResponseKind = Object.freeze({
  Void: 'void',                             // e.g. 204 No Content
  Raw: 'raw',                               // e.g. Read.UserTransformed (tanpa schema, tanpa mapper)
  Validated: 'validated',                   // e.g. dengan schema Zod
  Mapped: 'mapped',                         // e.g. dengan fungsi mapper
  ValidatedAndMapped: 'validated_and_mapped'// e.g. dengan schema Zod + mapper
} as const);

export type SdkResponseKind = typeof SdkResponseKind[keyof typeof SdkResponseKind];

export interface SdkResponseResolution {
  readonly kind: SdkResponseKind;
  readonly type: string;
  readonly schemaExpression: string;
  readonly mapperExpression: string;
}

/**
 * Reusable Constructor: SDK Response Resolution.
 * Menggunakan private constructor dan factory methods terarah (0 optional, 0 null, 0 let).
 */
export class ScannedSdkResponseResolution implements SdkResponseResolution {
  public readonly kind: SdkResponseKind;
  public readonly type: string;
  public readonly schemaExpression: string;
  public readonly mapperExpression: string;

  private constructor({
    kind,
    type,
    schemaExpression,
    mapperExpression
  }: {
    readonly kind: SdkResponseKind;
    readonly type: string;
    readonly schemaExpression: string;
    readonly mapperExpression: string;
  }) {
    this.kind = kind;
    this.type = type;
    this.schemaExpression = schemaExpression;
    this.mapperExpression = mapperExpression;
    Object.freeze(this);
  }

  // ✅ 1. Void Response
  public static void(): ScannedSdkResponseResolution {
    return new ScannedSdkResponseResolution({
      kind: SdkResponseKind.Void,
      type: 'void',
      schemaExpression: '',
      mapperExpression: ''
    });
  }

  // ✅ 2. Raw Response (tanpa schema, tanpa mapper)
  public static raw(readTypeName: string): ScannedSdkResponseResolution {
    return new ScannedSdkResponseResolution({
      kind: SdkResponseKind.Raw,
      type: `Read.${readTypeName}`,
      schemaExpression: '',
      mapperExpression: ''
    });
  }

  // ✅ 3. Validated Response (dengan schema, tanpa mapper)
  public static validated(readTypeName: string, schemaExpression: string): ScannedSdkResponseResolution {
    return new ScannedSdkResponseResolution({
      kind: SdkResponseKind.Validated,
      type: `Read.${readTypeName}`,
      schemaExpression,
      mapperExpression: ''
    });
  }

  // ✅ 4. Mapped Response (tanpa schema, dengan mapper)
  public static mapped(readTypeName: string, mapperExpression: string): ScannedSdkResponseResolution {
    return new ScannedSdkResponseResolution({
      kind: SdkResponseKind.Mapped,
      type: `Read.${readTypeName}`,
      schemaExpression: '',
      mapperExpression
    });
  }

  // ✅ 5. Validated & Mapped Response (dengan schema dan mapper)
  public static validatedAndMapped(
    readTypeName: string,
    schemaExpression: string,
    mapperExpression: string
  ): ScannedSdkResponseResolution {
    return new ScannedSdkResponseResolution({
      kind: SdkResponseKind.ValidatedAndMapped,
      type: `Read.${readTypeName}`,
      schemaExpression,
      mapperExpression
    });
  }
}
```

---

### 6.2. Resolusi Graph di Origin Boundary (`StaticLaravelScanner.ts`)

Mengeliminasi seluruh wrapper class perantara dan `new Map` buatan (Rule 8 AGENTS.md). Resolusi dilakukan langsung di Origin Boundary (`StaticLaravelScanner.execute()`) menggunakan koleksi native `models` dan `routeGroups` yang sudah ada:

```typescript
// =========================================================================
// ORIGIN BOUNDARY COMPILER PASS: RESOLVE CACHE INVALIDATIONS (0 NEW MAP, 0 WRAPPER)
// =========================================================================

public static resolveRouteInvalidations(
  routes: readonly ParsedRoute[],
  models: readonly ParsedModel[],
  routeGroups: readonly ResourceRouteGroup[]
): void {
  for (const route of routes) {
    switch (route.hookKind) {
      case RouteHookKind.Query:
        break;

      case RouteHookKind.Mutation: {
        const targets: InvalidationTarget[] = [];

        // A. Self Invalidation (resource group rute sendiri)
        targets.push(ScannedInvalidationTarget.selfList(route.groupName));

        // B. Database Relations Traversal langsung pada models (0 new Map, 0 wrapper)
        const matchedModel = models.find(m => m.name === route.response.resourceName);
        switch (matchedModel !== undefined) {
          case true:
            for (const rel of (matchedModel as ParsedModel).relations) {
              switch (rel.type) {
                case 'belongsTo':
                  for (const group of routeGroups) {
                    switch (group.resourceName === rel.relatedModel) {
                      case true:
                        targets.push(ScannedInvalidationTarget.parentList(group.resourceName));
                        targets.push(ScannedInvalidationTarget.parentDetail(group.resourceName));
                        break;
                      case false:
                        break;
                    }
                  }
                  break;
                default:
                  break;
              }
            }
            break;
          case false:
            break;
        }

        // C. Auth Logout Invalidation (seluruh resource protected)
        switch (route.groupName) {
          case 'logout':
            for (const otherRoute of routes) {
              switch (otherRoute.security.isProtected) {
                case true:
                  targets.push(ScannedInvalidationTarget.authResource(otherRoute.groupName));
                  break;
                case false:
                  break;
              }
            }
            break;
          default:
            break;
        }

        // Bekukan hasil langsung ke route.invalidation SSOT
        (route as any).invalidation = ScannedRouteCacheInvalidationDescriptor.fromTargets(targets);
        break;
      }
    }
  }
}
```

---

### 6.3. Refactoring Hilir: `HookGenerator.ts` Menjadi Pure Consumer

100 baris logika ad-hoc traversal di `HookGenerator.ts` dihapus dan diganti dengan konsumsi langsung:

```typescript
// ❌ HAPUS: const addCrossResourceInvalidations = (actionName: string, invs: string[]): void => { ... 100 BARIS ... }

// ✅ KONSUMSI MURNI DARI DESCRIPTOR VIA SWITCH (0 IF, 0 BOOLEAN LOGIC):
const addCrossResourceInvalidations = (route: ParsedRoute, invs: string[]): void => {
  switch (route.hookKind) {
    case RouteHookKind.Mutation:
      for (const expr of route.invalidation.queryKeyExpressions) {
        pushUnique(invs, `          ${expr},`);
      }
      break;

    case RouteHookKind.Query:
      // Rute query murni dibaca, 0 cache invalidation
      break;
  }
};
```

---

### 6.4. Refactoring Hilir: `NextActionGenerator.ts` Menjadi Pure Consumer

Loop pengelompokan manual dan percabangan boolean di `NextActionGenerator.ts` dihilangkan, murni mengonsumsi `manifest.routeGroups` dan `route.executionSignature`:

```typescript
// ❌ HAPUS: const grouped: Record<string, typeof classified> = {} ... 30 baris inferensi ...

// ✅ KONSUMSI MURNI DARI MANIFEST ROUTE GROUPS & EXECUTION SIGNATURE:
for (const group of manifest.routeGroups) {
  for (const route of group.routes) {
    const TitleCaseAction = route.actionName.charAt(0).toUpperCase() + route.actionName.slice(1);
    const actionFnName = `${group.resourceName}${TitleCaseAction}Action`;
    switch (route.executionSignature.payloadMode) {
      case RoutePayloadMode.None:
        lines.push(`export async function ${actionFnName}() {`);
        break;

      case RoutePayloadMode.Required:
      case RoutePayloadMode.Optional:
        lines.push(`export async function ${actionFnName}(${functionParameterDeclaration}) {`);
        break;
    }

    lines.push(`  try {`);
    lines.push(`    const data = await api.${group.resourceName}.${route.actionName}(${callArgumentsExpression});`);
    lines.push(`    return { success: true, data };`);
    lines.push(`  } catch (error: unknown) {`);
    lines.push(`    return { success: false, error: getErrorMessage(error) };`);
    lines.push(`  }`);
    lines.push(`}`);
    lines.push(``);
  }
}
```

---

### 6.5. Refactoring Hilir: `SDKGenerator.ts` Menjadi Pure Consumer

Fallback perabaan 60 baris di `SDKGenerator.ts` digantikan dengan konsumsi `ScannedSdkResponseResolution` dan penanganan deklaratif via `switch (resolution.kind)` (0 loose if, 0 null, 100% type-safe):

```typescript
// ✅ KONSUMSI MURNI VIA SWITCH PATTERN MATCHING (0 IF, 0 NULL):
switch (resolution.kind) {
  case SdkResponseKind.Void:
    apiBodyLines.push(`      type: 'void',`);
    break;

  case SdkResponseKind.Raw:
    apiBodyLines.push(`      type: ${resolution.type},`);
    break;

  case SdkResponseKind.Validated:
    apiBodyLines.push(`      type: ${resolution.type},`);
    apiBodyLines.push(`      schema: ${resolution.schemaExpression},`);
    break;

  case SdkResponseKind.Mapped:
    apiBodyLines.push(`      type: ${resolution.type},`);
    apiBodyLines.push(`      mapper: ${resolution.mapperExpression},`);
    break;

  case SdkResponseKind.ValidatedAndMapped:
    apiBodyLines.push(`      type: ${resolution.type},`);
    apiBodyLines.push(`      schema: ${resolution.schemaExpression},`);
    apiBodyLines.push(`      mapper: ${resolution.mapperExpression},`);
    break;
}
```


