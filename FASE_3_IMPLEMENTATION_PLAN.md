# Fase 3 Implementation Plan: Otak/Brain (Generator, Formatter, Emitter)

**Tanggal**: 4 Agustus 2026  
**Status**: 🎯 IN PROGRESS (0%)  
**Prerequisites**: ✅ Fase 2 Complete (Visitor Pattern)

---

## 🎯 Tujuan Fase 3

Implementasi "otak" sistem yang memproses data:
1. **Generator** - Transform IR → Target AST
2. **Formatter** - Optimize & reorganize AST
3. **Emitter Refactor** - Pure visitor untuk AST → String

---

## 📋 Implementation Strategy

### Batch Processing Approach
Implementasi bertahap dengan testing di setiap batch untuk memastikan kualitas.

```
Batch 1: Generator Foundation (Week 1)
  ↓
Batch 2: Generator Complete (Week 1-2)
  ↓
Batch 3: Formatter Implementation (Week 2)
  ↓
Batch 4: Emitter Refactor (Week 3)
  ↓
Batch 5: Integration & Testing (Week 3)
```

---

## 🔧 Batch 1: Generator Foundation (HIGH PRIORITY)

### Target Files
1. ✅ Read existing structure
2. ⏳ Fix TypeScriptGenerator compilation errors
3. ⏳ Implement core transformation logic
4. ⏳ Add proper type imports

### Current Issues in TypeScriptGenerator.ts

```typescript
// ❌ ISSUES FOUND:
1. Missing type imports (SemanticType, EntityNode properties)
2. Using .map() on ImmutableMap incorrectly
3. Implicit 'any' types in arrow functions
4. Missing properties on EntityNode (description, extends)
5. Wrong import paths
```

### Implementation Steps

#### Step 1.1: Fix Type Imports ⏳
**File**: `TypeScriptGenerator.ts`

```typescript
// Add missing imports
import type { SemanticType } from '../../types/SemanticType';
import type { EntityNode } from '../../ir/ContractGraph';
```

#### Step 1.2: Fix EntityNode Property Access ⏳
**Current Problem**: EntityNode interface tidak memiliki `description`, `extends` properties

**Solution Options**:
a. Extend EntityNode interface
b. Use optional chaining dan type guards
c. Create adapter/wrapper

**Decision**: Use optional chaining untuk forward compatibility

```typescript
// Before (ERROR):
const comment = entity.description 
    ? new TSComment(entity.description, true)
    : undefined;

// After (FIXED):
const comment = (entity as any).description  // Temporary cast
    ? new TSComment((entity as any).description, true)
    : undefined;

// Better: Check EntityNode interface first
```

#### Step 1.3: Fix ImmutableMap Iteration ⏳
**Current Problem**: Trying to use .map() on ImmutableMap

```typescript
// Before (ERROR):
const properties = entity.properties.map(prop => ...)

// After (FIXED):
const properties = Array.from(entity.properties.values()).map(prop => ...)
```

#### Step 1.4: Add Explicit Types to Arrow Functions ⏳

```typescript
// Before (ERROR):
(prop) => new TSPropertySignature(...)

// After (FIXED):
(prop: PropertyDefinition) => new TSPropertySignature(...)
```

---

## 🔧 Batch 2: Generator Complete (Week 1-2)

### Step 2.1: Implement Entity Mapping ⏳
Transform IR EntityNode → TSInterfaceDeclaration

```typescript
private generateInterface(entity: EntityNode): TSInterfaceDeclaration {
    // 1. Transform properties
    const properties = this.transformProperties(entity);
    
    // 2. Handle inheritance
    const extendsTypes = this.extractExtendsTypes(entity);
    
    // 3. Add documentation
    const comment = this.generateComment(entity);
    
    return new TSInterfaceDeclaration(
        entity.name,
        properties,
        extendsTypes,
        true, // exported
        comment
    );
}
```

### Step 2.2: Implement Type Mapping ⏳
Map semantic types → TypeScript types

```typescript
private mapType(semanticType: SemanticType): TSTypeReference {
    // Handle primitive types
    if (this.isPrimitive(semanticType.name)) {
        return new TSTypeReference(semanticType.name);
    }
    
    // Handle collections
    if (semanticType.isCollection) {
        const elementType = this.mapType(semanticType.elementType);
        return elementType.toArray();
    }
    
    // Handle custom types
    return new TSTypeReference(semanticType.name);
}
```

