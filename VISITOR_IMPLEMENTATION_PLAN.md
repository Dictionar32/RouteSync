# Rencana Implementasi Visitor Pattern (Sistem Saraf)

**Tanggal**: 4 Agustus 2026  
**Status**: Planning  
**Tujuan**: Menghubungkan semua node (tulang) dengan visitor (otak) menggunakan accept() method (saraf)

---

## Analogi Sistem

```
┌─────────────┐
│   SKELETON  │ ← Struktur data (tulang/kerangka)
│   (Nodes)   │   TSFile, TSInterface, dst
└──────┬──────┘
       │
       │ accept() ← SARAF (neural pathway)
       │
       ▼
┌─────────────┐
│   VISITOR   │ ← Logic/Processing (otak)
│   (Brain)   │   Generator, Formatter, Emitter
└─────────────┘
```

---

## Fase Implementasi

### Fase 1: Tambah Import TSVisitor ✅ (TSFile sudah)
### Fase 2: Tambah accept() Method ke Semua Node
### Fase 3: Test Visitor Traversal
### Fase 4: Implement Base Visitor Logic

---

## Node-by-Node Implementation Checklist

### ✅ Root Node (1/1) - COMPLETE
- [x] TSFile - `visitor.visitFile(this)` ✅

### ✅ Declaration Nodes (3/3) - COMPLETE
- [x] TSInterfaceDeclaration - `visitor.visitInterfaceDeclaration(this)` ✅
- [x] TSTypeAliasDeclaration - `visitor.visitTypeAliasDeclaration(this)` ✅
- [x] TSFunctionDeclaration - `visitor.visitFunctionDeclaration(this)` ✅

### ✅ Type Nodes (4/4) - COMPLETE
- [x] TSTypeReference - `visitor.visitTypeReference(this)` ✅
- [x] TSArrayType - `visitor.visitArrayType(this)` ✅
- [x] TSUnionType - `visitor.visitUnionType(this)` ✅
- [x] TSIntersectionType - `visitor.visitIntersectionType(this)` ✅

### ✅ Member Nodes (2/2) - COMPLETE
- [x] TSPropertySignature - `visitor.visitPropertySignature(this)` ✅
- [x] TSMethodSignature - `visitor.visitMethodSignature(this)` ✅

### ✅ Import/Export Nodes (2/2) - COMPLETE
- [x] TSImportDeclaration - `visitor.visitImportDeclaration(this)` ✅
- [x] TSExportDeclaration - `visitor.visitExportDeclaration(this)` ✅

### ✅ Comment Node (1/1) - COMPLETE
- [x] TSComment - `visitor.visitComment(this)` ✅

**Total Progress**: 13/13 nodes (100%) ✅

---

## Implementation Template

Untuk setiap node, tambahkan:

```typescript
// 1. Di bagian import (paling atas)
import type { TSVisitor } from '../visitor/TSVisitor';

// 2. Di akhir class (sebelum closing brace terakhir)
/**
 * Accept visitor (Neural Pathway)
 * Menghubungkan node ini dengan visitor pattern
 */
public accept<R>(visitor: TSVisitor<R>): R {
    return visitor.visitXXXX(this); // Sesuaikan nama method
}
```

---

## Automated Implementation Strategy

Karena pattern-nya repetitive, kita bisa:

1. **Manual** - Tambah satu-satu (slow but safe)
2. **Script** - Buat bash script untuk inject code (fast but risky)
3. **Batch** - Group by category, implement per batch (balanced)

**Pilihan**: Batch implementation (3-4 nodes per batch)

---

## Batch Groups

### Batch 1: Import/Export (2 nodes)
- TSImportDeclaration
- TSExportDeclaration

### Batch 2: Declarations (3 nodes)
- TSInterfaceDeclaration  
- TSTypeAliasDeclaration
- TSFunctionDeclaration

### Batch 3: Members (2 nodes)
- TSPropertySignature
- TSMethodSignature

### Batch 4: Types (4 nodes)
- TSTypeReference
- TSArrayType
- TSUnionType
- TSIntersectionType

### Batch 5: Comment (1 node)
- TSComment

---

## Testing Strategy

Setelah setiap batch, test dengan simple visitor:

```typescript
// Test visitor
class NodeCounterVisitor extends TSBaseVisitor<number> {
    private count = 0;
    
    protected defaultResult(): number {
        return this.count;
    }
    
    visitFile(node: TSFile): number {
        this.count++;
        node.imports.forEach(imp => imp.accept(this));
        node.declarations.forEach(decl => decl.accept(this));
        return this.count;
    }
    
    // Override other methods to increment count
}

// Usage
const file = TSFile.empty()
    .addImport(TSImportDeclaration.valueImport(['User'], './types'));
    
const visitor = new NodeCounterVisitor();
const nodeCount = file.accept(visitor);
console.log(`Total nodes: ${nodeCount}`); // Should be 2 (file + import)
```

---

## Expected Benefits

Setelah implementasi selesai:

1. **Traversal**: Bisa jalan melalui semua node di tree
2. **Transformation**: Bisa transform AST (formatter)
3. **Emission**: Bisa generate code (emitter)
4. **Analysis**: Bisa analyze struktur (analyzer)

---

## Next Steps

1. ✅ TSFile sudah complete
2. ⏳ Implement Batch 1 (Import/Export)
3. ⏳ Test Batch 1
4. ⏳ Implement Batch 2 (Declarations)
5. ⏳ Test Batch 2
6. ... continue untuk batch berikutnya

---

## Success Criteria

- [ ] Semua 13 node punya accept() method
- [ ] Zero compilation errors
- [ ] Simple visitor test passes
- [ ] Base visitor test passes
- [ ] Complex traversal test passes

**Target**: Complete dalam 1-2 sesi kerja

