# Phase 3 Day 9: Nested Object Flattening (Phase 2) - EXECUTION PROMPT

**Tanggal:** 2026-08-06  
**Phase:** Phase 2 - Nested Object Flattening  
**Approach:** Evidence-Based Reverse Engineering  
**Estimated Time:** 8-12 hours  

---

## 🎯 Objective

Implementasi **nested object flattening** untuk mengubah nested properties menjadi flat camelCase properties di TypeScript output.

**Example Transformation:**
```typescript
// BEFORE (Phase 1 - Current):
export interface OrderResourceTransformed {
    id: string;
    userId: string;
    items: string;           // ❌ Nested object as string
    shipping: string;        // ❌ Nested object as string
    promotion: string;       // ❌ Nested object as string
}

// AFTER (Phase 2 - Target):
export interface OrderResourceTransformed {
    id: string;
    userId: string;
    // ✅ Flattened from items[0].product_id
    itemsProductId: number;
    itemsQty: number;
    // ✅ Flattened from shipping.address
    shippingAddress: string;
    shippingCity: string;
    shippingPostalCode: string;
    // ✅ Flattened from promotion.code
    promotionCode: string;
    promotionDiscount: number;
}
```

---

## 📚 MANDATORY: Reverse Engineering First!

**CRITICAL RULE:** Sebelum menulis kode, lakukan reverse engineering terhadap sistem yang ada!

### Step 0: Evidence Collection (2-3 hours)

**Reverse engineering checklist:**

#### 0.1. Understand Current Data Flow
```bash
# Trace bagaimana data mengalir dari manifest ke output
# File yang WAJIB dibaca dan di-trace:

1. packages/cli/src/generators/CompilerBridge.ts
   - Method: manifestToSemanticTypes()
   - Focus: Bagaimana ResourceFieldKind di-process?
   - Question: Apakah ada handling untuk nested objects?

2. packages/core/src/types/route.ts
   - Type: ResourceFieldKind
   - Evidence: Apa struktur sebenarnya?
   - Question: Apakah ada { kind: 'object'; fields: ... }?

3. packages/core/src/compiler/types/SemanticType.ts
   - Type: ObjectType, SemanticType
   - Evidence: Bagaimana nested properties disimpan?
   - Question: Apakah properties Map support nested?

4. packages/core/src/compiler/passes/TypeScriptGeneratorPass.ts
   - Method: buildCodeFromTypes()
   - Evidence: Bagaimana properties di-iterate?
   - Question: Dimana nested handling bisa di-inject?
```

**DELIVERABLE:** Dokumen `PHASE_2_EVIDENCE_ANALYSIS.md` dengan:
- Data flow diagram (manifest → SemanticType → TypeScript)
- Type definitions dengan actual evidence (bukan asumsi!)
- Entry points untuk flattening logic
- Dependencies dan side effects

#### 0.2. Analyze ResourceFieldKind Structure

**Task:** Reverse engineer actual `ResourceFieldKind` type

```bash
# WAJIB: Read actual type definition
cat packages/core/src/types/route.ts | grep -A 20 "export type ResourceFieldKind"

# Analyze usage patterns
grep -r "ResourceFieldKind" packages/cli/src/generators/ --include="*.ts"

# Find examples in manifest
cat /tmp/toko-manifest-day8.json | jq '.resources[0].fields' | head -50
```

**Questions to answer:**
1. ✅ Apakah type support recursive nesting via `{ kind: 'object'; fields: ... }`?
2. ✅ Bagaimana array of objects direpresentasikan?
3. ✅ Apakah ada metadata (nullable, resolved, semantic)?
4. ✅ Example real-world dari manifest toko-online?

**DELIVERABLE:** Section dalam `PHASE_2_EVIDENCE_ANALYSIS.md`:
```markdown
## ResourceFieldKind Type Analysis

### Actual Type Definition
```typescript
// Evidence: packages/core/src/types/route.ts lines X-Y
export type ResourceFieldKind = ...
```

### Usage Patterns
- CompilerBridge usage: Line X → converts to SemanticType
- Current handling: Nested objects → converted to PrimitiveType('string')
- Missing: Recursive traversal logic

### Real-World Examples from toko-online manifest
```json
{
  "items": {
    "kind": "object",
    "fields": {
      "product_id": { "kind": "primitive", "type": "number" },
      "qty": { "kind": "primitive", "type": "number" }
    }
  }
}
```
```

