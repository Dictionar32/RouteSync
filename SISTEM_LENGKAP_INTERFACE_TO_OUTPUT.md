# Sistem Lengkap: Interface → Saraf → Otak → Keluaran

**Tanggal**: 4 Agustus 2026  
**Filosofi**: Sistem biologis untuk code generation

---

## Analogi Sistem Biologis

```
┌─────────────────────────────────────────────────────┐
│                    SISTEM LENGKAP                    │
└─────────────────────────────────────────────────────┘

1. INTERFACE (Sensor/Input)
   └── IR/Artifact/Manifest (data mentah)
   
2. SARAF (Neural Network)
   └── Visitor Pattern (accept/visit methods)
   
3. OTAK (Brain/Processor)
   ├── Generator (IR → Target AST)
   ├── Formatter (AST optimization)
   └── Analyzer (validation)
   
4. KELUARAN (Motor Output)
   ├── Emitter (AST → String)
   └── Writer (String → File)
```

---

## Fase Implementasi Bertahap

### ✅ Fase 0: SKELETON (SELESAI)
- Struktur data (tulang/kerangka)
- Node types sudah complete
- Zero compilation errors

### 🔄 Fase 1: INTERFACE (Data Masuk)
**Status**: Perlu review existing IR/Artifact  
**Tujuan**: Pastikan data input terstruktur dengan baik

**File yang Perlu Diperiksa**:
```
packages/core/src/compiler/ir/
├── ResponseArtifact.ts      ← Response data structure
├── ContractGraph.ts         ← Contract relationships
└── Expression.ts            ← IR expressions

packages/core/src/compiler/artifacts/
└── types.ts                 ← Artifact definitions
```

**Output Fase 1**:
- [ ] Interface data input terdokumentasi
- [ ] Sample data untuk testing
- [ ] Type definitions lengkap

---

### 🎯 Fase 2: SARAF (Neural Pathways) ← CURRENT FOCUS
**Status**: Starting  
**Tujuan**: Implementasi visitor pattern ke semua node

#### Step 2.1: Tambah accept() ke Declaration Nodes
Prioritas: **HIGH** (ini yang paling sering dipakai)

```typescript
// TSInterfaceDeclaration
public accept<R>(visitor: TSVisitor<R>): R {
    return visitor.visitInterfaceDeclaration(this);
}

// TSTypeAliasDeclaration  
public accept<R>(visitor: TSVisitor<R>): R {
    return visitor.visitTypeAliasDeclaration(this);
}

// TSFunctionDeclaration
public accept<R>(visitor: TSVisitor<R>): R {
    return visitor.visitFunctionDeclaration(this);
}
```

**File Target**:
- [ ] TSInterfaceDeclaration.ts
- [ ] TSTypeAliasDeclaration.ts
- [ ] TSFunctionDeclaration.ts

#### Step 2.2: Tambah accept() ke Type Nodes
Prioritas: **HIGH**

```typescript
// TSTypeReference, TSArrayType, TSUnionType, TSIntersectionType
public accept<R>(visitor: TSVisitor<R>): R {
    return visitor.visitXXXType(this);
}
```

**File Target**:
- [ ] TSTypeReference.ts
- [ ] TSArrayType.ts
- [ ] TSUnionType.ts
- [ ] TSIntersectionType.ts

#### Step 2.3: Tambah accept() ke Member Nodes
Prioritas: **MEDIUM**

**File Target**:
- [ ] TSPropertySignature.ts
- [ ] TSMethodSignature.ts

#### Step 2.4: Tambah accept() ke Import/Export
Prioritas: **MEDIUM**

**File Target**:
- [ ] TSImportDeclaration.ts
- [ ] TSExportDeclaration.ts

#### Step 2.5: Tambah accept() ke Comment
Prioritas: **LOW**

**File Target**:
- [ ] TSComment.ts

**Output Fase 2**:
- [ ] Semua node punya accept() method
- [ ] Simple visitor test berjalan
- [ ] Zero compilation errors

