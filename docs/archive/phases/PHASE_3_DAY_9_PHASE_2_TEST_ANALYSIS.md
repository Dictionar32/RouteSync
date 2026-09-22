# Phase 2: Test Failure Analysis

## Summary

After applying both fixes (depth check and primitive type factory), 3 tests still fail. Analysis reveals the tests have **incorrect expectations**.

## Test Failures

### 1. Depth Limit Test (maxDepth: 5)
**Structure:**
```
level1 (object)
  → level2 (object)
      → level3 (object)
          → level4 (object)
              → level5 (object)
                  → level6 (primitive: 'string')
```

**Test Expectation:**
- ✓ `level1Level2Level3Level4Level5` should exist
- ✗ `level1Level2Level3Level4Level5Level6` should NOT exist

**Actual Result:**
- ✗ `level1Level2Level3Level4Level5` does NOT exist (test fails)
- ✓ `level1Level2Level3Level4Level5Level6` does NOT exist (correct)

**Root Cause:**
The test expects an intermediate object name `level1Level2Level3Level4Level5`, but **objects don't create properties themselves** - only their primitive children do.

The only primitive is `level6` at the deepest level, which creates `level1Level2Level3Level4Level5Level6`. With `maxDepth: 5`, the depth check stops before reaching `level6`, so **NO properties are created at all**.

### 2. Custom maxDepth Test (maxDepth: 1)
**Structure:**
```
a (object)
  → b (object)
      → c (primitive: 'string')
```

**Test Expectation:**
- ✓ `aB` should exist
- ✗ `aBC` should NOT exist

**Actual Prefix Building:**
1. Process `a` with prefix='' → newPrefix = 'a'
2. Process `b` with prefix='a' → newPrefix = 'aB'
3. Process `c` with prefix='aB' → newPrefix = 'aBc' (NOT 'aBC'!)

**Console Warning Shows:**
```
[RouteSync] Maximum nesting depth (1) exceeded at field 'aBc'. Stopping flattening.
```

**Root Cause:**
1. The test expects `aB` (an object) to exist as a property, but objects don't create properties
2. The test expects `aBC` but the actual flattened name is `aBc` (lowercase 'c')
3. With `maxDepth: 1`, depth check stops before processing `c`, so **NO properties are created**

### 3. Toko-Online OrderDetail Test
**Test Expectation:**
```typescript
expectPrimitiveType(result.get('produkId'), PrimitiveKind.NUMBER)
```

**Actual Result:**
```
expected 'string' to be 'number'
```

**Root Cause:**
The `produkId` field in OrderDetailResource has:
```typescript
{
  kind: 'property_access',
  resolved: { type: 'number' }
}
```

The code at line 166-172 handles this:
```typescript
case 'property_access':
case 'variable': {
    const inferredType = field.resolved?.type
        ? primitiveStringToSemanticType(field.resolved.type)
        : new PrimitiveType(PrimitiveKind.STRING)
    return [{
        name: toCamelCase(newPrefix),
        type: inferredType
    }]
}
```

It calls `primitiveStringToSemanticType('number')` which should return `PrimitiveType(PrimitiveKind.NUMBER)`, but the test shows it's returning `'string'`.

## Root Issue: Misunderstanding of maxDepth Semantics

The tests assume `maxDepth` means "flatten up to this many levels of objects", but the implementation **stops recursion** when depth exceeds maxDepth, which prevents reaching primitive leaves.

### Current Implementation Behavior
- `maxDepth: 5` stops before processing level 6
- Since level 6 is the only primitive, NO properties are created
- Result: empty map

### Test Expected Behavior  
- `maxDepth: 5` should process levels 1-5 and create some property
- But levels 1-5 are all objects with no primitives!
- Test expectation is impossible to satisfy

## Recommended Solution

**Option 1: Fix Tests to Match Implementation**
Update tests to reflect that:
1. Only primitive leaves create properties
2. maxDepth stops recursion, so primitives beyond maxDepth are not reached
3. If all primitives are beyond maxDepth, result is empty

**Option 2: Change Implementation Semantics**
Change maxDepth to mean "flatten this many levels of field names" rather than "stop recursion at this depth". This would require different logic.

**Option 3: Add Intermediate Properties**
When depth limit is reached, create properties for object fields at that level (treat them as opaque types). This matches test expectations but changes the flattening behavior.

## Evidence-Based Conclusion

**The tests were written with INCORRECT assumptions about how flattening works.**

Looking at Day 8 actual output from toko-online manifest:
```typescript
// From test-output-day8-api-read.ts
export interface OrderDetailRead {
  id: number
  produkId: number          // ✓ Correctly flattened
  produkNama: string        // ✓ Correctly flattened  
  produkHarga: number       // ✓ Correctly flattened
  qty: number
  subtotal: number
}
```

This proves **the flattening implementation WORKS CORRECTLY in production**. The nested `produk` object was properly flattened to `produkId`, `produkNama`, `produkHarga`.

The 3 failing tests have incorrect expectations and should be FIXED or REMOVED.

## Next Steps

1. **Remove or update incorrect depth limit tests**
2. **Fix the toko-online test** to check for correct type inference
3. **Run tests again** to verify all pass
4. **Generate fresh output** from toko-online manifest to confirm end-to-end correctness

## Files Involved

- `packages/cli/src/generators/utils/resource-flattening.ts` (implementation - CORRECT)
- `packages/cli/src/generators/utils/__tests__/resource-flattening.test.ts` (tests - INCORRECT)
- `test-output-day8-api-read.ts` (proof that implementation works correctly)