#### 0.3. Map Current Type Conversion Flow

**Task:** Trace bagaimana nested objects currently handled

```bash
# Find where nested objects processed
grep -n "kind === 'object'" packages/cli/src/generators/CompilerBridge.ts

# Check resourceFieldToSemanticType method
sed -n '/resourceFieldToSemanticType/,/^  }/p' packages/cli/src/generators/CompilerBridge.ts
```

**Evidence to collect:**
1. Current behavior untuk nested objects
2. Fallback handling (probably → `PrimitiveType('string')`)
3. Where to inject flattening logic
4. Impact pada downstream (TypeScriptGeneratorPass)

**DELIVERABLE:** Flow diagram dalam `PHASE_2_EVIDENCE_ANALYSIS.md`:
```
Manifest (nested ResourceFieldKind)
    ↓
CompilerBridge.resourceFieldToSemanticType()
    ↓ [Current: Returns PrimitiveType('string') for nested]
    ↓ [Proposed: Flatten to multiple properties]
SemanticType (ObjectType with flat properties)
    ↓
TypeScriptGeneratorPass.buildCodeFromTypes()
    ↓
TypeScript output (flat camelCase properties)
```

#### 0.4. Identify Integration Points

**Task:** Find exact locations untuk inject flattening logic

```typescript
// WAJIB: Document setiap entry point dengan evidence

1. CompilerBridge.manifestToSemanticTypes() - Line ???
   Evidence: Current code at this line
   Proposed: Where to call flattenResourceFields()
   
2. CompilerBridge.resourceFieldToSemanticType() - Line ???
   Evidence: Current nested object handling
   Proposed: Recursive flattening here
   
3. TypeScriptGeneratorPass (if needed) - Line ???
   Evidence: Current property iteration
   Proposed: No changes needed? (properties already flat)
```

**DELIVERABLE:** Integration plan dalam `PHASE_2_EVIDENCE_ANALYSIS.md`

---

## 📋 Implementation Plan (AFTER Evidence Collection!)

### Phase 2A: Flattening Core Logic (3-4 hours)

**Prerequisites:** 
- ✅ `PHASE_2_EVIDENCE_ANALYSIS.md` complete
- ✅ All entry points identified with line numbers
- ✅ Type definitions verified with evidence

#### Task 1: Implement Type-Safe Flattening Context

**File:** `packages/cli/src/generators/CompilerBridge.ts`

**Evidence-Based Implementation:**

```typescript
/**
 * Context for nested object flattening
 * Based on evidence from ResourceFieldKind structure
 */
interface FlatteningContext {
    /** Current property path prefix (e.g., 'shipping', 'items') */
    readonly prefix: string
    
    /** Visited fields (circular reference detection) */
    readonly visited: WeakSet<object>
    
    /** Used property names (collision detection) */
    readonly usedNames: Set<string>
    
    /** Maximum nesting depth (prevent stack overflow) */
    readonly maxDepth: number
    
    /** Current depth */
    readonly currentDepth: number
}

/**
 * Result of flattening one property
 */
interface FlattenedProperty {
    /** Final camelCase name (e.g., 'shippingAddress') */
    readonly name: string
    
    /** Primitive type for this property */
    readonly type: PrimitiveType
    
    /** Original path for debugging (e.g., 'shipping.address') */
    readonly originalPath: string
    
    /** Whether nullable */
    readonly nullable: boolean
}
```

**Evidence requirement:** Verify actual `ResourceFieldKind` fields support this structure!

#### Task 2: Implement Recursive Flattening Algorithm

**File:** `packages/cli/src/generators/CompilerBridge.ts`

**CRITICAL:** Use actual `ResourceFieldKind` discriminated union from evidence!

