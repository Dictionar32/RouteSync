# Phase 3: Generator Implementation - Detailed Plan

## Overview

**Duration:** Week 3-4 (10 working days)  
**Goal:** Implement TypeScriptGenerator yang mengubah SemanticType menjadi Target AST (TSNode hierarchy)  
**Priority:** HIGH - Critical path untuk code generation pipeline

---

## Prerequisites Check

Sebelum memulai Phase 3, pastikan:

- [x] Target AST skeleton complete (TSNode hierarchy)
- [x] TSFormatter implementation ready
- [x] IGenerator interface defined
- [x] SemanticType system complete
- [x] Import collection mechanism planned

---

## Week 3: Core Generator Implementation (Days 1-5)

### Day 1: Setup & Foundation

#### Task 1.1: Create Generator Structure
**File:** `packages/core/src/compiler/generators/typescript/TypeScriptGenerator.ts`

```typescript
import type { IGenerator } from '../IGenerator';
import type { SemanticType } from '../../types/SemanticType';
import type { TSNode } from '../../target/typescript/nodes/TSNode';

export class TypeScriptGenerator implements IGenerator {
    private importCollector: ImportCollector;
    
    constructor() {
        this.importCollector = new ImportCollector();
    }
    
    // TODO: Implement methods
}
```

**Checklist:**
- [ ] Create file with proper imports
- [ ] Implement IGenerator interface
- [ ] Add constructor with ImportCollector
- [ ] Add private helper fields
- [ ] Write JSDoc comments

**Acceptance Criteria:**
- File compiles without errors
- Class structure follows IGenerator contract
- All imports resolve correctly

---

#### Task 1.2: Implement Import Collector
**File:** `packages/core/src/compiler/generators/typescript/ImportCollector.ts`

```typescript
export interface ImportSpec {
    readonly source: string;
    readonly named: Set<string>;
    readonly defaultImport?: string;
    readonly namespaceImport?: string;
}

export class ImportCollector {
    private imports = new Map<string, ImportSpec>();
    
    addNamedImport(name: string, source: string): void {
        // Implementation
    }
    
    getImports(): readonly ImportSpec[] {
        return Array.from(this.imports.values());
    }
}
```

**Checklist:**
- [ ] Define ImportSpec interface
- [ ] Implement ImportCollector class
- [ ] Add methods: addNamedImport, addDefaultImport, addNamespaceImport
- [ ] Implement getImports() for TSFile generation
- [ ] Add deduplication logic
- [ ] Write unit tests

**Test Cases:**
```typescript
test('should collect named imports', () => {
    const collector = new ImportCollector();
    collector.addNamedImport('User', './types');
    collector.addNamedImport('Post', './types');
    
    const imports = collector.getImports();
    expect(imports).toHaveLength(1);
    expect(imports[0].named.has('User')).toBe(true);
    expect(imports[0].named.has('Post')).toBe(true);
});
```

**Acceptance Criteria:**
- All unit tests pass
- Handles duplicate imports correctly
- Sorts imports consistently

---

### Day 2: Semantic Type Transformation (Primitives & References)

#### Task 2.1: Implement `semanticTypeToTSType()` - Basic Types
**File:** `TypeScriptGenerator.ts`

```typescript
private semanticTypeToTSType(type: SemanticType): TSTypeNode {
    switch (type.kind) {
        case 'primitive':
            return this.convertPrimitiveType(type);
        case 'reference':
            return this.convertReferenceType(type);
        case 'never':
            return new TSTypeReference('never');
        case 'error':
            return new TSTypeReference('unknown');
        default:
            throw new Error(`Unsupported type: ${type.kind}`);
    }
}
```

**Sub-tasks:**
- [ ] Implement convertPrimitiveType()
- [ ] Implement convertReferenceType()
- [ ] Handle 'never' and 'error' types
- [ ] Add proper import tracking for references

