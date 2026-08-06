# Panduan Menambahkan Visitor Methods ke Semua Node

## Konsep: Saraf untuk Menghubungkan Data ke Otak

Visitor pattern adalah "sistem saraf" yang memungkinkan data (node) berkomunikasi dengan logic (visitor).

```
TSFile (data/tulang)
   ↓
accept(visitor) ← SARAF
   ↓
visitor.visitFile() ← OTAK (logic)
```

## Template Accept Method

Setiap node perlu menambahkan:

```typescript
// 1. Import TSVisitor di bagian atas
import type { TSVisitor } from '../visitor/TSVisitor';

// 2. Tambahkan method accept() di akhir class (sebelum closing brace)
/**
 * Accept visitor (Neural Pathway)
 * Ini adalah "saraf" yang menghubungkan node ke visitor
 */
public accept<R>(visitor: TSVisitor<R>): R {
    return visitor.visitXXX(this);  // Ganti XXX dengan nama visitor method
}
```

## Mapping Node ke Visitor Method

| Node Class | Visitor Method | File |
|---|---|---|
| TSFile | visitFile | TSFile.ts |
| TSImportDeclaration | visitImportDeclaration | TSImportDeclaration.ts |
| TSExportDeclaration | visitExportDeclaration | TSExportDeclaration.ts |
| TSInterfaceDeclaration | visitInterfaceDeclaration | TSInterfaceDeclaration.ts |
| TSTypeAliasDeclaration | visitTypeAliasDeclaration | TSTypeAliasDeclaration.ts |
| TSFunctionDeclaration | visitFunctionDeclaration | TSFunctionDeclaration.ts |
| TSPropertySignature | visitPropertySignature | TSPropertySignature.ts |
| TSMethodSignature | visitMethodSignature | TSMethodSignature.ts |
| TSTypeReference | visitTypeReference | TSTypeReference.ts |
| TSArrayType | visitArrayType | TSArrayType.ts |
| TSUnionType | visitUnionType | TSUnionType.ts |
| TSIntersectionType | visitIntersectionType | TSIntersectionType.ts |
| TSComment | visitComment | TSComment.ts |

## Status

- [x] TSFile ✅
- [ ] TSImportDeclaration
- [ ] TSExportDeclaration
- [ ] TSInterfaceDeclaration
- [ ] TSTypeAliasDeclaration
- [ ] TSFunctionDeclaration
- [ ] TSPropertySignature
- [ ] TSMethodSignature
- [ ] TSTypeReference
- [ ] TSArrayType
- [ ] TSUnionType
- [ ] TSIntersectionType
- [ ] TSComment

## Contoh Implementasi Lengkap (TSFile)

```typescript
import type { TSVisitor } from '../visitor/TSVisitor';

export class TSFile implements TSNode {
    // ... properties dan methods lainnya ...
    
    /**
     * Accept visitor (Neural Pathway)
     */
    public accept<R>(visitor: TSVisitor<R>): R {
        return visitor.visitFile(this);
    }
}
```

## Testing Accept Methods

Setelah semua accept() methods ditambahkan, test dengan visitor sederhana:

```typescript
class TestVisitor implements TSVisitor<string> {
    visitFile(node: TSFile): string {
        return `File with ${node.imports.length} imports`;
    }
    // ... implement other methods ...
}

const file = TSFile.empty();
const result = file.accept(new TestVisitor());
console.log(result); // "File with 0 imports"
```