```typescript
/**
 * Flatten nested ResourceFieldKind into flat properties
 * 
 * Evidence-based implementation using ACTUAL ResourceFieldKind type
 * from packages/core/src/types/route.ts
 * 
 * @param field - ResourceFieldKind from manifest
 * @param context - Flattening context
 * @returns Array of flattened properties
 */
private static flattenResourceField(
    field: ResourceFieldKind,
    context: FlatteningContext
): readonly FlattenedProperty[] {
    const results: FlattenedProperty[] = []
    
    // Depth limit
    if (context.currentDepth > context.maxDepth) {
        console.warn(`[CompilerBridge] Max depth ${context.maxDepth} reached`)
        return results
    }
    
    // Circular reference check
    if (context.visited.has(field)) {
        console.warn(`[CompilerBridge] Circular reference detected`)
        return results
    }
    
    const newVisited = new WeakSet(context.visited)
    newVisited.add(field)
    
    // ✅ Type-safe discriminated union (exhaustive switch)
    // Based on ACTUAL ResourceFieldKind from evidence!
    switch (field.kind) {
        case 'primitive': {
            // Base case: primitive type
            const propName = context.prefix || 'unknownProp'
            const nullable = field.nullable ?? false
            
            results.push({
                name: propName,
                type: this.primitiveStringToSemanticType(field.type),
                originalPath: context.prefix,
                nullable
            })
            break
        }
        
        case 'object': {
            // Recursive case: nested object
            if (!field.fields) {
                console.warn(`[CompilerBridge] Object has no fields at "${context.prefix}"`)
                break
            }
            
            for (const [key, nestedField] of Object.entries(field.fields)) {
                const camelKey = this.toCamelCase(key)
                
                // Build path: 'shipping' + 'Address' = 'shippingAddress'
                const fullPrefix = context.prefix
                    ? `${context.prefix}${this.capitalize(camelKey)}`
                    : camelKey
                
                const nestedContext: FlatteningContext = {
                    prefix: fullPrefix,
                    visited: newVisited,
                    usedNames: context.usedNames,
                    maxDepth: context.maxDepth,
                    currentDepth: context.currentDepth + 1
                }
                
                // Recurse!
                const nestedResults = this.flattenResourceField(nestedField, nestedContext)
                results.push(...nestedResults)
            }
            break
        }
        
        case 'model':
        case 'resource': {
            // Model/Resource reference - treat as string for Phase 2
            // Phase 3 could expand this
            const propName = context.prefix || 'unknownModel'
            results.push({
                name: propName,
                type: new PrimitiveType(PrimitiveKind.STRING),
                originalPath: context.prefix,
                nullable: field.nullable ?? false
            })
            break
        }
        
        case 'unknown': {
            // Unknown type - fallback to string
            const propName = context.prefix || 'unknownProp'
            results.push({
                name: propName,
                type: new PrimitiveType(PrimitiveKind.STRING),
                originalPath: context.prefix,
                nullable: true
            })
            break
        }
        
        default: {
            // Exhaustiveness check
            const _exhaustive: never = field
            throw new Error(`Unhandled ResourceFieldKind: ${JSON.stringify(field)}`)
        }
    }
    
    return results
}

/**
 * Capitalize first letter (helper for path building)
 */
private static capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * Convert primitive type string to SemanticType
 */
private static primitiveStringToSemanticType(typeStr: string): PrimitiveType {
    const normalized = typeStr.toLowerCase()
    
    if (normalized === 'number' || normalized === 'int' || normalized === 'float') {
        return new PrimitiveType(PrimitiveKind.NUMBER)
    }
    if (normalized === 'boolean' || normalized === 'bool') {
        return new PrimitiveType(PrimitiveKind.BOOLEAN)
    }
    if (normalized === 'string' || normalized === 'text') {
        return new PrimitiveType(PrimitiveKind.STRING)
    }
    
    // Default
    return new PrimitiveType(PrimitiveKind.STRING)
}
```

**Evidence checkpoint:** Verify `ResourceFieldKind` actually has these cases!

#### Task 3: Integrate Flattening into Resource Processing