**Test Cases:**
```typescript
describe('semanticTypeToTSType - Basic Types', () => {
    it('should convert primitive string', () => {
        const semantic = new PrimitiveType(PrimitiveKind.STRING);
        const ts = generator.semanticTypeToTSType(semantic);
        expect(ts.kind).toBe('TSTypeReference');
        expect(ts.typeName).toBe('string');
    });
    
    it('should convert reference type', () => {
        const semantic = new ReferenceType('App\\Models', 'User');
        const ts = generator.semanticTypeToTSType(semantic);
        expect(ts.kind).toBe('TSTypeReference');
        expect(ts.typeName).toBe('User');
    });
});
```

**Acceptance Criteria:**
- Primitives map correctly (string → string, number → number, etc.)
- Reference types use proper naming
- Imports tracked for external references

---

#### Task 2.2: Implement Collection Types
**File:** `TypeScriptGenerator.ts`

```typescript
private semanticTypeToTSType(type: SemanticType): TSTypeNode {
    // ... previous cases
    case 'readonly_collection':
        return this.convertReadonlyCollection(type);
    case 'mutable_collection':
        return this.convertMutableCollection(type);
}

private convertReadonlyCollection(type: ReadonlyCollectionType): TSTypeNode {
    const elementType = this.semanticTypeToTSType(type.elementType);
    
    if (type.collectionKind === CollectionKind.ARRAY) {
        return new TSArrayType(elementType, true); // readonly
    }
    // Handle other collection kinds
}
```

**Checklist:**
- [ ] Implement convertReadonlyCollection()
- [ ] Implement convertMutableCollection()
- [ ] Handle ARRAY, COLLECTION, NULLABLE kinds
- [ ] Add ReadonlyArray vs Array distinction
- [ ] Write comprehensive tests

**Test Cases:**
```typescript
it('should convert readonly array', () => {
    const semantic = new ReadonlyCollectionType(
        CollectionKind.ARRAY,
        new PrimitiveType(PrimitiveKind.STRING)
    );
    const ts = generator.semanticTypeToTSType(semantic);
    expect(ts.kind).toBe('TSArrayType');
    expect(ts.readonly).toBe(true);
});
```

**Acceptance Criteria:**
- Readonly collections use `readonly T[]` or `ReadonlyArray<T>`
- Mutable collections use `T[]` or `Array<T>`
- Nested collections work correctly

---

### Day 3: Complex Types (Union, Intersection, Generic)

#### Task 3.1: Implement Union Types
```typescript
private convertUnionType(type: UnionType): TSTypeNode {
    const members = Array.from(type.members.values())
        .map(m => this.semanticTypeToTSType(m));
    
    return new TSUnionType(members);
}
```

**Checklist:**
- [ ] Convert all union members
- [ ] Handle nested unions (flatten if needed)
- [ ] Track imports for all member types
- [ ] Write tests for complex unions

**Test Cases:**
```typescript
it('should convert union type', () => {
    const semantic = new UnionType(new ImmutableSet(new Set([
        new PrimitiveType(PrimitiveKind.STRING),
        new PrimitiveType(PrimitiveKind.NUMBER),
        new ReferenceType('', 'null')
    ])));
    
    const ts = generator.semanticTypeToTSType(semantic);
    expect(ts.kind).toBe('TSUnionType');
    expect(ts.types).toHaveLength(3);
});
```

---

#### Task 3.2: Implement Intersection Types
```typescript
private convertIntersectionType(type: IntersectionType): TSTypeNode {
    const members = Array.from(type.members.values())
        .map(m => this.semanticTypeToTSType(m));
    
    return new TSIntersectionType(members);
}
```

**Checklist:**
- [ ] Convert all intersection members
- [ ] Handle object type intersections
- [ ] Track imports
- [ ] Write tests

---

#### Task 3.3: Implement Generic Types
```typescript
private convertGenericType(type: GenericType): TSTypeNode {
    const baseType = this.semanticTypeToTSType(type.base);
    const typeArgs = type.parameters.map(p => 
        this.semanticTypeToTSType(p.type)
    );
    
    // Create TSTypeReference with generic args
    return new TSTypeReference(
        (baseType as TSTypeReference).typeName,
        typeArgs
    );
}
```

