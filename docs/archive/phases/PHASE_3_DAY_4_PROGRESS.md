# Phase 3 Day 4: Interface Generation - Progress Tracker

**Date:** 2026-01-XX  
**Focus:** Object Types & Interfaces  
**Estimated Time:** 4-5 hours

---

## 🎯 Objectives

### Task 4.1: Enhance Object Type Conversion ✅ (Already Done in Day 3)
- [x] `convertObjectType()` fully implemented
- [x] Handle all properties
- [x] Support optional vs required
- [x] Support readonly properties
- [x] Handle base objects (extends)
- [x] Synthetic type name generation
- [x] Import tracking for property types

### Task 4.2: Implement generateEntityInterface()
**Goal:** Public API method untuk generate interface dari ObjectType

#### Checklist:
- [ ] Add `generateEntityInterface(name: string, type: ObjectType)` method
- [ ] Handle naming conflicts
- [ ] Track generated interfaces
- [ ] Support extends clauses
- [ ] Handle inheritance (baseObject)
- [ ] Handle interface implementations
- [ ] Write 8+ interface tests

---

## 📋 Implementation Plan

### Step 1: Add generateEntityInterface() Method

```typescript
/**
 * Generate entity interface dari ObjectType
 * 
 * Public API untuk creating interface declarations directly from ObjectType.
 * Used when not working with full ContractGraph.
 * 
 * @param name - Interface name
 * @param type - ObjectType to convert
 * @returns TSInterfaceDeclaration
 * 
 * @example
 * ```typescript
 * const userType = new ObjectType(
 *   new ImmutableMap(new Map([
 *     ['id', new PrimitiveType(PrimitiveKind.NUMBER)],
 *     ['name', new PrimitiveType(PrimitiveKind.STRING)]
 *   ])),
 *   new ImmutableSet(new Set(['id', 'name']))
 * );
 * 
 * const iface = generator.generateEntityInterface('User', userType);
 * // → interface User { id: number; name: string; }
 * ```
 */
public generateEntityInterface(
    name: string,
    type: ObjectType
): TSInterfaceDeclaration {
    // Implementation
}
```

### Step 2: Extract Properties from ObjectType

```typescript
/**
 * Extract property definitions dari ObjectType
 * 
 * Converts ObjectType.properties (ImmutableMap) to PropertyDefinition[]
 * Determines optional vs required dari ObjectType.requiredProperties
 * 
 * @param type - ObjectType
 * @returns Array of property definitions
 */
private extractPropertiesFromObjectType(
    type: ObjectType
): PropertyDefinition[] {
    const properties: PropertyDefinition[] = [];
    
    for (const [propName, propType] of type.properties.entries()) {
        const isRequired = type.requiredProperties.has(propName);
        
        properties.push({
            name: propName,
            type: propType,
            optional: !isRequired,
            readonly: false, // TODO: Add mutability tracking
            description: undefined
        });
    }
    
    return properties;
}
```

### Step 3: Handle Extends Clause

```typescript
/**
 * Build extends clause dari ObjectType.baseObject
 * 
 * @param type - ObjectType
 * @returns Array of base type names (empty if no inheritance)
 */
private buildExtendsClause(type: ObjectType): string[] {
    const extendsTypes: string[] = [];
    
    if (type.baseObject && type.baseObject.kind === 'reference') {
        extendsTypes.push(type.baseObject.name);
        this.collectImportRequirement(type.baseObject.name);
    }
    
    // Handle interface implementations
    if (type.interfaces) {
        for (const iface of type.interfaces) {
            if (iface.kind === 'reference') {
                extendsTypes.push(iface.name);
                this.collectImportRequirement(iface.name);
            }
        }
    }
    
    return extendsTypes;
}
```

---

## 🧪 Test Plan

### Test Suite: generateEntityInterface()

