# Phase 3 Day 3: Error Fix Plan

## Error Categories dan Solutions

### 1. CollectionKind String Literals (30 errors)

**Pattern**: `'array'` → `CollectionKind.ARRAY`

**Files to Fix**:
- `TypeScriptGenerator.test.ts`: ~30 occurrences

**Batch Fix Script**:
```bash
# Dalam test file, replace:
'array' → CollectionKind.ARRAY
'collection' → CollectionKind.COLLECTION  
'nullable' → CollectionKind.NULLABLE
```

### 2. Type Return Signature Issues (3 errors)

**Line 187** - TSPropertySignature type parameter:
```typescript
// Current
new TSPropertySignature(name, tsType, optional, readonly, comment)
// tsType is: TSTypeReference | TSArrayType | TSUnionType | TSIntersectionType

// Solution: TSPropertySignature should accept union type
// Update TSPropertySignature.ts constructor
```

**Line 393, 437** - convertCollectionType return type:
```typescript
// These are in match arms, should be fine once we check actual code
```

### 3. ImmutableMap API (1 error)

**Line 546**:
```typescript
// Current
const propertyCount = type.properties.size;  // ❌

// Fix: Check ImmutableMap API
const propertyCount = type.properties.getSize();  // or
const propertyCount = Array.from(type.properties.entries()).length;
```

### 4. Test Map Construction (1 error)

**Line 1016**:
```typescript
// Need proper typing for Map entries
```

## Fix Order

1. ✅ Check ImmutableMap API
2. ✅ Fix ImmutableMap.size usage
3. ✅ Check TSPropertySignature signature
4. ✅ Batch fix CollectionKind usage
5. ✅ Fix test Map construction
6. ✅ Run tests
7. ✅ Verify all pass