**Checklist:**
- [ ] Handle generic base types
- [ ] Convert all type parameters
- [ ] Support variance annotations (if needed)
- [ ] Write tests for common generics (Array<T>, Promise<T>, etc.)

---

### Day 4: Object Types & Interfaces

#### Task 4.1: Implement Object Type Conversion
```typescript
private convertObjectType(type: ObjectType): TSInterfaceDeclaration {
    const properties: TSPropertySignature[] = [];
    
    for (const [name, propType] of type.properties.entries()) {
        const tsType = this.semanticTypeToTSType(propType);
        const optional = !type.requiredProperties.has(name);
        
        properties.push(new TSPropertySignature(
            name,
            tsType,
            optional,
            false // readonly determined separately
        ));
    }
    
    return new TSInterfaceDeclaration(
        this.generateInterfaceName(type),
        [],  // type parameters
        properties,
        undefined  // extends clause
    );
}
```

**Checklist:**
- [ ] Convert all properties
- [ ] Handle optional vs required properties
- [ ] Support readonly properties
- [ ] Handle base objects (extends)
- [ ] Handle interface implementations
- [ ] Generate unique interface names
- [ ] Write comprehensive tests

---

#### Task 4.2: Implement `generateEntityInterface()`
```typescript
public generateEntityInterface(
    name: string,
    type: ObjectType
): TSInterfaceDeclaration {
    // Track that we're generating this interface
    this.generatedInterfaces.add(name);
    
    // Convert object type to interface
    const interfaceDecl = this.convertObjectType(type);
    
    // Override name
    interfaceDecl.name = name;
    
    // Add to imports if needed
    this.trackInterfaceDependencies(type);
    
    return interfaceDecl;
}
```

**Checklist:**
- [ ] Generate proper interface structure
- [ ] Handle naming conflicts
- [ ] Track generated interfaces
- [ ] Add JSDoc comments
- [ ] Support extends clauses
- [ ] Write integration tests

**Test Cases:**
```typescript
it('should generate entity interface', () => {
    const objectType = new ObjectType(
        new ImmutableMap(new Map([
            ['id', new PrimitiveType(PrimitiveKind.NUMBER)],
            ['name', new PrimitiveType(PrimitiveKind.STRING)]
        ])),
        new ImmutableSet(new Set(['id', 'name']))
    );
    
    const iface = generator.generateEntityInterface('User', objectType);
    
    expect(iface.name).toBe('User');
    expect(iface.members).toHaveLength(2);
    expect(iface.members[0].name).toBe('id');
});
```

---

### Day 5: Error Handling & Edge Cases

#### Task 5.1: Add Comprehensive Error Handling
```typescript
private semanticTypeToTSType(type: SemanticType): TSTypeNode {
    try {
        // ... existing implementation
    } catch (error) {
        // Log detailed error information
        console.error(`Failed to convert type: ${JSON.stringify(type)}`);
        
        // Return error type with comment
        return new TSTypeReference('unknown', [], 
            `// Error: ${error.message}`
        );
    }
}
```

**Checklist:**
- [ ] Add try-catch blocks
- [ ] Log conversion errors with context
- [ ] Return fallback types on error
- [ ] Add error recovery strategies
- [ ] Write error scenario tests

---

#### Task 5.2: Handle Edge Cases
**Edge cases to handle:**
- Circular type references
- Very deep type nesting
- Empty object types
- Unknown/unresolved types
- Malformed semantic types

**Checklist:**
- [ ] Implement circular reference detection
- [ ] Add depth limit for nested types
- [ ] Handle empty objects gracefully
- [ ] Test all edge cases
- [ ] Document known limitations

---

## Week 4: Integration & Testing (Days 6-10)

### Day 6: Integration with TSFile Generation

#### Task 6.1: Implement File Generation
```typescript
public generateFile(
    interfaces: Map<string, ObjectType>
): TSFile {
    const members: TSNode[] = [];
    
    // Generate all interfaces
    for (const [name, type] of interfaces) {
        const iface = this.generateEntityInterface(name, type);
        members.push(iface);
    }
    
    // Generate imports
    const imports = this.generateImports();
    
    return new TSFile([...imports, ...members]);
}