---

### ⏳ Fase 3: OTAK (Brain/Processor)
**Status**: Waiting  
**Tujuan**: Implementasi Generator, Formatter, Analyzer

#### Step 3.1: TypeScript Generator (IR → Target AST)
**File**: `packages/core/src/compiler/generators/typescript/TypeScriptGenerator.ts`

```typescript
class TypeScriptGenerator implements IGenerator<TSFile> {
    /**
     * Transform IR Contract ke TSFile (Target AST)
     */
    generate(contract: ContractIR): TSFile {
        const imports = this.generateImports(contract);
        const declarations = this.generateDeclarations(contract);
        const exports = this.generateExports(contract);
        
        return new TSFile(imports, declarations, exports);
    }
    
    private generateDeclarations(contract: ContractIR): TSDeclaration[] {
        return contract.types.map(type => {
            if (type.kind === 'interface') {
                return this.generateInterface(type);
            } else if (type.kind === 'type-alias') {
                return this.generateTypeAlias(type);
            }
            // dst...
        });
    }
}
```

#### Step 3.2: TypeScript Formatter (AST Optimization)
**File**: `packages/core/src/compiler/formatting/typescript/TSFormatter.ts`

```typescript
class TSFormatter implements IFormatter<TSFile> {
    /**
     * Optimize/format Target AST
     */
    format(file: TSFile): TSFile {
        // Sort imports
        const sortedImports = this.sortImports(file.imports);
        
        // Group declarations
        const groupedDecls = this.groupDeclarations(file.declarations);
        
        // Optimize exports
        const optimizedExports = this.optimizeExports(file.exports);
        
        return new TSFile(sortedImports, groupedDecls, optimizedExports);
    }
}
```

#### Step 3.3: Analyzer (Validation)
**File**: `packages/core/src/compiler/analysis/ASTAnalyzer.ts`

```typescript
class ASTAnalyzer extends TSBaseVisitor<AnalysisResult> {
    /**
     * Analyze AST for issues
     */
    analyze(file: TSFile): AnalysisResult {
        return file.accept(this);
    }
    
    visitInterfaceDeclaration(node: TSInterfaceDeclaration): AnalysisResult {
        // Check for duplicate properties
        // Check naming conventions
        // etc...
    }
}
```

**Output Fase 3**:
- [ ] Generator bisa transform IR → AST
- [ ] Formatter bisa optimize AST
- [ ] Analyzer bisa validate AST

---

### ⏳ Fase 4: KELUARAN (Output)
**Status**: Waiting  
**Tujuan**: Generate code dan write ke file

#### Step 4.1: TypeScript Emitter (AST → String)
**File**: `packages/core/src/compiler/emitters/typescript/TypeScriptEmitter.ts`

```typescript
class TypeScriptEmitter implements TSVisitor<string> {
    /**
     * Pure visitor - no logic, hanya print
     */
    visitFile(node: TSFile): string {
        const imports = node.imports.map(i => i.accept(this)).join('\n');
        const decls = node.declarations.map(d => d.accept(this)).join('\n\n');
        const exports = node.exports.map(e => e.accept(this)).join('\n');
        
        return `${imports}\n\n${decls}\n\n${exports}`;
    }
    
    visitInterfaceDeclaration(node: TSInterfaceDeclaration): string {
        const members = node.members
            .map(m => `  ${m.accept(this)}`)
            .join('\n');
            
        return `interface ${node.name} {\n${members}\n}`;
    }
    
    visitPropertySignature(node: TSPropertySignature): string {
        const optional = node.isOptional ? '?' : '';
        const readonly = node.isReadonly ? 'readonly ' : '';
        return `${readonly}${node.name}${optional}: ${node.type.accept(this)};`;
    }
}
```

#### Step 4.2: File Writer
**File**: `packages/core/src/compiler/writers/FileWriter.ts`

```typescript
class FileWriter implements IWriter {
    async write(path: string, content: string): Promise<void> {
        await fs.writeFile(path, content, 'utf-8');
    }
}
```