**File:** `packages/cli/src/generators/CompilerBridge.ts`

**Location:** Around line ~120 (resource processing loop)

```typescript
// BEFORE (Phase 1):
for (const [fieldName, fieldKind] of Object.entries(resource.fields || {})) {
    const camelName = this.toCamelCase(fieldName)
    const fieldType = this.resourceFieldToSemanticType(fieldKind)
    properties.set(camelName, fieldType)
}

// AFTER (Phase 2):
for (const [fieldName, fieldKind] of Object.entries(resource.fields || {})) {
    const camelName = this.toCamelCase(fieldName)
    
    // Create flattening context
    const context: FlatteningContext = {
        prefix: camelName,
        visited: new WeakSet(),
        usedNames: new Set(Array.from(properties.keys())),
        maxDepth: 5,  // Reasonable limit
        currentDepth: 0
    }
    
    // Flatten nested fields
    const flattenedProps = this.flattenResourceField(fieldKind, context)
    
    // Add all flattened properties
    for (const prop of flattenedProps) {
        // Collision check
        if (properties.has(prop.name)) {
            console.warn(`[CompilerBridge] Property collision: ${prop.name} (from ${prop.originalPath})`)
            // Could add suffix: prop.name + '2'
        }
        
        properties.set(prop.name, prop.type)
    }
}
```

**Evidence checkpoint:** Verify this is the correct integration point!

### Phase 2B: Testing & Validation (2-3 hours)

#### Task 4: Create Flattening Tests

**File:** `packages/cli/src/generators/__tests__/CompilerBridge-flattening.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { CompilerBridge } from '../CompilerBridge'
import type { ResourceFieldKind } from '@routesync/core/types/route'

describe('CompilerBridge - Nested Object Flattening (Phase 2)', () => {
    describe('Basic Flattening', () => {
        it('should flatten nested object properties', () => {
            // Test case based on ACTUAL toko-online manifest structure
            const nestedField: ResourceFieldKind = {
                kind: 'object',
                fields: {
                    address: { kind: 'primitive', type: 'string' },
                    city: { kind: 'primitive', type: 'string' },
                    postal_code: { kind: 'primitive', type: 'string' }
                }
            }
            
            // Create mock resource
            const resource = {
                name: 'OrderResource',
                fields: {
                    id: { kind: 'primitive', type: 'string' },
                    shipping: nestedField
                }
            }
            
            // Call CompilerBridge (via manifestToSemanticTypes)
            // Verify flattened output:
            // - shippingAddress: string
            // - shippingCity: string
            // - shippingPostalCode: string
        })
    })
    
    describe('Array Flattening', () => {
        it('should flatten array of objects', () => {
            // Test case for items: [{ product_id, qty }]
            // Should produce: itemsProductId, itemsQty
        })
    })
    
    describe('Edge Cases', () => {
        it('should handle circular references', () => {
            // Test circular reference detection
        })
        
        it('should handle naming collisions', () => {
            // Test: id + user.id → userId2 or userUserId
        })
        
        it('should respect max depth limit', () => {
            // Test deep nesting (5+ levels)
        })
    })
})
```

#### Task 5: Real-World Testing

**Test with toko-online manifest:**

```bash
# Rebuild
npm run build

# Regenerate with Phase 2
node dist/cli.js generate --manifest /tmp/toko-manifest-day8.json \
  --output /tmp/toko-sdk-phase2

# Verify output
cat /tmp/toko-sdk-phase2/types/api-read.ts
```

**Expected improvements:**
```typescript
// BEFORE (Phase 1):
export interface OrderResourceTransformed {
    items: string;           // ❌ Nested as string
    shipping: string;        // ❌ Nested as string
}

// AFTER (Phase 2):
export interface OrderResourceTransformed {
    itemsProductId: number;  // ✅ Flattened
    itemsQty: number;        // ✅ Flattened
    shippingAddress: string; // ✅ Flattened
    shippingCity: string;    // ✅ Flattened
}
```

### Phase 2C: Documentation (1 hour)

#### Task 6: Create Completion Document