```typescript
describe('TypeScriptGenerator > generateEntityInterface()', () => {
    let generator: TypeScriptGenerator;
    
    beforeEach(() => {
        generator = new TypeScriptGenerator();
    });
    
    describe('Basic Interface Generation', () => {
        it('should generate simple interface', () => {
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
            expect(iface.exported).toBe(true);
        });
        
        it('should handle optional properties', () => {
            const objectType = new ObjectType(
                new ImmutableMap(new Map([
                    ['id', new PrimitiveType(PrimitiveKind.NUMBER)],
                    ['name', new PrimitiveType(PrimitiveKind.STRING)],
                    ['email', new PrimitiveType(PrimitiveKind.STRING)]
                ])),
                new ImmutableSet(new Set(['id', 'name'])) // email is optional
            );
            
            const iface = generator.generateEntityInterface('User', objectType);
            
            const emailProp = iface.members.find(m => m.name === 'email');
            expect(emailProp?.optional).toBe(true);
            
            const idProp = iface.members.find(m => m.name === 'id');
            expect(idProp?.optional).toBe(false);
        });
    });
    
    describe('Complex Property Types', () => {
        it('should handle nested objects', () => {
            // Test nested ObjectType
        });
        
        it('should handle arrays', () => {
            // Test collection types
        });
        
        it('should handle unions', () => {
            // Test union types
        });
    });
    
    describe('Inheritance', () => {
        it('should handle base object (extends)', () => {
            // Test ObjectType dengan baseObject
        });
        
        it('should handle interface implementations', () => {
            // Test ObjectType dengan interfaces
        });
        
        it('should handle multiple inheritance', () => {
            // Test extends multiple interfaces
        });
    });
    
    describe('Import Tracking', () => {
        it('should track imports for reference types', () => {
            // Verify import collection
        });
        
        it('should track imports for base types', () => {
            // Verify extends types imported
        });
    });
    
    describe('Naming & Conflicts', () => {
        it('should prevent duplicate interface generation', () => {
            // Generate same name twice
        });
        
        it('should track generated interface names', () => {
            // Verify generatedTypes.has()
        });
    });
});
```

---

## 📊 Progress Tracking

### Implementation Progress
- [ ] Step 1: Add generateEntityInterface() signature
- [ ] Step 2: Add extractPropertiesFromObjectType() helper
- [ ] Step 3: Add buildExtendsClause() helper
- [ ] Step 4: Implement main logic
- [ ] Step 5: Add error handling
- [ ] Step 6: Add JSDoc documentation

### Testing Progress
- [ ] Test 1: Basic interface generation
- [ ] Test 2: Optional properties handling
- [ ] Test 3: Complex property types
- [ ] Test 4: Inheritance (extends)
- [ ] Test 5: Interface implementations
- [ ] Test 6: Import tracking
- [ ] Test 7: Naming conflicts
- [ ] Test 8: Edge cases

### Documentation Progress
- [ ] JSDoc for generateEntityInterface()
- [ ] JSDoc for helper methods
- [ ] Usage examples in comments
- [ ] Update README if needed

---

## 🎯 Success Criteria

- [x] convertObjectType() working (Day 3)
- [ ] generateEntityInterface() fully implemented
- [ ] 8+ new unit tests (all passing)
- [ ] Interface inheritance working
- [ ] Import tracking complete
- [ ] No TypeScript compilation errors
- [ ] All 63+ previous tests still passing

---

## 📝 Notes

### Key Decisions:
1. **PropertyDefinition Interface**: Reuse existing interface dari transformEntityToInterface()
2. **Required vs Optional**: Use ObjectType.requiredProperties set
3. **Readonly**: Currently not tracked dalam ObjectType (future enhancement)
4. **Naming**: Use provided name parameter directly

### Risks:
- ⚠️ **MEDIUM**: ObjectType inheritance complexity (baseObject + interfaces)
- ⚠️ **LOW**: Naming conflicts dengan synthetic types
- ⚠️ **LOW**: Property order consistency

### Dependencies:
- ✅ ObjectType fully implemented (Phase 2)
- ✅ TSInterfaceDeclaration (Target AST)
- ✅ TSPropertySignature (Target AST)
- ✅ ImportCollector (Day 1)

---

**Status:** Ready to Start  
**Next:** Implement generateEntityInterface() method