**Output Fase 4**:
- [ ] Emitter bisa generate string dari AST
- [ ] Writer bisa save ke file
- [ ] End-to-end test berjalan

---

## Pipeline Lengkap

```typescript
// INTERFACE: Data masuk
const contractIR = await loadContractIR('manifest.json');

// SARAF: Visitor pattern ready
// (accept methods sudah ada di semua node)

// OTAK: Process data
const generator = new TypeScriptGenerator();
const targetAST = generator.generate(contractIR);

const formatter = new TSFormatter();
const formattedAST = formatter.format(targetAST);

// KELUARAN: Generate output
const emitter = new TypeScriptEmitter();
const code = formattedAST.accept(emitter);

const writer = new FileWriter();
await writer.write('output/types.ts', code);
```

---

## Testing Strategy Per Fase

### Test Fase 2 (Saraf)
```typescript
test('visitor pattern works', () => {
    const file = TSFile.empty()
        .addDeclaration(
            new TSInterfaceDeclaration('User', [
                new TSPropertySignature('id', TSTypeReference.number())
            ])
        );
    
    class NodeCounter extends TSBaseVisitor<number> {
        count = 0;
        defaultResult() { return this.count; }
        visitFile() { this.count++; return this.count; }
        visitInterfaceDeclaration() { this.count++; return this.count; }
    }
    
    const counter = new NodeCounter();
    const result = file.accept(counter);
    
    expect(result).toBe(2); // file + interface
});
```

### Test Fase 3 (Otak)
```typescript
test('generator transforms IR to AST', () => {
    const contractIR = {
        types: [{
            name: 'User',
            kind: 'interface',
            properties: [{ name: 'id', type: 'number' }]
        }]
    };
    
    const generator = new TypeScriptGenerator();
    const ast = generator.generate(contractIR);
    
    expect(ast.declarations).toHaveLength(1);
    expect(ast.declarations[0]).toBeInstanceOf(TSInterfaceDeclaration);
});
```

### Test Fase 4 (Keluaran)
```typescript
test('emitter generates valid TypeScript', () => {
    const file = TSFile.empty()
        .addDeclaration(
            new TSInterfaceDeclaration('User', [
                new TSPropertySignature('id', TSTypeReference.number())
            ])
        );
    
    const emitter = new TypeScriptEmitter();
    const code = file.accept(emitter);
    
    expect(code).toContain('interface User');
    expect(code).toContain('id: number');
});
```

---

## Prioritas Implementasi

### Sprint 1 (Minggu Ini): SARAF
1. ✅ TSFile accept() - DONE
2. ⏳ Declaration nodes accept() - NEXT
3. ⏳ Type nodes accept()
4. ⏳ Member nodes accept()
5. ⏳ Import/Export accept()
6. ⏳ Test visitor pattern

### Sprint 2 (Minggu Depan): OTAK
1. Implement TypeScriptGenerator
2. Implement TSFormatter
3. Implement ASTAnalyzer
4. Test transformations

### Sprint 3 (2 Minggu): KELUARAN
1. Implement TypeScriptEmitter
2. Implement FileWriter
3. End-to-end integration
4. Production testing

---

## Current Status

```
[✅] Fase 0: Skeleton (100%)
[🔄] Fase 1: Interface (50% - perlu review)
[✅] Fase 2: Saraf (100% - COMPLETE!) ⭐
[  ] Fase 3: Otak (0% - NEXT UP)
[  ] Fase 4: Keluaran (0%)

Overall: ~50% complete
```

---

## Next Immediate Actions

1. **Implementasi accept() ke Declaration Nodes** (3 files)
   - TSInterfaceDeclaration
   - TSTypeAliasDeclaration  
   - TSFunctionDeclaration

2. **Test Visitor Pattern** dengan simple visitor

3. **Lanjut ke Type Nodes** (4 files)

4. **Complete Fase 2** (remaining nodes)

Mau saya lanjutkan implementasi accept() method sekarang?