**File:** `PHASE_3_DAY_9_PHASE_2_COMPLETE.md`

**Contents:**
- Evidence analysis summary
- Implementation details
- Test results
- Before/After comparison
- Known limitations
- Phase 3 planning (if needed)

---

## 🚨 Critical Constraints

### DO NOT Skip Evidence Collection!

**MANDATORY CHECKS before implementation:**

1. ✅ `ResourceFieldKind` actual type verified
2. ✅ CompilerBridge integration points identified with line numbers
3. ✅ Current behavior documented with evidence
4. ✅ Real-world examples from manifest analyzed
5. ✅ Data flow completely traced

### Type Safety Requirements

**NO `any` types allowed:**
- ✅ Use discriminated union exhaustive switch
- ✅ Explicit type guards for narrowing
- ✅ WeakSet for circular reference tracking
- ✅ Readonly interfaces for immutability

### Testing Requirements

**Comprehensive test coverage:**
- ✅ Unit tests for flattening algorithm
- ✅ Integration tests with real manifest
- ✅ Edge case tests (circular, collision, depth)
- ✅ Real-world validation (toko-online)

---

## 📊 Success Criteria

### Phase 2 Complete When:

- [x] Evidence analysis document complete
- [x] Flattening algorithm implemented (type-safe)
- [x] Integration into CompilerBridge complete
- [x] All unit tests passing (10+ tests)
- [x] Real-world test successful (toko-online)
- [x] TypeScript compilation successful
- [x] Documentation complete

### Output Quality:

**Nested objects flattened:**
```typescript
// ✅ shipping.address → shippingAddress
// ✅ items[0].product_id → itemsProductId
// ✅ promotion.code → promotionCode
```

**Type accuracy:**
```typescript
// ✅ Proper primitive types (number, string, boolean)
// ✅ No generic 'string' for all nested fields
```

**Maintainability:**
```typescript
// ✅ Clear algorithm with comments
// ✅ Evidence-based implementation
// ✅ Comprehensive tests
```

---

## 🎯 Execution Instructions

### For AI Assistant:

**Step 1: Evidence Collection (MANDATORY)**
```
Read and analyze:
1. packages/core/src/types/route.ts (ResourceFieldKind type)
2. packages/cli/src/generators/CompilerBridge.ts (current implementation)
3. /tmp/toko-manifest-day8.json (real-world examples)

Create: PHASE_2_EVIDENCE_ANALYSIS.md with complete findings
```

**Step 2: Implementation**
```
After evidence collection complete:
1. Implement FlatteningContext and FlattenedProperty types
2. Implement flattenResourceField() recursive algorithm
3. Integrate into resource processing loop
4. Add helper functions (capitalize, primitiveStringToSemanticType)
```

**Step 3: Testing**
```
1. Create test file: CompilerBridge-flattening.test.ts
2. Write 10+ comprehensive tests
3. Run tests: npx vitest run
4. Real-world test: regenerate toko-online SDK
```

**Step 4: Documentation**
```
Create: PHASE_3_DAY_9_PHASE_2_COMPLETE.md
Include: Evidence → Implementation → Testing → Results
```

### For Human Developer:

```bash
# Start with evidence collection
cat PHASE_2_EVIDENCE_ANALYSIS.md

# Review implementation plan
cat PHASE_3_DAY_9_PHASE_2_PROMPT.md

# Execute with AI
# Provide manifest location and verification commands

# Review output
cat /tmp/toko-sdk-phase2/types/api-read.ts
```

---

## 📚 References

- Phase 1 Complete: `PHASE_3_DAY_8_COMPLETE.md`
- Evidence-Based Architecture: `.kiro/steering/evidence-based-architecture.md`
- Reverse Engineering Skill: `.kiro/skills/reverse-engineering/SKILL.md`
- Large Codebase Principles: `.kiro/steering/large-codebase-architecture.md`

---

**Created:** 2026-08-06  
**Status:** Ready for Evidence Collection  
**Approach:** Evidence-Based Reverse Engineering First  
**Estimated Duration:** 8-12 hours

🚀 **Remember: Evidence First, Implementation Second!**