### Step 2.3: Implement Import Collection ⏳
Collect dan deduplicate imports

```typescript
private collectImports(entities: EntityNode[]): TSImportDeclaration[] {
    const importMap = new Map<string, Set<string>>();
    
    for (const entity of entities) {
        // Collect from properties
        this.collectPropertyTypeImports(entity, importMap);
        
        // Collect from extends
        this.collectExtendsImports(entity, importMap);
    }
    
    return this.createImportDeclarations(importMap);
}
```

### Step 2.4: Add Unit Tests ⏳

```typescript
describe('TypeScriptGenerator', () => {
    describe('generate()', () => {
        it('should transform EntityNode to TSInterfaceDeclaration', () => {
            const entity: EntityNode = createMockEntity('User');
            const generator = new TypeScriptGenerator();
            
            const result = generator.generate(mockContractGraph);
            
            expect(result).toBeInstanceOf(TSFile);
            expect(result.declarations).toHaveLength(1);
            expect(result.declarations[0].name).toBe('User');
        });
    });
});
```

---

## 🔧 Batch 3: Formatter Implementation (Week 2)

### Target Files
1. ⏳ Fix TSFormatter.ts compilation errors
2. ⏳ Implement import sorting
3. ⏳ Implement import grouping
4. ⏳ Implement declaration ordering

### Current Issues in TSFormatter.ts

```typescript
// ❌ ISSUES:
1. Import path errors
2. Using TSFile as value (should be type import only)
3. Missing TSDeclaration type
4. Missing implementation for sort/group logic
```

### Step 3.1: Fix Type Imports ⏳

```typescript
// Fix imports
import { TSFile } from '../../target/typescript/nodes/TSFile';
import type { TSImportDeclaration, TSDeclaration } from '../../target/typescript/nodes';
```

### Step 3.2: Implement Sorting Logic ⏳

```typescript
private sortImports(imports: readonly TSImportDeclaration[]): TSImportDeclaration[] {
    return [...imports].sort((a, b) => {
        // 1. Type imports first
        if (a.isType && !b.isType) return -1;
        if (!a.isType && b.isType) return 1;
        
        // 2. External modules before local
        const aIsExternal = !a.from.startsWith('.');
        const bIsExternal = !b.from.startsWith('.');
        if (aIsExternal && !bIsExternal) return -1;
        if (!aIsExternal && bIsExternal) return 1;
        
        // 3. Alphabetically
        return a.from.localeCompare(b.from);
    });
}
```

### Step 3.3: Implement Declaration Ordering ⏳

```typescript
private sortDeclarations(declarations: readonly TSDeclaration[]): TSDeclaration[] {
    return [...declarations].sort((a, b) => {
        // 1. Interfaces before type aliases
        if (a.kind === 'interface-declaration' && b.kind !== 'interface-declaration') return -1;
        if (a.kind !== 'interface-declaration' && b.kind === 'interface-declaration') return 1;
        
        // 2. Alphabetically by name
        return a.name.localeCompare(b.name);
    });
}
```

---

## 🔧 Batch 4: Emitter Refactor (Week 3)

### Target: Pure Visitor Pattern

Current TypeScriptEmitter sudah menggunakan visitor pattern, tapi perlu:
1. ⏳ Fix import paths
2. ⏳ Add missing visit methods
3. ⏳ Improve formatting logic
4. ⏳ Add indentation helpers

### Step 4.1: Fix Import Paths ⏳

```typescript
// Fix imports to use actual file paths
import type { TSVisitor } from '../../target/typescript/visitor/TSVisitor';
import type {
    TSFile,
    TSImportDeclaration,
    TSInterfaceDeclaration,
    // ... all other nodes
} from '../../target/typescript/nodes';
```

### Step 4.2: Implement Missing Visit Methods ⏳

```typescript
// Add visits for all node types
visitTypeAliasDeclaration(node: TSTypeAliasDeclaration): string {
    const exportModifier = node.exported ? 'export ' : '';
    const typeStr = node.type.accept(this);
    return `${exportModifier}type ${node.name} = ${typeStr};`;
}

visitArrayType(node: TSArrayType): string {
    return `${node.elementType.accept(this)}[]`;
}

visitUnionType(node: TSUnionType): string {
    return node.types.map(t => t.accept(this)).join(' | ');
}

visitIntersectionType(node: TSIntersectionType): string {
    return node.types.map(t => t.accept(this)).join(' & ');
}
```