private generateImports(): TSImportDeclaration[] {
    const imports: TSImportDeclaration[] = [];
    
    for (const spec of this.importCollector.getImports()) {
        imports.push(new TSImportDeclaration(
            Array.from(spec.named),
            spec.source,
            spec.defaultImport,
            spec.namespaceImport
        ));
    }
    
    return imports;
}
```

**Checklist:**
- [ ] Generate complete TSFile
- [ ] Include imports at top
- [ ] Order declarations properly
- [ ] Add file-level comments
- [ ] Write integration tests

---

### Day 7: End-to-End Testing

#### Task 7.1: Create Integration Test Suite
**File:** `packages/core/src/compiler/generators/typescript/__tests__/TypeScriptGenerator.integration.test.ts`

```typescript
describe('TypeScriptGenerator Integration', () => {
    let generator: TypeScriptGenerator;
    let formatter: TSFormatter;
    
    beforeEach(() => {
        generator = new TypeScriptGenerator();
        formatter = new TSFormatter();
    });
    
    it('should generate complete type file', () => {
        // Create complex semantic types
        const userType = new ObjectType(/* ... */);
        const postType = new ObjectType(/* ... */);
        
        // Generate file
        const file = generator.generateFile(new Map([
            ['User', userType],
            ['Post', postType]
        ]));
        
        // Format to string
        const code = formatter.format(file);
        
        // Verify output
        expect(code).toContain('interface User');
        expect(code).toContain('interface Post');
        
        // Verify TypeScript compilation
        expect(() => compileTypeScript(code)).not.toThrow();
    });
});
```

**Test Scenarios:**
1. Simple interface generation
2. Complex nested types
3. Multiple interfaces with dependencies
4. Circular dependencies
5. Generic types
6. Union/intersection types
7. Array types (readonly/mutable)

**Checklist:**
- [ ] Write 20+ integration tests
- [ ] Cover all type combinations
- [ ] Test import generation
- [ ] Verify TypeScript compilation
- [ ] Test error scenarios

---

### Day 8: Performance & Optimization

#### Task 8.1: Add Caching
```typescript
export class TypeScriptGenerator implements IGenerator {
    private typeCache = new Map<string, TSTypeNode>();
    private interfaceCache = new Map<string, TSInterfaceDeclaration>();
    
    private semanticTypeToTSType(type: SemanticType): TSTypeNode {
        const hash = this.hashType(type);
        
        if (this.typeCache.has(hash)) {
            return this.typeCache.get(hash)!;
        }
        
        const result = this.convertType(type);
        this.typeCache.set(hash, result);
        return result;
    }
}
```

**Checklist:**
- [ ] Add type hashing
- [ ] Implement type cache
- [ ] Implement interface cache
- [ ] Measure performance improvements
- [ ] Write performance tests

---

#### Task 8.2: Optimize Import Collection
```typescript
export class ImportCollector {
    // Use more efficient data structures
    private importsBySource = new Map<string, Set<string>>();
    
    addNamedImport(name: string, source: string): void {
        if (!this.importsBySource.has(source)) {
            this.importsBySource.set(source, new Set());
        }
        this.importsBySource.get(source)!.add(name);
    }
}
```

**Checklist:**
- [ ] Optimize data structures
- [ ] Add benchmarks
- [ ] Profile with large type sets
- [ ] Document performance characteristics

---

### Day 9: Documentation & Examples

#### Task 9.1: Write Comprehensive Documentation
**File:** `packages/core/src/compiler/generators/typescript/README.md`

**Content:**
- Overview of TypeScriptGenerator
- Architecture diagram
- API documentation
- Usage examples
- Type conversion table
- Best practices
- Known limitations

**Checklist:**
- [ ] Write README.md
- [ ] Add JSDoc to all public methods
- [ ] Create usage examples
- [ ] Document type conversion rules
- [ ] Add troubleshooting guide

---

#### Task 9.2: Create Example Usage
**File:** `packages/core/src/compiler/generators/typescript/examples/basic-usage.ts`

```typescript
import { TypeScriptGenerator } from '../TypeScriptGenerator';
import { TSFormatter } from '../../formatting/typescript/TSFormatter';

