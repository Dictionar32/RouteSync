# RouteSync Interface Trace Audit — Phase 87.35

## Objective

Memperkeras model semantic upstream agar data yang sudah diverifikasi tidak kembali direklasifikasi downstream.

Target flow:

`Laravel AST → Verified Input → Semantic ADT → Bound AST → RouteSync IR → Lowerer → Emitter`

## Changes

### 1. ModelNode menjadi kontrak semantic yang benar-benar closed

`ModelColumn`, `ModelRelation`, dan `ModelAccessor` sekarang memakai contract immutable, bukan shape dengan field optional.

`ModelNode` tetap menjadi satu-satunya bentuk yang dikonsumsi semantic kernel. `ModelNodeInput` hanya berada di origin boundary dan dinormalisasi oleh `verifyModelNode()`.

### 2. SymbolTable berhenti melakukan re-classification legacy

Sebelumnya SymbolTable masih memiliki jalur:

`columns` → jika tidak ada → baca `fields`

Sekarang hanya menerima `ModelNode.columns`. Artinya semantic downstream tidak lagi menebak bentuk model berdasarkan runtime shape.

Accessor/relation/cast lookup juga membaca map terverifikasi secara langsung.

### 3. BoundQueryProjection menjadi strict

`BoundQueryProjectionNode` dan `BoundSemanticFactory.queryProjection()` sekarang mewajibkan:

- `cardinality`
- `nullability`

Tidak ada lagi default `collection/non_nullable` di constructor. Informasi cardinality/nullability harus ditentukan pada semantic origin yang memang mengetahuinya.

### 4. Context builder tidak lagi melakukan shape probing

Validator runtime lama untuk `FieldNode`/`SemanticResolution` record dihapus dari context builder. Validasi bentuk input harus terjadi sebelum data masuk semantic context.

Context assignment mengambil data dari `ModelNode` yang sudah verified.

## Ecommerce-shop trace

Contoh `ProductReview` projection:

`Laravel AST selectRaw(...)`
→ `selectRawProjection`
→ `QueryProjection(sourceModel=ProductReview, fields=[avg_rating:number,total_review:number], collection, non-null)`
→ `first()`
→ `QueryProjection(sourceModel=ProductReview, same fields, single, nullable)`
→ property access
→ downstream lowering.

Projection field tidak dipaksa menjadi column `ProductReview`. Semantic identity tetap dibawa dari upstream.

## Remaining migration boundary

Masih ada beberapa legacy boundary yang sengaja belum dihapus pada phase ini:

1. `FieldNode.resolved?` masih dipakai scanner lama. Ini adalah migration berikutnya menuju `ParsedExpression → ResolvedExpression`.
2. `FrameworkRegistryResolver` masih menggunakan registry legacy dan adapter menuju semantic ADT. Registry perlu dipindahkan menjadi typed semantic rule ADT pada origin boundary.
3. `ResolutionContext.contextModel` masih optional. Model berikutnya dapat menggantinya dengan closed ADT `ContextOwner = {kind:'global'} | {kind:'model'; model:ModelNode}` sehingga semantic resolver tidak membawa absence sebagai `undefined`.

## Verification

Targeted TypeScript check:

`npx tsc -p tsconfig.phase87.33.narrow.json --noEmit`

Changed modules checked with zero TypeScript errors.

Full repository build is not claimed clean because unrelated pre-existing errors remain outside this focused migration.