### Step 4.3: Improve Formatting ⏳

```typescript
private formatComment(comment: TSComment, indent: number): string {
    const indentStr = ' '.repeat(indent * this.indentSize);
    
    if (comment.isMultiline) {
        return `${indentStr}/**\n${indentStr} * ${comment.text}\n${indentStr} */`;
    }
    
    return `${indentStr}/** ${comment.text} */`;
}
```

---

## 🔧 Batch 5: Integration & Testing (Week 3)

### Step 5.1: End-to-End Pipeline Test ⏳

```typescript
describe('Full Pipeline: IR → AST → String', () => {
    it('should generate valid TypeScript code', () => {
        // 1. Create IR
        const contractGraph = createMockContractGraph();
        
        // 2. Generate AST
        const generator = new TypeScriptGenerator();
        const ast = generator.generate(contractGraph);
        
        // 3. Format AST
        const formatter = new TSFormatter();
        const formattedAST = formatter.format(ast);
        
        // 4. Emit code
        const emitter = new TypeScriptEmitter();
        const code = formattedAST.accept(emitter);
        
        // 5. Verify
        expect(code).toContain('interface User');
        expect(code).toContain('import type');
        
        // 6. TypeScript compilation test
        const result = compileTypeScript(code);
        expect(result.errors).toHaveLength(0);
    });
});
```

### Step 5.2: Performance Testing ⏳

```typescript
describe('Performance', () => {
    it('should generate 1000 interfaces in < 2 seconds', () => {
        const largeGraph = createLargeContractGraph(1000);
        const generator = new TypeScriptGenerator();
        
        const start = performance.now();
        const result = generator.generate(largeGraph);
        const duration = performance.now() - start;
        
        expect(duration).toBeLessThan(2000);
        expect(result.declarations).toHaveLength(1000);
    });
});
```

---

## 📊 Success Criteria

### Batch 1 Complete When:
- [ ] TypeScriptGenerator compiles without errors
- [ ] Basic entity → interface transformation works
- [ ] Type mapping functional
- [ ] Unit tests pass

### Batch 2 Complete When:
- [ ] Full entity mapping implemented
- [ ] Import collection working
- [ ] Type mapping handles all cases
- [ ] 90%+ test coverage

### Batch 3 Complete When:
- [ ] TSFormatter compiles without errors
- [ ] Import sorting working
- [ ] Declaration ordering working
- [ ] AST transformations preserve semantics

### Batch 4 Complete When:
- [ ] TypeScriptEmitter uses pure visitor pattern
- [ ] All node types have visit methods
- [ ] Generated code is valid TypeScript
- [ ] Formatting is clean and consistent

### Batch 5 Complete When:
- [ ] End-to-end pipeline working
- [ ] All integration tests pass
- [ ] Performance benchmarks met
- [ ] Zero compilation errors

---

## 🚧 Known Issues & Dependencies

### Issue 1: EntityNode Interface Incomplete
**Problem**: Missing properties (description, extends)  
**Impact**: Generator cannot access metadata  
**Solution**: Either extend EntityNode or use optional chaining

### Issue 2: SemanticType Import
**Problem**: Type not properly exported  
**Impact**: Cannot type property transformations  
**Solution**: Fix exports in types/index.ts

### Issue 3: TSDeclaration Type Union
**Problem**: Not exported from nodes/index.ts  
**Impact**: Formatter cannot type declarations array  
**Solution**: Add type export

---

## 📈 Progress Tracking

```
Fase 3 Overall Progress: 0%

Batch 1 (Generator Foundation):  0% ⏳ NEXT
Batch 2 (Generator Complete):    0% ⏳
Batch 3 (Formatter):             0% ⏳
Batch 4 (Emitter):               0% ⏳
Batch 5 (Integration):           0% ⏳
```

---

## 🎯 Next Immediate Action

**START HERE**: Batch 1, Step 1.1 - Fix TypeScriptGenerator compilation errors

1. Read EntityNode interface definition
2. Fix missing type imports
3. Fix ImmutableMap iteration
4. Add explicit types to parameters
5. Verify zero compilation errors

Siap untuk mulai implementasi? 🚀