// Example: Generate User interface
const generator = new TypeScriptGenerator();
const formatter = new TSFormatter();

const userType = new ObjectType(/* ... */);
const userInterface = generator.generateEntityInterface('User', userType);

const file = new TSFile([userInterface]);
const code = formatter.format(file);

console.log(code);
// Output:
// interface User {
//   id: number;
//   name: string;
// }
```

**Checklist:**
- [ ] Create 5+ runnable examples
- [ ] Cover common use cases
- [ ] Add explanatory comments
- [ ] Verify examples work

---

### Day 10: Final Integration & Cleanup

#### Task 10.1: Connect to Pipeline
**File:** `packages/core/src/compiler/generators/index.ts`

```typescript
export { TypeScriptGenerator } from './typescript/TypeScriptGenerator';
export { ImportCollector } from './typescript/ImportCollector';
export type { ImportSpec } from './typescript/ImportCollector';
```

**Checklist:**
- [ ] Add to index exports
- [ ] Update compiler.ts if needed
- [ ] Verify all imports work
- [ ] Run full test suite

---

#### Task 10.2: Code Review & Cleanup
**Checklist:**
- [ ] Remove dead code
- [ ] Remove console.logs
- [ ] Fix linting issues
- [ ] Add missing tests
- [ ] Update CHANGELOG.md
- [ ] Create PR

---

## Success Criteria

### Code Quality
- [ ] All unit tests pass (>90% coverage)
- [ ] All integration tests pass
- [ ] No linting errors
- [ ] No TypeScript errors
- [ ] Performance benchmarks meet targets

### Functionality
- [ ] All primitive types convert correctly
- [ ] Reference types with import tracking
- [ ] Collection types (readonly/mutable)
- [ ] Union and intersection types
- [ ] Generic types with parameters
- [ ] Object types to interfaces
- [ ] Circular reference handling
- [ ] Error recovery mechanisms

### Documentation
- [ ] README.md complete
- [ ] All public APIs documented
- [ ] Examples provided
- [ ] Architecture documented

### Integration
- [ ] Exports in index.ts
- [ ] Works with TSFormatter
- [ ] Compatible with pipeline
- [ ] No breaking changes

---

## Risk Mitigation

### Risk 1: Type Conversion Complexity
**Mitigation:** Start with simple types, add complexity incrementally

### Risk 2: Import Tracking Issues
**Mitigation:** Comprehensive unit tests for ImportCollector

### Risk 3: Performance with Large Types
**Mitigation:** Add caching early, profile regularly

### Risk 4: Edge Cases
**Mitigation:** Dedicated day for edge case handling

---

## Daily Standup Questions

1. **Yesterday:** What did I complete?
2. **Today:** What am I working on?
3. **Blockers:** Any impediments?
4. **Tests:** Are tests passing?
5. **Progress:** On track for week goals?

---

## Deliverables Checklist

- [ ] TypeScriptGenerator.ts (fully implemented)
- [ ] ImportCollector.ts (fully implemented)
- [ ] semanticTypeToTSType() (all type kinds)
- [ ] generateEntityInterface() (complete)
- [ ] 50+ unit tests
- [ ] 20+ integration tests
- [ ] README.md documentation
- [ ] 5+ usage examples
- [ ] Performance benchmarks
- [ ] Code review approved
- [ ] PR merged

---

## Next Steps (Phase 4)

After Phase 3 completion:
- Integrate with Scanner
- Implement full pipeline
- Add CLI interface
- Deploy to production

---

**Status:** Ready to start
**Estimated Effort:** 10 days
**Risk Level:** Medium
**Dependencies:** Target AST complete, SemanticType system ready
