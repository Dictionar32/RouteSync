# Compiler Types - Sistem Tipe Semantik RouteSync

## Daftar Isi

1. [Pendahuluan](#pendahuluan)
2. [Arsitektur](#arsitektur)
3. [Cara Kerja](#cara-kerja)
4. [Cara Penggunaan](#cara-penggunaan)
5. [Panduan Pengembangan](#panduan-pengembangan)
6. [Struktur Folder](#struktur-folder)
7. [Referensi Implementasi](#referensi-implementasi)

## Pendahuluan

### Tujuan Folder `compiler/types`

Folder `compiler/types` merupakan fondasi dari sistem tipe semantik RouteSync compiler. Folder ini menyediakan infrastruktur lengkap untuk representasi, manipulasi, dan analisis tipe selama proses kompilasi dari Laravel API routes menjadi TypeScript SDK yang type-safe.

Sistem tipe ini dirancang dengan prinsip compiler-grade architecture, mengikuti best practices dari compiler modern seperti:
- **Rust Compiler**: Menggunakan type interning dan structural hashing
- **TypeScript Compiler**: Implementasi structural typing dan variance
- **LLVM**: Pendekatan immutable type representation

### Peran dalam Arsitektur Compiler

Sistem tipe semantik ini berperan krusial dalam pipeline kompilasi RouteSync:

1. **Semantic Analysis Phase**: Menyediakan representasi tipe untuk Laravel models, resources, dan controller return types
2. **Type Checking**: Memvalidasi compatibility antara request/response types
3. **Code Generation**: Menghasilkan TypeScript type definitions yang akurat
4. **Optimization**: Memungkinkan type-based optimizations seperti dead code elimination

Sistem tipe ini menjadi **Single Source of Truth (SSOT)** untuk semua keputusan terkait tipe dalam compiler.

### Mengapa Kumpulan Type Ini Diperlukan

Tanpa sistem tipe yang terstruktur, compiler akan menghadapi masalah:


**1. Duplikasi Informasi Tipe**
   - Tanpa type interning, tipe yang sama akan direpresentasikan berkali-kali dalam memory
   - Mengakibatkan memory bloat untuk project besar dengan ribuan routes

**2. Inkonsistensi Type Checking**
   - Tanpa sistem tipe yang formal, setiap pass bisa memiliki interpretasi berbeda tentang tipe yang sama
   - Menyebabkan hasil kompilasi yang tidak konsisten

**3. Ketidakmampuan Menangani Tipe Kompleks**
   - Laravel memiliki tipe kompleks: generics (Collection<T>), unions (string|number), nullable types
   - Tanpa representasi formal, compiler tidak bisa menangani kasus-kasus ini dengan benar

**4. Kesulitan dalam Subtyping**
   - Laravel model inheritance (Admin extends User) membutuhkan subtyping relationship
   - Tanpa TypeHierarchy dan TypeSystem, compiler tidak bisa menentukan compatibility

**5. Performance Issues**
   - Tanpa structural hashing, type equality check akan sangat lambat (deep comparison)
   - Tanpa interning, memory footprint akan sangat besar

Sistem tipe ini menyelesaikan semua masalah di atas dengan pendekatan yang proven dari compiler-compiler modern.

## Arsitektur

### Overview Struktur File

Folder `compiler/types` terdiri dari 7 file dengan tanggung jawab yang jelas:

```
compiler/types/
├── SemanticType.ts      # Definisi tipe semantik (core type hierarchy)
├── TypeHasher.ts        # Hashing dengan cycle detection
├── TypeInterner.ts      # Deduplication dan canonical representation
├── TypeHierarchy.ts     # Interface untuk inheritance queries
├── TypeSystem.ts        # Operations: join, meet, subtyping
├── FileSpan.ts          # Source location tracking
└── index.ts             # Public API exports
```


### 1. SemanticType.ts - Core Type Hierarchy

File ini mendefinisikan seluruh hierarki tipe semantik yang digunakan compiler.

#### Enum: PrimitiveKind
Mendefinisikan tipe primitif yang didukung:
- `STRING`: Tipe string
- `NUMBER`: Tipe number (int, float)
- `BOOLEAN`: Tipe boolean
- `DATETIME`: Tipe tanggal/waktu (Carbon, DateTime)
- `UNKNOWN`: Top type, semua tipe adalah subtype dari unknown

#### Enum: CollectionKind
Mendefinisikan jenis koleksi:
- `ARRAY`: Array biasa
- `COLLECTION`: Laravel Collection
- `NULLABLE`: Wrapped nullable type (T?)

#### Abstract Class: SemanticTypeBase
Base class untuk semua tipe semantik. Menggunakan brand symbol untuk mencegah type confusion di runtime.

#### Class: PrimitiveType
Representasi tipe primitif dengan property:
- `kind`: Literal 'primitive'
- `type`: PrimitiveKind enum value

#### Class: NeverType
Bottom type dalam type hierarchy. Merepresentasikan nilai yang tidak mungkin ada (unreachable code).

#### Class: ErrorType
Merepresentasikan type error dengan pesan diagnostic. Memungkinkan compiler melanjutkan kompilasi setelah error.

Property:
- `kind`: Literal 'error'
- `diagnosticMessage`: Pesan error untuk debugging


#### Class: ReferenceType
Merepresentasikan named types dari Laravel (models, resources, DTOs).

Properties:
- `kind`: Literal 'reference'
- `namespace`: Namespace PHP (e.g., 'App\\Models')
- `name`: Nama tipe (e.g., 'User', 'ProductResource')

Digunakan untuk model Laravel, API resources, dan custom types.

#### Class: UnionType
Merepresentasikan union type (A | B | C).

Properties:
- `kind`: Literal 'union'
- `members`: ImmutableSet<SemanticType> - set dari member types

Union type digunakan untuk:
- Return type yang bisa multiple types
- Nullable types (T | null)
- Discriminated unions

#### Class: IntersectionType
Merepresentasikan intersection type (A & B & C).

Properties:
- `kind`: Literal 'intersection'
- `members`: ImmutableSet<SemanticType> - set dari intersected types

Digunakan untuk tipe yang harus memenuhi multiple constraints.

#### Class: ReadonlyCollectionType
Merepresentasikan koleksi immutable (covariant).

Properties:
- `kind`: Literal 'readonly_collection'
- `collectionKind`: CollectionKind enum
- `elementType`: SemanticType dari elemen

Readonly collection memungkinkan covariance: `ReadonlyArray<Admin>` adalah subtype dari `ReadonlyArray<User>`.


#### Class: MutableCollectionType
Merepresentasikan koleksi mutable (invariant).

Properties:
- `kind`: Literal 'mutable_collection'
- `collectionKind`: CollectionKind enum
- `elementType`: SemanticType dari elemen

Mutable collection memerlukan invariance: `MutableArray<Admin>` BUKAN subtype dari `MutableArray<User>` karena kita bisa write ke array.

#### Type: GenericVariance
Mendefinisikan variance behavior untuk generic parameters:
- `'covariant'`: Producer position (readonly), preserves subtyping
- `'contravariant'`: Consumer position (writeonly), reverses subtyping
- `'invariant'`: Both positions, requires exact match

#### Interface: GenericParameter
Definisi parameter generic dengan variance.

Properties:
- `name`: Nama parameter (e.g., 'T', 'K', 'V')
- `variance`: GenericVariance
- `type`: SemanticType yang bound ke parameter

#### Class: GenericType
Merepresentasikan parameterized types (Collection<T>, Map<K,V>).

Properties:
- `kind`: Literal 'generic'
- `base`: ReferenceType (base generic type)
- `parameters`: readonly GenericParameter[] (type arguments)

Contoh: `Collection<User>` memiliki base `Collection` dan parameter `[{name: 'T', type: User, variance: 'covariant'}]`.


#### Class: ObjectType
Merepresentasikan structural object types dengan properties.

Properties:
- `kind`: Literal 'object'
- `properties`: ImmutableMap<string, SemanticType> (property name → type)
- `requiredProperties`: ImmutableSet<string> (set nama property required)
- `baseObject`: SemanticType | undefined (parent object untuk inheritance)
- `interfaces`: readonly SemanticType[] | undefined (implemented interfaces)
- `annotations`: ImmutableMap<string, string> | undefined (metadata annotations)

ObjectType mendukung:
- Structural typing: compatibility based on shape
- Inheritance: via baseObject
- Interface implementation: via interfaces
- Required vs optional properties

#### Type Union: SemanticType
Union dari semua tipe class di atas:
```typescript
type SemanticType = 
  | PrimitiveType 
  | NeverType 
  | ErrorType 
  | ReferenceType 
  | UnionType 
  | IntersectionType 
  | ReadonlyCollectionType 
  | MutableCollectionType 
  | GenericType 
  | ObjectType
```

Ini adalah tipe utama yang digunakan di seluruh compiler untuk merepresentasikan semua tipe semantik.

### 2. TypeHasher.ts - Deterministic Hashing

File ini menyediakan hashing untuk tipe semantik dengan cycle detection.

#### Interface: HashContext
Context untuk tracking saat hashing:


Properties:
- `activeStack`: SemanticType[] - stack dari tipe yang sedang di-hash
- `finalized`: WeakMap<SemanticType, string> - cache hash yang sudah selesai

#### Class: TypeHasher
Static class untuk compute hash dari tipe semantik.

**Method: hash(type: SemanticType, context: HashContext): string**

Compute deterministic hash dengan cycle detection:
1. Check cache terlebih dahulu (finalized map)
2. Detect cycle dengan memeriksa activeStack
3. Jika cycle terdeteksi, return backreference marker `ref^N` dimana N adalah distance
4. Push ke stack, compute hash, pop dari stack
5. Cache hasil dan return

**Method (Private): computeHash(type: SemanticType, context: HashContext): string**

Internal method untuk actual hash computation tanpa cycle check.

Algoritma hashing per jenis tipe:
- **Primitive**: `primitive:<type>` (e.g., `primitive:string`)
- **Never**: `never`
- **Error**: `error:<message>`
- **Reference**: `reference:<namespace>\<name>` (e.g., `reference:App\Models\User`)
- **ReadonlyCollection**: `readonly_collection:<kind><<element_hash>>`
- **MutableCollection**: `mutable_collection:<kind><<element_hash>>`
- **Generic**: `generic:<base_hash><<param1>,<param2>,...>` dengan format parameter `name[variance]:type_hash`
- **Union**: `union[<hash1>,<hash2>,...]` (sorted untuk canonical ordering)
- **Intersection**: `intersection[<hash1>,<hash2>,...]` (sorted)
- **Object**: Complex hash mencakup properties, required props, base, interfaces, annotations (semua sorted)

Hash dijamin deterministic karena menggunakan canonical ordering (sort) untuk collections.


### 3. TypeInterner.ts - Type Deduplication

File ini menyediakan type interning untuk memory efficiency.

#### Class: TypeInterner
Maintains global cache untuk deduplikasi tipe.

**Private Property: cache**
```typescript
private cache = new Map<string, SemanticType>()
```
Map dari hash → canonical type instance.

**Method: intern(type: SemanticType): SemanticType**

Intern tipe untuk deduplication:
1. Compute structural hash menggunakan TypeHasher
2. Check cache dengan hash sebagai key
3. Jika cache hit, return cached instance
4. Jika cache miss, simpan type baru ke cache dan return

Benefit:
- Structural equality menjadi reference equality (===)
- Memory efficiency: tipe yang sama hanya tersimpan sekali
- Performance: type comparison jadi O(1) reference check

**Method: getCacheSize(): number**

Return jumlah unique types yang di-cache. Untuk debugging dan monitoring.

**Method: clear(): void**

Clear seluruh cache. Hanya digunakan antara compilation sessions.

### 4. TypeHierarchy.ts - Interface untuk Subtyping

File ini mendefinisikan interface untuk query type hierarchy.

#### Interface: TypeHierarchy

Interface kontrak untuk implementasi type hierarchy.

**Method: getParent(type: SemanticType): SemanticType | undefined**


Get parent type untuk inheritance chain traversal:
- Return parent type jika ada (e.g., Admin → User)
- Return undefined jika sudah di top of hierarchy

Digunakan oleh TypeSystem untuk subtyping checks dengan inheritance.

Implementasi konkret biasanya dilakukan oleh semantic analysis layer yang memiliki informasi tentang Laravel model inheritance.

### 5. TypeSystem.ts - Type Operations

File ini mengimplementasikan core type system operations.

#### Class: TypeSystem

Implements type lattice operations dan subtyping.

**Constructor**
```typescript
constructor(private readonly hierarchy: TypeHierarchy)
```
Menerima TypeHierarchy untuk resolusi inheritance.

**Method: join(a: SemanticType, b: SemanticType): SemanticType**

Compute least upper bound (LUB) dari dua tipe:
- `join(T, T)` = T (idempotent)
- `join(never, T)` = T (never adalah bottom type)
- `join(T, U)` = `T | U` (general case)

Join menghasilkan tipe terkecil yang merupakan supertype dari kedua input. Untuk most cases, hasilnya adalah union type.

**Method: meet(a: SemanticType, b: SemanticType): SemanticType**

Compute greatest lower bound (GLB) dari dua tipe:
- `meet(T, T)` = T (idempotent)
- `meet(T, U)` = never (jika incompatible)

Meet menghasilkan tipe terbesar yang merupakan subtype dari kedua input. Untuk most type pairs, hasilnya adalah never karena tidak ada intersection.


**Method: isSubtype(source: SemanticType, target: SemanticType): boolean**

Check apakah source adalah subtype dari target (source <: target).

Implementasi per jenis tipe:

1. **Unknown top type**: Semua tipe adalah subtype dari unknown
2. **Union source**: Distributive - semua member harus subtype dari target
3. **Primitive**: Exact match required
4. **Reference**: Traverses hierarchy chain sampai menemukan match atau mencapai top
5. **ReadonlyCollection**: Covariant - element subtyping preserved
6. **MutableCollection**: Invariant - exact element type match required
7. **Generic**: Base must match + variance-aware parameter checking:
   - Covariant: subtyping preserved (source.param <: target.param)
   - Contravariant: subtyping reversed (target.param <: source.param)
   - Invariant: exact match required (source.param === target.param)

Includes cycle detection untuk mencegah infinite loop pada recursive types.

**Method: isAssignable(source: SemanticType, target: SemanticType): boolean**

Check apakah source bisa di-assign ke target.

Assignability lebih lenient daripada subtyping:
- Includes semua subtyping relationships
- Additionally allows assignment ke union member types

Algoritma:
1. Check subtyping terlebih dahulu
2. Jika target adalah union, check assignability ke any member
3. Otherwise return false

### 6. FileSpan.ts - Source Location Tracking

File ini menyediakan representasi untuk source code locations.


#### Interface: FileSpan

Representasi offset-based untuk source location span.

Properties:
- `filePath`: string - path ke source file
- `start`: number - zero-indexed UTF-16 offset dari span start
- `length`: number - length dalam UTF-16 code units
- `line`: number - one-indexed line number (untuk display)
- `column`: number - zero-indexed column number (untuk display)

Design rationale menggunakan offset-based:
- Lexer/parser naturally produce byte offsets
- Incremental compilation requires byte-level granularity
- Offset-to-line conversion adalah O(1) dengan line map
- Compatible dengan Rust compiler, TypeScript, LLVM

Note: JavaScript strings menggunakan UTF-16, sehingga emoji dan non-BMP characters count sebagai 2 units (e.g., "😀".length === 2).

#### Interface: SourceRange

Representasi range-based untuk display/diagnostics.

Properties:
- `file`: string
- `startLine`: number
- `startChar`: number
- `endLine`: number
- `endChar`: number

Digunakan untuk LSP protocol dan error reporting dimana line/column ranges lebih intuitif.

#### Interface: ASTBaseNode

Base interface untuk semua AST nodes.

Properties:
- `span`: FileSpan

Requirement bahwa setiap AST node harus memiliki source location untuk error reporting yang akurat.


### 7. index.ts - Public API

File ini mengexport semua public APIs dari module compiler/types.

Exports:
- Semua class dan enum dari SemanticType.ts
- ImmutableMap dan ImmutableSet dari utils
- HashContext dan TypeHasher dari TypeHasher.ts
- TypeInterner dari TypeInterner.ts
- TypeHierarchy interface dari TypeHierarchy.ts
- TypeSystem dari TypeSystem.ts
- FileSpan, SourceRange, ASTBaseNode dari FileSpan.ts
- Source location utilities: LineMap, spanToRange, rangeToSpan, spanEnd, spanContains, compareSpans, mergeSpans

File ini menjadi single entry point untuk menggunakan type system.

### Hubungan Antar Type

```mermaid
graph TB
    SemanticType[SemanticType Union]
    
    SemanticType --> PrimitiveType
    SemanticType --> NeverType
    SemanticType --> ErrorType
    SemanticType --> ReferenceType
    SemanticType --> UnionType
    SemanticType --> IntersectionType
    SemanticType --> ReadonlyCollectionType
    SemanticType --> MutableCollectionType
    SemanticType --> GenericType
    SemanticType --> ObjectType
    
    UnionType --> |members| SemanticType
    IntersectionType --> |members| SemanticType
    ReadonlyCollectionType --> |elementType| SemanticType
    MutableCollectionType --> |elementType| SemanticType
    GenericType --> |base| ReferenceType
    GenericType --> |parameters| GenericParameter
    GenericParameter --> |type| SemanticType
    ObjectType --> |properties| SemanticType
    ObjectType --> |baseObject| SemanticType
    ObjectType --> |interfaces| SemanticType
    
    TypeHasher --> |hash| SemanticType
    TypeInterner --> |intern| SemanticType
    TypeInterner --> |uses| TypeHasher
    TypeSystem --> |operations on| SemanticType
    TypeSystem --> |uses| TypeHierarchy
```


### Dependency Antar File

```mermaid
graph LR
    ImmutableCollections[utils/ImmutableCollections]
    
    SemanticType[SemanticType.ts] --> ImmutableCollections
    
    TypeHasher[TypeHasher.ts] --> SemanticType
    
    TypeInterner[TypeInterner.ts] --> SemanticType
    TypeInterner --> TypeHasher
    
    TypeHierarchy[TypeHierarchy.ts] --> SemanticType
    
    TypeSystem[TypeSystem.ts] --> SemanticType
    TypeSystem --> TypeHasher
    TypeSystem --> TypeHierarchy
    TypeSystem --> ImmutableCollections
    
    FileSpan[FileSpan.ts]
    
    Index[index.ts] --> SemanticType
    Index --> TypeHasher
    Index --> TypeInterner
    Index --> TypeHierarchy
    Index --> TypeSystem
    Index --> FileSpan
    Index --> ImmutableCollections
    Index --> SourceLocation[utils/SourceLocation]
```

**Dependency rules:**
- SemanticType.ts hanya depend pada ImmutableCollections (foundational)
- TypeHasher.ts depend pada SemanticType untuk hash computation
- TypeInterner.ts depend pada SemanticType dan TypeHasher
- TypeSystem.ts depend pada SemanticType, TypeHasher, TypeHierarchy
- FileSpan.ts adalah independent (no dependencies pada type system)
- index.ts mengexport semua (barrel export pattern)

Tidak ada circular dependencies. Dependency graph adalah acyclic directed graph (DAG).

## Cara Kerja

### Alur Penggunaan Type oleh Komponen Lain

Sistem tipe digunakan dalam berbagai fase kompilasi:


#### 1. Semantic Analysis Phase

**Scanner → Semantic Resolver → Type Creation**

```typescript
// Scanner mengekstrak metadata dari Laravel
const modelMetadata = scanner.scanModel('App\\Models\\User');

// Semantic resolver membuat ReferenceType
const userType = new ReferenceType('App\\Models', 'User');

// Intern untuk deduplication
const canonicalUserType = interner.intern(userType);
```

**Type Resolution dari Laravel Resources**

```typescript
// Dari UserResource, resolver menentukan element type
const resourceElementType = new ReferenceType('App\\Models', 'User');

// Collection response
const collectionType = new ReadonlyCollectionType(
  CollectionKind.COLLECTION,
  resourceElementType
);

// Intern hasil
const canonicalCollectionType = interner.intern(collectionType);
```

#### 2. Type Checking Phase

**Validasi Response Type Compatibility**

```typescript
// Check apakah return type compatible dengan declared type
const declaredType = new ReferenceType('App\\Models', 'User');
const actualType = new ReferenceType('App\\Models', 'Admin');

// Admin extends User?
const isValid = typeSystem.isSubtype(actualType, declaredType);
// true jika Admin extends User dalam hierarchy
```

**Union Type Validation**

```typescript
// API bisa return User | Error
const unionType = new UnionType(
  new ImmutableSet(new Set([
    new ReferenceType('App\\Models', 'User'),
    new ErrorType('Not found')
  ]))
);

// Check assignability
const canAssign = typeSystem.isAssignable(actualType, unionType);
```


#### 3. Code Generation Phase

**TypeScript Type Emission**

```typescript
// Emitter converts SemanticType ke TypeScript code
function emitTypeScript(type: SemanticType): string {
  switch (type.kind) {
    case 'primitive':
      return type.type; // 'string', 'number', etc.
    
    case 'reference':
      return type.name; // 'User', 'Product'
    
    case 'readonly_collection':
      if (type.collectionKind === CollectionKind.ARRAY) {
        return `readonly ${emitTypeScript(type.elementType)}[]`;
      }
      return `ReadonlyCollection<${emitTypeScript(type.elementType)}>`;
    
    case 'union':
      const members = Array.from(type.members.values())
        .map(m => emitTypeScript(m));
      return members.join(' | ');
    
    // ... other cases
  }
}
```

**Generic Type Emission**

```typescript
// Collection<User> → Collection<User>
function emitGeneric(type: GenericType): string {
  const baseName = type.base.name;
  const params = type.parameters
    .map(p => emitTypeScript(p.type))
    .join(', ');
  return `${baseName}<${params}>`;
}
```

#### 4. Optimization Phase

**Dead Code Elimination via Type Analysis**

```typescript
// Jika return type adalah NeverType, function unreachable
if (returnType.kind === 'never') {
  // Remove function dari generated code
  optimizer.markAsDeadCode(functionNode);
}
```


**Type-based Narrowing**

```typescript
// Jika known type adalah union, narrow berdasarkan control flow
let currentType: SemanticType = unionType;

if (hasNullCheck) {
  // Remove null dari union
  currentType = removeNullFromUnion(currentType);
}
```

### Diagram Alur Penggunaan

```mermaid
sequenceDiagram
    participant Scanner
    participant SemanticResolver
    participant TypeInterner
    participant TypeSystem
    participant CodeGen
    
    Scanner->>SemanticResolver: Model metadata
    SemanticResolver->>SemanticResolver: Create ReferenceType
    SemanticResolver->>TypeInterner: intern(type)
    TypeInterner->>TypeInterner: Compute hash
    TypeInterner->>TypeInterner: Check cache
    TypeInterner-->>SemanticResolver: Canonical type
    
    SemanticResolver->>TypeSystem: isSubtype(actual, declared)
    TypeSystem->>TypeSystem: Traverse hierarchy
    TypeSystem-->>SemanticResolver: Validation result
    
    SemanticResolver->>CodeGen: Validated types
    CodeGen->>CodeGen: Emit TypeScript
    CodeGen-->>Scanner: Generated code
```

### Type Interning Flow

```mermaid
flowchart TD
    Start[Create SemanticType] --> Hash[Compute Structural Hash]
    Hash --> Check{Cache Hit?}
    Check -->|Yes| Return1[Return Cached Instance]
    Check -->|No| Store[Store in Cache]
    Store --> Return2[Return New Instance]
    
    Return1 --> UseType[Use Canonical Type]
    Return2 --> UseType
    
    UseType --> Compare[Type Comparison]
    Compare --> RefEq{Reference Equality}
    RefEq -->|Same Instance| Fast[O1 Check]
    RefEq -->|Different Instance| Slow[Deep Compare]
```


### Subtyping with Hierarchy

```mermaid
flowchart TD
    Start[isSubtype source, target] --> TopCheck{target is unknown?}
    TopCheck -->|Yes| ReturnTrue1[Return true]
    TopCheck -->|No| KindCheck{Check kinds}
    
    KindCheck -->|Reference Types| HierarchyWalk[Walk Hierarchy Chain]
    KindCheck -->|Primitive Types| ExactMatch{Exact match?}
    KindCheck -->|Collection Types| VarianceCheck[Check Variance]
    KindCheck -->|Generic Types| ParameterCheck[Check Parameters]
    
    HierarchyWalk --> CurrentType[current = source]
    CurrentType --> Loop{current exists?}
    Loop -->|No| ReturnFalse[Return false]
    Loop -->|Yes| Match{Matches target?}
    Match -->|Yes| ReturnTrue2[Return true]
    Match -->|No| GetParent[current = hierarchy.getParent]
    GetParent --> Loop
    
    ExactMatch -->|Yes| ReturnTrue3[Return true]
    ExactMatch -->|No| ReturnFalse
    
    VarianceCheck -->|Covariant| SubtypeElement[isSubtype elementTypes]
    VarianceCheck -->|Invariant| ExactElement{Exact match?}
    SubtypeElement --> ReturnResult1[Return result]
    ExactElement --> ReturnResult2[Return result]
    
    ParameterCheck --> CheckEach[Check each parameter]
    CheckEach -->|All pass| ReturnTrue4[Return true]
    CheckEach -->|Any fail| ReturnFalse
```

## Cara Penggunaan

### Membuat Tipe Primitif

```typescript
import { PrimitiveType, PrimitiveKind } from './compiler/types';

// String type
const stringType = new PrimitiveType(PrimitiveKind.STRING);

// Number type
const numberType = new PrimitiveType(PrimitiveKind.NUMBER);

// Boolean type
const booleanType = new PrimitiveType(PrimitiveKind.BOOLEAN);

// DateTime type (Carbon, DateTime)
const datetimeType = new PrimitiveType(PrimitiveKind.DATETIME);

// Unknown type (top type)
const unknownType = new PrimitiveType(PrimitiveKind.UNKNOWN);
```


### Membuat Reference Types (Laravel Models)

```typescript
import { ReferenceType } from './compiler/types';

// User model
const userType = new ReferenceType('App\\Models', 'User');

// Product model
const productType = new ReferenceType('App\\Models', 'Product');

// Admin model (extends User)
const adminType = new ReferenceType('App\\Models', 'Admin');

// API Resource
const userResourceType = new ReferenceType(
  'App\\Http\\Resources',
  'UserResource'
);
```

### Membuat Collection Types

```typescript
import { 
  ReadonlyCollectionType, 
  MutableCollectionType,
  CollectionKind 
} from './compiler/types';

// Readonly array of users (covariant)
const readonlyUsers = new ReadonlyCollectionType(
  CollectionKind.ARRAY,
  userType
);

// Mutable array of products (invariant)
const mutableProducts = new MutableCollectionType(
  CollectionKind.ARRAY,
  productType
);

// Laravel Collection<User>
const laravelCollection = new ReadonlyCollectionType(
  CollectionKind.COLLECTION,
  userType
);

// Nullable User (User | null)
const nullableUser = new ReadonlyCollectionType(
  CollectionKind.NULLABLE,
  userType
);
```

### Membuat Union Types

```typescript
import { UnionType, ImmutableSet } from './compiler/types';

// string | number
const stringOrNumber = new UnionType(
  new ImmutableSet(new Set([
    new PrimitiveType(PrimitiveKind.STRING),
    new PrimitiveType(PrimitiveKind.NUMBER)
  ]))
);

// User | Admin | null
const userUnion = new UnionType(
  new ImmutableSet(new Set([
    userType,
    adminType,
    new PrimitiveType(PrimitiveKind.UNKNOWN) // representasi null
  ]))
);
```


### Membuat Generic Types

```typescript
import { GenericType, GenericParameter } from './compiler/types';

// Collection<User>
const collectionBase = new ReferenceType('Illuminate\\Support', 'Collection');
const collectionOfUsers = new GenericType(
  collectionBase,
  [{
    name: 'T',
    variance: 'covariant',
    type: userType
  }]
);

// Map<string, User>
const mapBase = new ReferenceType('Illuminate\\Support', 'Map');
const userMap = new GenericType(
  mapBase,
  [
    {
      name: 'K',
      variance: 'invariant',
      type: new PrimitiveType(PrimitiveKind.STRING)
    },
    {
      name: 'V',
      variance: 'covariant',
      type: userType
    }
  ]
);
```

### Membuat Object Types

```typescript
import { ObjectType, ImmutableMap, ImmutableSet } from './compiler/types';

// { id: number, name: string, email: string }
const userObjectType = new ObjectType(
  new ImmutableMap(new Map([
    ['id', new PrimitiveType(PrimitiveKind.NUMBER)],
    ['name', new PrimitiveType(PrimitiveKind.STRING)],
    ['email', new PrimitiveType(PrimitiveKind.STRING)]
  ])),
  new ImmutableSet(new Set(['id', 'name', 'email'])), // all required
  undefined, // no base object
  [], // no interfaces
  new ImmutableMap(new Map()) // no annotations
);

// Object with optional property
const partialUserType = new ObjectType(
  new ImmutableMap(new Map([
    ['id', new PrimitiveType(PrimitiveKind.NUMBER)],
    ['name', new PrimitiveType(PrimitiveKind.STRING)],
    ['email', new PrimitiveType(PrimitiveKind.STRING)]
  ])),
  new ImmutableSet(new Set(['id'])), // only id required
  undefined,
  [],
  new ImmutableMap(new Map())
);
```


### Menggunakan TypeInterner

```typescript
import { TypeInterner } from './compiler/types';

// Create interner (biasanya singleton)
const interner = new TypeInterner();

// Create multiple structurally identical types
const type1 = new PrimitiveType(PrimitiveKind.STRING);
const type2 = new PrimitiveType(PrimitiveKind.STRING);

// Intern both
const interned1 = interner.intern(type1);
const interned2 = interner.intern(type2);

// Reference equality check
console.log(interned1 === interned2); // true - same instance!

// Monitor cache size
console.log(`Cached types: ${interner.getCacheSize()}`);

// Clear cache (antara compilation sessions)
interner.clear();
```

### Menggunakan TypeSystem untuk Subtyping

```typescript
import { TypeSystem } from './compiler/types';

// Create hierarchy implementation
class ModelHierarchy implements TypeHierarchy {
  private parentMap = new Map<string, SemanticType>();
  
  constructor() {
    // Admin extends User
    this.parentMap.set('Admin', userType);
  }
  
  getParent(type: SemanticType): SemanticType | undefined {
    if (type.kind === 'reference') {
      return this.parentMap.get(type.name);
    }
    return undefined;
  }
}

// Create type system
const hierarchy = new ModelHierarchy();
const typeSystem = new TypeSystem(hierarchy);

// Check subtyping
const isSubtype = typeSystem.isSubtype(adminType, userType);
console.log(isSubtype); // true - Admin <: User

// Check assignability
const canAssign = typeSystem.isAssignable(adminType, userType);
console.log(canAssign); // true
```


### Type Lattice Operations (Join/Meet)

```typescript
// Join - least upper bound (union)
const joined = typeSystem.join(stringType, numberType);
// Result: string | number

// Join with same type (idempotent)
const same = typeSystem.join(stringType, stringType);
// Result: string

// Join with never (never is bottom)
const withNever = typeSystem.join(new NeverType(), stringType);
// Result: string

// Meet - greatest lower bound
const meet = typeSystem.meet(stringType, numberType);
// Result: never (no intersection)

// Meet with same type (idempotent)
const meetSame = typeSystem.meet(stringType, stringType);
// Result: string
```

### Collection Variance

```typescript
// Covariant (readonly) - subtyping preserved
const readonlyAdmins = new ReadonlyCollectionType(
  CollectionKind.ARRAY,
  adminType
);
const readonlyUsers = new ReadonlyCollectionType(
  CollectionKind.ARRAY,
  userType
);

// Admin[] <: User[] (covariant)
const covariantCheck = typeSystem.isSubtype(readonlyAdmins, readonlyUsers);
console.log(covariantCheck); // true

// Invariant (mutable) - exact match required
const mutableAdmins = new MutableCollectionType(
  CollectionKind.ARRAY,
  adminType
);
const mutableUsers = new MutableCollectionType(
  CollectionKind.ARRAY,
  userType
);

// Admin[] NOT <: User[] (invariant)
const invariantCheck = typeSystem.isSubtype(mutableAdmins, mutableUsers);
console.log(invariantCheck); // false - requires exact match
```


### Generic Variance in Practice

```typescript
// Covariant parameter (producer)
const collectionOfAdmins = new GenericType(
  collectionBase,
  [{
    name: 'T',
    variance: 'covariant',
    type: adminType
  }]
);

const collectionOfUsers = new GenericType(
  collectionBase,
  [{
    name: 'T',
    variance: 'covariant',
    type: userType
  }]
);

// Collection<Admin> <: Collection<User> (covariant)
const covariant = typeSystem.isSubtype(
  collectionOfAdmins, 
  collectionOfUsers
);
console.log(covariant); // true

// Contravariant parameter (consumer)
const consumerOfAdmins = new GenericType(
  consumerBase,
  [{
    name: 'T',
    variance: 'contravariant',
    type: adminType
  }]
);

const consumerOfUsers = new GenericType(
  consumerBase,
  [{
    name: 'T',
    variance: 'contravariant',
    type: userType
  }]
);

// Consumer<User> <: Consumer<Admin> (contravariant - reversed!)
const contravariant = typeSystem.isSubtype(
  consumerOfUsers,
  consumerOfAdmins
);
console.log(contravariant); // true
```

### Error Handling dengan ErrorType

```typescript
import { ErrorType } from './compiler/types';

// Representasi type error
const errorType = new ErrorType('Could not resolve type: InvalidResource');

// Compiler bisa continue setelah error
function resolveType(name: string): SemanticType {
  try {
    return lookupType(name);
  } catch (err) {
    // Return error type instead of throwing
    return new ErrorType(`Failed to resolve ${name}: ${err.message}`);
  }
}

// Check untuk error type
if (resolvedType.kind === 'error') {
  console.error(`Type error: ${resolvedType.diagnosticMessage}`);
  // Continue compilation, emit diagnostic
}
```


### File Span untuk Source Locations

```typescript
import { FileSpan } from './compiler/types';

// Create span untuk AST node
const span: FileSpan = {
  filePath: 'app/Http/Controllers/UserController.php',
  start: 150,      // UTF-16 offset
  length: 25,      // length in UTF-16 units
  line: 10,        // line number (for display)
  column: 8        // column number (for display)
};

// Attach ke AST node
const astNode = {
  span,
  type: 'FunctionDeclaration',
  // ... other node data
};

// Error reporting dengan span
function reportError(span: FileSpan, message: string) {
  console.error(
    `${span.filePath}:${span.line}:${span.column}: ${message}`
  );
}

reportError(span, 'Type mismatch in return statement');
// Output: app/Http/Controllers/UserController.php:10:8: Type mismatch in return statement
```

### Complete Example: Type System Usage

```typescript
import {
  PrimitiveType,
  PrimitiveKind,
  ReferenceType,
  ReadonlyCollectionType,
  CollectionKind,
  UnionType,
  GenericType,
  ImmutableSet,
  TypeInterner,
  TypeSystem,
  TypeHierarchy
} from './compiler/types';

// 1. Setup hierarchy
class LaravelModelHierarchy implements TypeHierarchy {
  private hierarchy = new Map<string, SemanticType>([
    ['Admin', new ReferenceType('App\\Models', 'User')],
    ['SuperAdmin', new ReferenceType('App\\Models', 'Admin')],
  ]);

  getParent(type: SemanticType): SemanticType | undefined {
    if (type.kind === 'reference') {
      return this.hierarchy.get(type.name);
    }
    return undefined;
  }
}

// 2. Create type system
const hierarchy = new LaravelModelHierarchy();
const typeSystem = new TypeSystem(hierarchy);
const interner = new TypeInterner();

// 3. Create types
const userType = interner.intern(
  new ReferenceType('App\\Models', 'User')
);
const adminType = interner.intern(
  new ReferenceType('App\\Models', 'Admin')
);
const superAdminType = interner.intern(
  new ReferenceType('App\\Models', 'SuperAdmin')
);

// 4. Create collection types
const usersCollection = interner.intern(
  new ReadonlyCollectionType(CollectionKind.COLLECTION, userType)
);
const adminsCollection = interner.intern(
  new ReadonlyCollectionType(CollectionKind.COLLECTION, adminType)
);

// 5. Subtyping checks
console.log(typeSystem.isSubtype(adminType, userType)); // true
console.log(typeSystem.isSubtype(superAdminType, userType)); // true
console.log(typeSystem.isSubtype(superAdminType, adminType)); // true

// 6. Collection subtyping (covariant)
console.log(typeSystem.isSubtype(adminsCollection, usersCollection)); // true

// 7. Union types
const userOrAdmin = interner.intern(
  new UnionType(new ImmutableSet(new Set([userType, adminType])))
);

console.log(typeSystem.isAssignable(adminType, userOrAdmin)); // true
console.log(typeSystem.isAssignable(superAdminType, userOrAdmin)); // true

// 8. Monitor interner
console.log(`Total unique types: ${interner.getCacheSize()}`);
```


## Panduan Pengembangan

### Kapan Membuat Type Baru

**Buat Type Class Baru Jika:**

1. **Representasi Konsep Semantik Baru**
   - Memerlukan representasi untuk konsep yang tidak bisa diekspresikan dengan tipe existing
   - Contoh: jika butuh MixinType untuk Laravel traits, buat class baru

2. **Memerlukan Behavior Khusus**
   - Type memiliki aturan subtyping yang unik
   - Contoh: IntersectionType memiliki behavior berbeda dari UnionType

3. **Optimasi Khusus**
   - Memerlukan representasi internal yang lebih efisien
   - Contoh: StringLiteralType untuk literal string optimization

**JANGAN Buat Type Baru Jika:**

1. Bisa direpresentasikan dengan combination dari existing types
   - Nullable type → UnionType dengan unknown/null
   - Optional property → Object type dengan requiredProperties set

2. Hanya berbeda metadata
   - Gunakan annotations di ObjectType
   - Jangan membuat UserModelType, ProductModelType - gunakan ReferenceType dengan nama berbeda

### Kapan Menggunakan Interface, Type Alias, Enum, atau Generic

**Interface:**
- Untuk contract yang akan diimplementasikan oleh multiple classes
- Contoh: TypeHierarchy, HashContext
- Benefit: Extensible, dapat di-implement

**Type Alias:**
- Untuk union types atau complex type expressions
- Contoh: SemanticType (union dari semua type classes)
- Benefit: Concise, readable

**Enum:**
- Untuk closed set of named constants
- Contoh: PrimitiveKind, CollectionKind
- Benefit: Type-safe, autocomplete

**Generic:**
- Untuk reusable type logic dengan parameters
- Contoh: ImmutableMap<K, V>, ImmutableSet<T>
- Benefit: Type safety, reusability


### Best Practices Penulisan Type

**1. Immutability**

```typescript
// ✅ Good: Readonly properties
class MyType extends SemanticTypeBase {
  readonly kind = 'mytype';
  constructor(readonly data: string) {
    super();
  }
}

// ❌ Bad: Mutable properties
class BadType extends SemanticTypeBase {
  kind = 'badtype'; // Not readonly!
  data: string; // Mutable!
}
```

**2. Structural Equality**

```typescript
// ✅ Good: Define equality via TypeHasher
// Types dengan structure sama akan punya hash sama

// ❌ Bad: Custom equality methods
class BadType {
  equals(other: BadType): boolean {
    // Don't do this - use TypeHasher
  }
}
```

**3. Cycle Handling**

```typescript
// ✅ Good: Allow recursive types, let TypeHasher handle cycles
class ObjectType extends SemanticTypeBase {
  constructor(
    readonly properties: ImmutableMap<string, SemanticType>,
    readonly baseObject?: SemanticType // Can reference self
  ) {
    super();
  }
}

// ❌ Bad: Prevent recursion manually
class BadType {
  constructor(readonly ref: SemanticType) {
    if (ref === this) throw new Error('No cycles!'); // Don't do this
  }
}
```

**4. Type Brand**

```typescript
// ✅ Good: Extend SemanticTypeBase
class MyType extends SemanticTypeBase {
  readonly kind = 'mytype';
}

// ❌ Bad: Tidak menggunakan brand
class BadType {
  kind = 'badtype'; // Missing brand protection
}
```

**5. Kind Literal**

```typescript
// ✅ Good: Use literal type untuk kind
class MyType extends SemanticTypeBase {
  readonly kind = 'mytype' as const; // Literal type
}

// ❌ Bad: String type
class BadType extends SemanticTypeBase {
  readonly kind: string = 'badtype'; // Too broad
}
```


### Anti-patterns yang Harus Dihindari

**1. JANGAN Mutate Types**

```typescript
// ❌ Bad: Mutating type
const myType = new ObjectType(...);
(myType as any).properties.set('newProp', stringType); // NEVER DO THIS

// ✅ Good: Create new type
const newType = new ObjectType(
  myType.properties.set('newProp', stringType),
  myType.requiredProperties,
  myType.baseObject,
  myType.interfaces,
  myType.annotations
);
```

**2. JANGAN Store Types Without Interning**

```typescript
// ❌ Bad: Storing multiple instances
class BadRegistry {
  types: SemanticType[] = [];
  
  add(type: SemanticType) {
    this.types.push(type); // Duplicate instances possible
  }
}

// ✅ Good: Intern first
class GoodRegistry {
  types: SemanticType[] = [];
  
  constructor(private interner: TypeInterner) {}
  
  add(type: SemanticType) {
    this.types.push(this.interner.intern(type)); // Canonical instance
  }
}
```

**3. JANGAN Implement Custom Hash**

```typescript
// ❌ Bad: Custom hash method
class BadType extends SemanticTypeBase {
  hash(): string {
    return `custom-${this.kind}`; // Don't do this
  }
}

// ✅ Good: Let TypeHasher handle it
const hash = TypeHasher.hash(myType, context);
```

**4. JANGAN Deep Compare Manually**

```typescript
// ❌ Bad: Manual comparison
function typesEqual(a: SemanticType, b: SemanticType): boolean {
  if (a.kind !== b.kind) return false;
  // ... deep comparison
}

// ✅ Good: Use interned types
const a = interner.intern(typeA);
const b = interner.intern(typeB);
const equal = a === b; // Reference equality
```

**5. JANGAN Ignore Variance**

```typescript
// ❌ Bad: Assume all generics are covariant
function isSubtype(a: GenericType, b: GenericType): boolean {
  return isSubtype(a.parameters[0].type, b.parameters[0].type);
  // Ignores variance!
}

// ✅ Good: Check variance
function isSubtypeCorrect(a: GenericType, b: GenericType): boolean {
  const param = a.parameters[0];
  if (param.variance === 'covariant') {
    return isSubtype(param.type, b.parameters[0].type);
  } else if (param.variance === 'contravariant') {
    return isSubtype(b.parameters[0].type, param.type); // Reversed
  } else {
    return typesEqual(param.type, b.parameters[0].type); // Exact
  }
}
```


### Konvensi Penamaan

**Classes:**
- PascalCase dengan suffix "Type": `ReferenceType`, `UnionType`
- Exception: Classes yang bukan type node: `TypeHasher`, `TypeInterner`, `TypeSystem`

**Interfaces:**
- PascalCase tanpa prefix: `TypeHierarchy`, `HashContext`
- NOT: `ITypeHierarchy` (no Hungarian notation)

**Enums:**
- PascalCase untuk enum name: `PrimitiveKind`, `CollectionKind`
- SCREAMING_SNAKE_CASE untuk values: `STRING`, `NUMBER`, `COLLECTION`

**Properties:**
- camelCase: `elementType`, `baseObject`, `requiredProperties`
- readonly untuk semua properties: `readonly kind`, `readonly type`

**Methods:**
- camelCase: `intern()`, `isSubtype()`, `getParent()`
- Predicate methods dengan prefix `is`: `isSubtype()`, `isAssignable()`
- Query methods dengan prefix `get`: `getParent()`, `getCacheSize()`

**Type Aliases:**
- PascalCase: `SemanticType`, `GenericVariance`
- Descriptive names: `SemanticType` bukan `Type`

**Variables:**
- camelCase: `typeSystem`, `userType`, `interner`
- Descriptive: `canonicalUserType` bukan `t1`

### File Organization Standards

**1. File harus single-responsibility:**
- SemanticType.ts: Hanya type definitions
- TypeHasher.ts: Hanya hashing logic
- TypeSystem.ts: Hanya type operations

**2. Export order dalam index.ts:**
```typescript
// 1. Core types first
export { SemanticType, PrimitiveType, ... } from './SemanticType';

// 2. Supporting structures
export { ImmutableMap, ImmutableSet } from './utils';

// 3. Operations
export { TypeHasher } from './TypeHasher';
export { TypeInterner } from './TypeInterner';
export { TypeSystem } from './TypeSystem';
```

**3. Import order dalam files:**
```typescript
// 1. Node built-ins
import { ... } from 'path';

// 2. External dependencies
import { ... } from 'external-lib';

// 3. Internal - same directory
import { SemanticType } from './SemanticType';

// 4. Internal - parent/utils
import { ImmutableMap } from '../utils/ImmutableCollections';
```


## Struktur Folder

### Overview File dan Tanggung Jawab

```
compiler/types/
│
├── SemanticType.ts           [Core] Type hierarchy definitions
│   ├── Exports: 11 classes + 2 enums + 2 interfaces + 1 type union
│   ├── Dependencies: ImmutableMap, ImmutableSet
│   └── Role: Foundational type representations
│
├── TypeHasher.ts              [Operation] Structural hashing
│   ├── Exports: 1 class + 1 interface
│   ├── Dependencies: SemanticType
│   └── Role: Deterministic hash computation with cycle detection
│
├── TypeInterner.ts            [Operation] Type deduplication
│   ├── Exports: 1 class
│   ├── Dependencies: SemanticType, TypeHasher
│   └── Role: Memory optimization via canonical instances
│
├── TypeHierarchy.ts           [Interface] Inheritance queries
│   ├── Exports: 1 interface
│   ├── Dependencies: SemanticType
│   └── Role: Contract for subtyping with inheritance
│
├── TypeSystem.ts              [Operation] Type theory operations
│   ├── Exports: 1 class
│   ├── Dependencies: SemanticType, TypeHasher, TypeHierarchy
│   └── Role: Join, meet, subtyping, assignability
│
├── FileSpan.ts                [Utility] Source locations
│   ├── Exports: 3 interfaces
│   ├── Dependencies: None
│   └── Role: Source code span tracking for diagnostics
│
└── index.ts                   [Barrel] Public API exports
    ├── Exports: Everything from above files + utilities
    ├── Dependencies: All above files + utils
    └── Role: Single entry point for type system
```

### Responsibility Matrix

| File | Primary Responsibility | Secondary Responsibilities | External Dependencies |
|------|----------------------|---------------------------|---------------------|
| SemanticType.ts | Type hierarchy definition | None | ImmutableCollections |
| TypeHasher.ts | Structural hashing | Cycle detection | SemanticType |
| TypeInterner.ts | Deduplication | Cache management | SemanticType, TypeHasher |
| TypeHierarchy.ts | Inheritance contract | None | SemanticType |
| TypeSystem.ts | Type operations | Variance handling | SemanticType, TypeHasher, TypeHierarchy |
| FileSpan.ts | Source locations | None | None |
| index.ts | Public API | Re-exports | All files |


### Interaction Patterns

**Pattern 1: Type Creation → Interning → Usage**
```
SemanticType.ts → TypeInterner.ts → Consumer Code
   (Create)          (Dedupe)         (Use)
```

**Pattern 2: Type Comparison**
```
Consumer Code → TypeHasher.ts → Result
   (Types)       (Compute hash)   (Equal/Not)
```

**Pattern 3: Subtyping Check**
```
Consumer Code → TypeSystem.ts → TypeHierarchy → Result
   (Check)         (Algorithm)      (Query)      (Boolean)
```

**Pattern 4: Source Location Tracking**
```
Parser → FileSpan.ts → AST Node → Error Reporter
 (Pos)    (Create)      (Attach)     (Display)
```

## Referensi Implementasi

### Ringkasan Seluruh Type Penting

#### Hierarchy Types (SemanticType.ts)

**1. PrimitiveType**
- Purpose: Representasi scalar types
- Properties: `kind: 'primitive'`, `type: PrimitiveKind`
- Usage: string, number, boolean, datetime, unknown
- Example: `new PrimitiveType(PrimitiveKind.STRING)`

**2. NeverType**
- Purpose: Bottom type untuk unreachable code
- Properties: `kind: 'never'`
- Usage: Function yang never returns, empty unions
- Example: `new NeverType()`

**3. ErrorType**
- Purpose: Type error dengan diagnostic message
- Properties: `kind: 'error'`, `diagnosticMessage: string`
- Usage: Continue compilation after type errors
- Example: `new ErrorType('Could not resolve User')`

**4. ReferenceType**
- Purpose: Named types dari Laravel (models, resources)
- Properties: `kind: 'reference'`, `namespace: string`, `name: string`
- Usage: Laravel Models, API Resources, DTOs
- Example: `new ReferenceType('App\\Models', 'User')`

**5. UnionType**
- Purpose: Choice between multiple types (A | B | C)
- Properties: `kind: 'union'`, `members: ImmutableSet<SemanticType>`
- Usage: Multiple return types, nullable types
- Example: `new UnionType(new ImmutableSet(new Set([stringType, numberType])))`

**6. IntersectionType**
- Purpose: Combination of multiple types (A & B & C)
- Properties: `kind: 'intersection'`, `members: ImmutableSet<SemanticType>`
- Usage: Multiple constraints satisfaction
- Example: `new IntersectionType(new ImmutableSet(new Set([typeA, typeB])))`


**7. ReadonlyCollectionType**
- Purpose: Immutable collections (covariant)
- Properties: `kind: 'readonly_collection'`, `collectionKind: CollectionKind`, `elementType: SemanticType`
- Usage: Arrays, Collections yang readonly
- Variance: Covariant (ReadonlyArray<Admin> <: ReadonlyArray<User>)
- Example: `new ReadonlyCollectionType(CollectionKind.ARRAY, userType)`

**8. MutableCollectionType**
- Purpose: Mutable collections (invariant)
- Properties: `kind: 'mutable_collection'`, `collectionKind: CollectionKind`, `elementType: SemanticType`
- Usage: Arrays, Collections yang mutable
- Variance: Invariant (requires exact match)
- Example: `new MutableCollectionType(CollectionKind.ARRAY, userType)`

**9. GenericType**
- Purpose: Parameterized types (Collection<T>, Map<K,V>)
- Properties: `kind: 'generic'`, `base: ReferenceType`, `parameters: readonly GenericParameter[]`
- Usage: Laravel Collections, Maps, generic containers
- Example: `new GenericType(collectionBase, [{name: 'T', variance: 'covariant', type: userType}])`

**10. ObjectType**
- Purpose: Structural object types dengan properties
- Properties: `kind: 'object'`, `properties: ImmutableMap`, `requiredProperties: ImmutableSet`, `baseObject?: SemanticType`, `interfaces?: SemanticType[]`, `annotations?: ImmutableMap`
- Usage: Complex structured types, DTOs
- Example: Complex - see usage section

#### Operation Classes

**TypeHasher**
- Purpose: Compute deterministic structural hash
- Key Method: `hash(type: SemanticType, context: HashContext): string`
- Features: Cycle detection, canonical ordering
- Algorithm: Structural hash dengan backreference untuk cycles
- Used by: TypeInterner untuk cache keys

**TypeInterner**
- Purpose: Deduplicate types via interning
- Key Method: `intern(type: SemanticType): SemanticType`
- Features: Cache management, memory optimization
- Benefit: Reference equality untuk type comparison
- Used by: Semantic analysis passes untuk canonical types

**TypeSystem**
- Purpose: Type theory operations
- Key Methods:
  - `join(a, b)`: Least upper bound (union)
  - `meet(a, b)`: Greatest lower bound (intersection/never)
  - `isSubtype(source, target)`: Subtyping with variance
  - `isAssignable(source, target)`: Assignability check
- Features: Hierarchy traversal, variance handling
- Used by: Type checking passes, validation


#### Interface Contracts

**TypeHierarchy**
- Purpose: Provide parent type information
- Key Method: `getParent(type: SemanticType): SemanticType | undefined`
- Implementation: Provided by semantic analysis layer
- Used by: TypeSystem untuk inheritance-based subtyping
- Example: Admin → User → BaseModel

**HashContext**
- Purpose: Track state during hashing
- Properties:
  - `activeStack: SemanticType[]`: Stack untuk cycle detection
  - `finalized: WeakMap<SemanticType, string>`: Cache computed hashes
- Used by: TypeHasher internally

#### Supporting Types

**GenericParameter**
- Purpose: Generic type parameter dengan variance
- Properties:
  - `name: string`: Parameter name (T, K, V)
  - `variance: GenericVariance`: covariant/contravariant/invariant
  - `type: SemanticType`: Bound type
- Usage: Specify generic type arguments

**FileSpan**
- Purpose: Source code location span
- Properties:
  - `filePath: string`: File path
  - `start: number`: UTF-16 offset
  - `length: number`: Span length
  - `line: number`: Line number (display)
  - `column: number`: Column number (display)
- Usage: Error reporting, diagnostics

### Bagaimana Type Digunakan oleh Bagian Lain

#### 1. Semantic Analysis Passes

```typescript
// ResponseAnalysisPass menggunakan type system
class ResponseAnalysisPass implements CompilerPass {
  constructor(
    private typeSystem: TypeSystem,
    private interner: TypeInterner
  ) {}

  execute(state: CompilationState): void {
    for (const route of state.routes) {
      // Create response type
      const responseType = this.inferResponseType(route);
      
      // Intern for deduplication
      const canonical = this.interner.intern(responseType);
      
      // Store in artifact
      state.artifacts.setResponseType(route.id, canonical);
    }
  }
}
```


#### 2. Type Environment (Constraints)

```typescript
// TypeEnvironment stores dan queries types
class TypeEnvironment {
  private types = new Map<string, SemanticType>();
  
  constructor(private interner: TypeInterner) {}
  
  declare(name: string, type: SemanticType): void {
    // Always intern before storing
    this.types.set(name, this.interner.intern(type));
  }
  
  lookup(name: string): SemanticType | undefined {
    return this.types.get(name);
  }
}
```

#### 3. Code Emitters

```typescript
// TypeScriptEmitter converts SemanticType ke TS code
class TypeScriptEmitter {
  emit(type: SemanticType): string {
    switch (type.kind) {
      case 'primitive':
        return this.emitPrimitive(type);
      case 'reference':
        return type.name;
      case 'readonly_collection':
        return `readonly ${this.emit(type.elementType)}[]`;
      case 'union':
        return Array.from(type.members.values())
          .map(m => this.emit(m))
          .join(' | ');
      case 'generic':
        const params = type.parameters
          .map(p => this.emit(p.type))
          .join(', ');
        return `${type.base.name}<${params}>`;
      // ... other cases
    }
  }
}
```

#### 4. Contract IR Builder

```typescript
// ContractIRBuilder uses types untuk build IR
class ContractIRBuilder {
  constructor(
    private typeSystem: TypeSystem,
    private interner: TypeInterner
  ) {}
  
  buildContract(route: Route): ContractIR {
    // Resolve response type
    const responseType = this.resolveResponseType(route);
    const canonical = this.interner.intern(responseType);
    
    // Check compatibility dengan declared type
    if (route.declaredType) {
      const compatible = this.typeSystem.isAssignable(
        canonical,
        route.declaredType
      );
      
      if (!compatible) {
        throw new TypeError('Response type incompatible');
      }
    }
    
    return {
      responseType: canonical,
      // ... other IR data
    };
  }
}
```


#### 5. Verification Pass

```typescript
// Verifier checks type consistency
class TypeVerifier {
  constructor(private typeSystem: TypeSystem) {}
  
  verify(artifacts: ArtifactRegistry): DiagnosticMessage[] {
    const diagnostics: DiagnosticMessage[] = [];
    
    for (const contract of artifacts.getAllContracts()) {
      // Check request/response type consistency
      if (contract.requestType && contract.responseType) {
        // Ensure response doesn't leak request internals
        const leaked = this.checkForLeakedTypes(
          contract.requestType,
          contract.responseType
        );
        
        if (leaked) {
          diagnostics.push({
            message: 'Response type leaks request internals',
            span: contract.span
          });
        }
      }
      
      // Verify subtyping relationships
      if (contract.declaredReturnType) {
        const compatible = this.typeSystem.isSubtype(
          contract.responseType,
          contract.declaredReturnType
        );
        
        if (!compatible) {
          diagnostics.push({
            message: `Response type ${contract.responseType} not subtype of ${contract.declaredReturnType}`,
            span: contract.span
          });
        }
      }
    }
    
    return diagnostics;
  }
}
```

#### 6. Optimization Pass

```typescript
// DeadCodeElimination uses type analysis
class DeadCodeElimination {
  optimize(contracts: ContractIR[]): ContractIR[] {
    return contracts.filter(contract => {
      // Remove contracts dengan never return type
      if (contract.responseType.kind === 'never') {
        return false; // Dead code
      }
      
      // Remove unreachable type branches
      if (contract.responseType.kind === 'union') {
        const reachableMembers = Array.from(
          contract.responseType.members.values()
        ).filter(member => member.kind !== 'never');
        
        if (reachableMembers.length === 0) {
          return false; // Dead code
        }
      }
      
      return true;
    });
  }
}
```

### Integration Points Summary

| Component | Uses Type System For | Key Operations |
|-----------|---------------------|----------------|
| Semantic Passes | Type inference, resolution | Create, intern types |
| Type Environment | Store/query types | Declare, lookup with interning |
| Emitters | Code generation | Pattern match on kind, emit syntax |
| IR Builder | Contract construction | Type compatibility checks |
| Verifier | Validation | Subtyping, assignability checks |
| Optimizer | Dead code elimination | Type analysis, never detection |
| Error Reporter | Diagnostics | FileSpan → error messages |


### Performance Characteristics

**TypeHasher:**
- Time Complexity: O(n) where n is structural depth of type
- Space Complexity: O(d) where d is recursion depth (stack)
- Cycle Detection: O(1) per check (array indexOf)
- Cache Hit: O(1) (WeakMap lookup)

**TypeInterner:**
- Intern Operation: O(h) where h is hash computation time
- Cache Lookup: O(1) (Map get)
- Memory: O(u) where u is unique types count
- Benefit: Reduces memory by factor of duplicate count

**TypeSystem:**
- isSubtype: O(h) where h is hierarchy depth
- isAssignable: O(h + m) where m is union member count
- join: O(1) (creates union)
- meet: O(1) (returns never for most cases)

**FileSpan:**
- All operations: O(1) (simple property access)

### Memory Layout

```
Typical Type System Memory Usage (1000 routes):
─────────────────────────────────────────────────
Type Instances (without interning):  ~500KB
Type Instances (with interning):     ~200KB (60% reduction)
TypeInterner Cache:                  ~100KB
TypeHasher finalized cache:          ~80KB (per compilation)
Total:                               ~380KB

Benefits:
- 60% memory reduction via interning
- O(1) type equality via reference comparison
- Reduced GC pressure (fewer objects)
```

### Thread Safety

**Immutability Guarantees:**
- All SemanticType instances are immutable (readonly properties)
- ImmutableMap and ImmutableSet enforce immutability
- Safe untuk concurrent reads tanpa synchronization

**Shared State:**
- TypeInterner cache is NOT thread-safe (use separate instances per thread)
- TypeHasher finalized cache is per-context (thread-local via parameter)
- TypeSystem is stateless (safe untuk concurrent use)

**Recommendation:**
```typescript
// Per-thread setup
class CompilationThread {
  private interner = new TypeInterner(); // Thread-local
  private typeSystem: TypeSystem; // Shared (stateless)
  
  constructor(sharedHierarchy: TypeHierarchy) {
    this.typeSystem = new TypeSystem(sharedHierarchy);
  }
}
```


### Testing Strategy

**Unit Tests:**
```typescript
describe('TypeInterner', () => {
  let interner: TypeInterner;
  
  beforeEach(() => {
    interner = new TypeInterner();
  });
  
  it('should return same instance for structurally equal types', () => {
    const type1 = new PrimitiveType(PrimitiveKind.STRING);
    const type2 = new PrimitiveType(PrimitiveKind.STRING);
    
    const interned1 = interner.intern(type1);
    const interned2 = interner.intern(type2);
    
    expect(interned1).toBe(interned2); // Reference equality
  });
  
  it('should cache types correctly', () => {
    const type = new ReferenceType('App\\Models', 'User');
    
    interner.intern(type);
    expect(interner.getCacheSize()).toBe(1);
    
    interner.intern(type); // Same type
    expect(interner.getCacheSize()).toBe(1); // No growth
  });
});

describe('TypeSystem', () => {
  let hierarchy: TypeHierarchy;
  let typeSystem: TypeSystem;
  
  beforeEach(() => {
    hierarchy = new TestHierarchy();
    typeSystem = new TypeSystem(hierarchy);
  });
  
  it('should check subtyping correctly', () => {
    const adminType = new ReferenceType('App\\Models', 'Admin');
    const userType = new ReferenceType('App\\Models', 'User');
    
    expect(typeSystem.isSubtype(adminType, userType)).toBe(true);
    expect(typeSystem.isSubtype(userType, adminType)).toBe(false);
  });
  
  it('should handle variance correctly', () => {
    const readonlyAdmins = new ReadonlyCollectionType(
      CollectionKind.ARRAY,
      adminType
    );
    const readonlyUsers = new ReadonlyCollectionType(
      CollectionKind.ARRAY,
      userType
    );
    
    // Covariant
    expect(typeSystem.isSubtype(readonlyAdmins, readonlyUsers)).toBe(true);
  });
});

describe('TypeHasher', () => {
  it('should produce consistent hashes', () => {
    const ctx: HashContext = { activeStack: [], finalized: new WeakMap() };
    
    const type1 = new PrimitiveType(PrimitiveKind.STRING);
    const type2 = new PrimitiveType(PrimitiveKind.STRING);
    
    const hash1 = TypeHasher.hash(type1, ctx);
    const hash2 = TypeHasher.hash(type2, ctx);
    
    expect(hash1).toBe(hash2);
  });
  
  it('should handle cycles correctly', () => {
    const ctx: HashContext = { activeStack: [], finalized: new WeakMap() };
    
    // Create recursive type (simplified example)
    const recursiveType = new ObjectType(
      new ImmutableMap(new Map()),
      new ImmutableSet(new Set()),
      undefined, // Will reference self in real scenario
      [],
      new ImmutableMap(new Map())
    );
    
    // Should not throw
    expect(() => TypeHasher.hash(recursiveType, ctx)).not.toThrow();
  });
});
```


### Debugging Tips

**1. Inspecting Type Structure:**
```typescript
// Utility untuk pretty-print types
function inspectType(type: SemanticType, depth = 0): string {
  const indent = '  '.repeat(depth);
  
  switch (type.kind) {
    case 'primitive':
      return `${indent}Primitive(${type.type})`;
    
    case 'reference':
      return `${indent}Reference(${type.namespace}\\${type.name})`;
    
    case 'union':
      const members = Array.from(type.members.values())
        .map(m => inspectType(m, depth + 1))
        .join('\n');
      return `${indent}Union(\n${members}\n${indent})`;
    
    case 'readonly_collection':
      return `${indent}ReadonlyCollection(${type.collectionKind})\n${inspectType(type.elementType, depth + 1)}`;
    
    // ... other cases
  }
}

// Usage
console.log(inspectType(myComplexType));
```

**2. Tracking Type Creation:**
```typescript
// Wrapper untuk debugging
class DebugTypeInterner extends TypeInterner {
  intern(type: SemanticType): SemanticType {
    const result = super.intern(type);
    
    if (result !== type) {
      console.log('Cache hit:', inspectType(type));
    } else {
      console.log('Cache miss:', inspectType(type));
    }
    
    return result;
  }
}
```

**3. Subtyping Chain Visualization:**
```typescript
function visualizeSubtypingChain(
  type: SemanticType,
  hierarchy: TypeHierarchy
): string[] {
  const chain: string[] = [];
  let current: SemanticType | undefined = type;
  
  while (current) {
    if (current.kind === 'reference') {
      chain.push(`${current.namespace}\\${current.name}`);
    } else {
      chain.push(current.kind);
    }
    
    current = hierarchy.getParent(current);
  }
  
  return chain;
}

// Usage
const chain = visualizeSubtypingChain(adminType, hierarchy);
console.log('Subtyping chain:', chain.join(' → '));
// Output: App\Models\Admin → App\Models\User → App\Models\Model
```

**4. Hash Comparison:**
```typescript
function compareTypeHashes(a: SemanticType, b: SemanticType): void {
  const ctx: HashContext = { activeStack: [], finalized: new WeakMap() };
  
  const hashA = TypeHasher.hash(a, ctx);
  const hashB = TypeHasher.hash(b, ctx);
  
  console.log('Type A hash:', hashA);
  console.log('Type B hash:', hashB);
  console.log('Equal:', hashA === hashB);
}
```


### Common Pitfalls dan Solutions

**Pitfall 1: Forgetting to Intern Types**
```typescript
// ❌ Problem
const type1 = new PrimitiveType(PrimitiveKind.STRING);
const type2 = new PrimitiveType(PrimitiveKind.STRING);
if (type1 === type2) { } // Always false!

// ✅ Solution
const interned1 = interner.intern(type1);
const interned2 = interner.intern(type2);
if (interned1 === interned2) { } // Correct!
```

**Pitfall 2: Mutating Types After Creation**
```typescript
// ❌ Problem
const objType = new ObjectType(...);
(objType.properties as any).set('newKey', newType); // Mutating!

// ✅ Solution
const newProperties = objType.properties.set('newKey', newType);
const newObjType = new ObjectType(
  newProperties,
  objType.requiredProperties,
  objType.baseObject,
  objType.interfaces,
  objType.annotations
);
```

**Pitfall 3: Ignoring Variance in Generic Checks**
```typescript
// ❌ Problem
function checkGeneric(a: GenericType, b: GenericType): boolean {
  // Always assumes covariance
  return typeSystem.isSubtype(
    a.parameters[0].type,
    b.parameters[0].type
  );
}

// ✅ Solution
function checkGenericCorrect(a: GenericType, b: GenericType): boolean {
  const param = a.parameters[0];
  switch (param.variance) {
    case 'covariant':
      return typeSystem.isSubtype(param.type, b.parameters[0].type);
    case 'contravariant':
      return typeSystem.isSubtype(b.parameters[0].type, param.type);
    case 'invariant':
      const ctx: HashContext = { activeStack: [], finalized: new WeakMap() };
      return TypeHasher.hash(param.type, ctx) === 
             TypeHasher.hash(b.parameters[0].type, ctx);
  }
}
```

**Pitfall 4: Circular Dependencies dalam Hierarchy**
```typescript
// ❌ Problem
class BrokenHierarchy implements TypeHierarchy {
  getParent(type: SemanticType): SemanticType | undefined {
    // Creates cycle: A → B → A
    if (type.kind === 'reference' && type.name === 'A') {
      return new ReferenceType('', 'B');
    }
    if (type.kind === 'reference' && type.name === 'B') {
      return new ReferenceType('', 'A'); // Cycle!
    }
  }
}

// ✅ Solution
class CorrectHierarchy implements TypeHierarchy {
  private visited = new WeakSet<SemanticType>();
  
  getParent(type: SemanticType): SemanticType | undefined {
    if (this.visited.has(type)) {
      return undefined; // Prevent cycle
    }
    this.visited.add(type);
    
    // Normal hierarchy logic
    return this.lookupParent(type);
  }
}
```


### Migration Guide (Jika Mengubah Type System)

**Scenario: Adding New Type Class**

```typescript
// Step 1: Define new type class in SemanticType.ts
export class TupleType extends SemanticTypeBase {
  readonly kind = 'tuple';
  constructor(readonly elements: readonly SemanticType[]) {
    super();
  }
}

// Step 2: Update SemanticType union
export type SemanticType = 
  | PrimitiveType
  | ...
  | TupleType; // Add here

// Step 3: Update TypeHasher.computeHash()
private static computeHash(type: SemanticType, context: HashContext): string {
  switch (type.kind) {
    // ... existing cases
    case 'tuple':
      const elemHashes = type.elements.map(e => this.hash(e, context));
      return `tuple[${elemHashes.join(',')}]`;
  }
}

// Step 4: Update TypeSystem methods if needed
public isSubtype(source: SemanticType, target: SemanticType): boolean {
  // ... existing logic
  
  // Tuple subtyping (element-wise covariant)
  if (source.kind === 'tuple' && target.kind === 'tuple') {
    if (source.elements.length !== target.elements.length) {
      return false;
    }
    return source.elements.every((s, i) => 
      this.isSubtype(s, target.elements[i])
    );
  }
}

// Step 5: Update emitters untuk code generation
// In TypeScriptEmitter.ts
case 'tuple':
  const elements = type.elements.map(e => this.emit(e));
  return `[${elements.join(', ')}]`;

// Step 6: Update tests
describe('TupleType', () => {
  it('should intern correctly', () => {
    const tuple1 = new TupleType([stringType, numberType]);
    const tuple2 = new TupleType([stringType, numberType]);
    
    const interned1 = interner.intern(tuple1);
    const interned2 = interner.intern(tuple2);
    
    expect(interned1).toBe(interned2);
  });
  
  it('should check subtyping correctly', () => {
    const adminTuple = new TupleType([adminType, numberType]);
    const userTuple = new TupleType([userType, numberType]);
    
    expect(typeSystem.isSubtype(adminTuple, userTuple)).toBe(true);
  });
});

// Step 7: Export dari index.ts
export { TupleType } from './SemanticType';
```


### Future Enhancements

**Potential Extensions:**

1. **Nominal Types**
   - Currently all types are structural
   - Could add nominal typing untuk branded types
   - Example: `UserId` distinct from `number`

2. **Type Aliases**
   - Store type alias information
   - Preserve alias names dalam diagnostics
   - Example: `type UserID = number` preserves name

3. **Conditional Types**
   - Support untuk conditional type logic
   - Example: `T extends U ? X : Y`

4. **Template Literal Types**
   - String literal template types
   - Example: `template-${string}-suffix`

5. **Mapped Types**
   - Transform object type properties
   - Example: `{ [K in keyof T]: T[K] | null }`

6. **Type Constraints**
   - Add constraint checking untuk generics
   - Example: `T extends Comparable`

### Related Documentation

- **Compiler Architecture**: `../README.md` - Overview compiler architecture
- **Pass System**: `../passes/README.md` - Compiler pass architecture
- **IR System**: `../ir/README.md` - Intermediate representation
- **Verification**: `../verification/README.md` - Type verification
- **Optimization**: `../optimization/README.md` - Type-based optimizations

### External Resources

**Type Theory Background:**
- Pierce, B. C. (2002). *Types and Programming Languages*. MIT Press.
- Harper, R. (2016). *Practical Foundations for Programming Languages*. Cambridge University Press.

**Compiler Design:**
- Appel, A. W. (1998). *Modern Compiler Implementation in ML*. Cambridge University Press.
- Aho, A. V., et al. (2006). *Compilers: Principles, Techniques, and Tools*. Pearson.

**Variance and Subtyping:**
- Torgersen, M., et al. (2004). "Adding Wildcards to the Java Programming Language"
- Kennedy, A., & Pierce, B. (2007). "On Decidability of Nominal Subtyping with Variance"

### Glossary

**Covariance**: Subtyping preserved in generic parameters (Producer<Admin> <: Producer<User>)

**Contravariance**: Subtyping reversed in generic parameters (Consumer<User> <: Consumer<Admin>)

**Invariance**: Exact type match required in generic parameters

**Interning**: Deduplication technique ensuring single canonical instance per structural type

**Structural Typing**: Type compatibility based on structure/shape, not names

**Nominal Typing**: Type compatibility based on explicit declarations, not structure

**Bottom Type**: Type dengan no values (never), subtype dari semua types

**Top Type**: Type containing all values (unknown), supertype dari semua types

**Type Lattice**: Partially ordered set of types dengan join (LUB) dan meet (GLB) operations

**Subtyping**: Relationship where values of subtype dapat digunakan dimana supertype expected

**Assignability**: More lenient relationship than subtyping, includes union member checks


### Conclusion

Folder `compiler/types` menyediakan sistem tipe semantik yang lengkap dan robust untuk RouteSync compiler. Dengan pendekatan yang terinspirasi dari compiler modern seperti Rust, TypeScript, dan LLVM, sistem ini menjamin:

1. **Type Safety**: Semua tipe di-check secara statik dengan strict rules
2. **Memory Efficiency**: Type interning mengurangi memory footprint hingga 60%
3. **Performance**: O(1) type equality checks via reference comparison
4. **Correctness**: Variance-aware subtyping dan assignability checks
5. **Maintainability**: Clean separation of concerns, immutable design
6. **Extensibility**: Easy to add new type kinds tanpa breaking existing code

Sistem tipe ini adalah **Single Source of Truth** untuk semua keputusan terkait tipe dalam compiler, memastikan consistency dan correctness di seluruh pipeline kompilasi.

---

**Dokumen ini mencakup:**
- ✅ Tujuan dan peran sistem tipe
- ✅ Arsitektur lengkap dengan dependency graph
- ✅ Cara kerja internal setiap komponen
- ✅ Contoh penggunaan praktis
- ✅ Panduan pengembangan dan best practices
- ✅ Anti-patterns dan cara menghindarinya
- ✅ Konvensi penamaan dan struktur
- ✅ Referensi implementasi lengkap
- ✅ Integration points dengan komponen lain
- ✅ Performance characteristics
- ✅ Testing strategy dan debugging tips

**Versi Dokumen:** 1.0  
**Terakhir Diperbarui:** 2024  
**Maintainer:** RouteSync Core Team

---

Untuk pertanyaan atau kontribusi, silakan buka issue di repository atau hubungi tim maintainer.
