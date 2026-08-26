# Nested Inline Response Objects Fix

## Issue

The test "should handle nested inline response objects" was failing because nested objects in inline responses were not being processed correctly. When accessing `userFields.properties` (which is an `ImmutableMap`), the test was using `toHaveProperty()` which doesn't work with `ImmutableMap`.

## Root Cause

1. **Incorrect test assertion**: The test was using `toHaveProperty()` on an `ImmutableMap`, which doesn't have traditional JavaScript object properties
2. **Missing import**: `PrimitiveKind` was not imported in the test file

## Fix Applied

### 1. Updated `manifest-to-types.ts` (Line ~957)

Changed the `case 'object':` handler to properly process nested fields recursively:

```typescript
case 'object': {
    // Nested object — pertahankan sebagai ObjectType (TANPA flattening)
    // Recursively process nested fields
    const nestedProps = new Map<string, SemanticType>()

    for (const [nestedFieldName, nestedFieldDef] of Object.entries(field.fields || {})) {
        const nestedType = mapResourceFieldToNestedType(
            nestedFieldName,
            nestedFieldDef,
            allResources,
            seen
        )
        if (nestedType) {
            nestedProps.set(nestedFieldName, nestedType)
        }
    }

    return new ObjectType(
        new ImmutableMap(nestedProps),
        new ImmutableSet(new Set(nestedProps.keys())),
        undefined, // no base
        [], // no interfaces
        new ImmutableMap(new Map<string, string>([
            ['name', fieldName],
            ['kind', 'object']
        ]))
    )
}
```

**Key change**: Instead of calling `resourceFieldsToNestedTypes()` which expects a full `ParsedResource` structure, we now directly iterate over the nested fields and recursively call `mapResourceFieldToNestedType()` for each one.

### 2. Updated Test File

#### Added import:
```typescript
import { PrimitiveKind } from '../../../../../core/src/compiler/types/SemanticType';
```

#### Fixed assertions to work with ImmutableMap:
```typescript
// Before (incorrect):
const userFields = (fields?.user as ObjectType).properties
expect(userFields).toHaveProperty('id')
expect(userFields).toHaveProperty('name')

// After (correct):
const userObj = fields?.user as ObjectType
expect(userObj.properties.get('id')).toBeDefined()
expect(userObj.properties.get('name')).toBeDefined()

// Verify types of nested fields
expect(userObj.properties.get('id')).toBeInstanceOf(PrimitiveType)
expect(userObj.properties.get('name')).toBeInstanceOf(PrimitiveType)

const idField = userObj.properties.get('id') as PrimitiveType
const nameField = userObj.properties.get('name') as PrimitiveType
expect(idField.type).toBe(PrimitiveKind.NUMBER)
expect(nameField.type).toBe(PrimitiveKind.STRING)
```

## Test Results

All 8 tests in `manifest-to-types.test.ts` now pass:

```
✓ packages/cli/src/generators/utils/__tests__/manifest-to-types.test.ts (8 tests)
  ✓ manifestToContractInput (Opsi D: resolve resource reference)
    ✓ resolves resource-typed field to ReadonlyCollectionType of the target resource
    ✓ resolves single (non-collection) resource field to ObjectType
  ✓ manifestToContractInput (bentuk original: snake_case + nested)
    ✓ preserves snake_case field names (no camelCase transformation)
    ✓ keeps nested object as ObjectType with original child names (no flattening)
  ✓ manifestToContractInput - inline responses
    ✓ should extract inline response fields
    ✓ should generate correct synthetic names
    ✓ should handle nested inline response objects  ← FIXED
    ✓ should handle primitive fields in inline response

Test Files  1 passed (1)
Tests       8 passed (8)
Duration    348ms
```

## What This Enables

With this fix, RouteSync can now correctly handle inline response objects with nested structure, such as:

```typescript
response: {
    kind: 'object',
    fields: {
        token: { kind: 'primitive', type: 'string' },
        user: {
            kind: 'object',
            fields: {
                id: { kind: 'primitive', type: 'number' },
                name: { kind: 'primitive', type: 'string' }
            }
        }
    }
}
```

This will correctly generate a nested `ObjectType` structure where `user` is an `ObjectType` containing `id` and `name` properties.

## Files Modified

1. `/home/annas-zen/Documents/RouteSync/packages/cli/src/generators/utils/manifest-to-types.ts`
   - Fixed `case 'object':` handler in `mapResourceFieldToNestedType()` function

2. `/home/annas-zen/Documents/RouteSync/packages/cli/src/generators/utils/__tests__/manifest-to-types.test.ts`
   - Added `PrimitiveKind` import
   - Fixed test assertions to use `.get()` method for `ImmutableMap` access
   - Added comprehensive type checking for nested fields

## Status

✅ **COMPLETE** - All tests passing, nested inline response objects are now fully supported.
