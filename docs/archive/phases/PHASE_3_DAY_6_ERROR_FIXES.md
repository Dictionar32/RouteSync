# Phase 3 Day 6: Error Fixes

## Error Summary
Total 11 compilation errors yang perlu diperbaiki:

### Batch 1 Errors (GeneratedTypeScriptArtifact.ts):
1. ❌ metadata property incompatible dengan CompilerArtifact

### Batch 2 Errors (TypeScriptGeneratorPass.ts):
2. ❌ PassDescriptor tidak punya property 'name'
3. ❌ PassDependency 'artifactKey' → harus 'artifact'
4. ❌ ImmutableMap tidak punya property 'size'
5. ❌ ObjectType tidak punya property 'base'
6. ❌ TypeScriptGenerator tidak punya method 'emitToString'
7. ❌ TypeScriptGenerator property 'imports' private
8. ❌ Array.from typing issue
9. ❌ Duplicate 'metadata' property
10. ❌ metadata.hash tidak ada di GeneratedCodeMetadata
11. ❌ ObjectType tidak punya property 'name'

### TypeScriptGenerator.ts Error:
12. ❌ Property 'imports' tidak exist

---

## Fix 1: GeneratedTypeScriptArtifact.ts (COMPLETE REPLACEMENT)

**File**: `packages/core/src/compiler/artifacts/GeneratedTypeScriptArtifact.ts`

```typescript
/**
 * Generated TypeScript Artifact
 * 
 * Represents TypeScript code generated from semantic types.
 * Output of TypeScriptGeneratorPass.
 * 
 * @module compiler/artifacts
 */

import type { CompilerArtifact } from './Artifact';

/**
 * Import statement dalam generated code
 */
export interface GeneratedImport {
    /** Module yang di-import (e.g., './types') */
    readonly from: string;
    
    /** Named imports (e.g., ['User', 'Product']) */
    readonly names: readonly string[];
    
    /** Type-only import flag */
    readonly typeOnly: boolean;
}

/**
 * Interface declaration dalam generated code
 */
export interface GeneratedInterface {
    /** Interface name (e.g., 'User') */
    readonly name: string;
    
    /** Jumlah properties */
    readonly propertyCount: number;
    
    /** Extends clause jika ada */
    readonly extends?: readonly string[];
    
    /** Source line range dalam generated code */
    readonly lineRange: readonly [number, number];
}

/**
 * Extended metadata untuk generation-specific info
 */
export interface GenerationMetadata {
    /** Generator version */
    readonly generatorVersion: string;
    
    /** Jumlah types yang di-generate */
    readonly typeCount: number;
    
    /** Jumlah interfaces yang di-generate */
    readonly interfaceCount: number;
    
    /** Jumlah imports */
    readonly importCount: number;
    
    /** Total lines of code */
    readonly linesOfCode: number;
    
    /** Warnings during generation */
    readonly warnings: readonly string[];
}

/**
 * Generated TypeScript artifact
 * 
 * Artifact ini berisi complete generated TypeScript code dengan metadata.
 * Extends CompilerArtifact untuk compatibility dengan pipeline.
 */
export interface GeneratedTypeScriptArtifact extends CompilerArtifact {
    /** Generated TypeScript source code */
    readonly code: string;
    
    /** Import statements yang di-generate */
    readonly imports: readonly GeneratedImport[];
    
    /** Interface declarations yang di-generate */
    readonly interfaces: readonly GeneratedInterface[];
    
    /** Extended metadata with generation-specific info */
    readonly generationMetadata: GenerationMetadata;
    
    /** Source map jika available */
    readonly sourceMap?: string;
}

/**
 * Type guard untuk GeneratedTypeScriptArtifact
 */
export function isGeneratedTypeScriptArtifact(
    artifact: unknown
): artifact is GeneratedTypeScriptArtifact {
    if (typeof artifact !== 'object' || artifact === null) {
        return false;
    }
    
    const a = artifact as Partial<GeneratedTypeScriptArtifact>;
    
    return (
        typeof a.code === 'string' &&
        Array.isArray(a.imports) &&
        Array.isArray(a.interfaces) &&
        typeof a.generationMetadata === 'object' &&
        a.generationMetadata !== null &&
        typeof a.metadata === 'object' &&
        a.metadata !== null
    );
}
```

---

## Fix 2: TypeScriptGenerator.ts (ADD getImports method)

**File**: `packages/core/src/compiler/generators/typescript/TypeScriptGenerator.ts`

**Add this method after line 1004 (before closing class bracket)**:

```typescript
    /**
     * Get collected imports (for TypeScriptGeneratorPass)
     * 
     * Returns readonly view of imports map untuk artifact creation
     */
    public getImports(): ReadonlyMap<string, ReadonlySet<string>> {
        return this.imports;
    }
```

---

## Fix 3: Update artifacts/types.ts

**File**: `packages/core/src/compiler/artifacts/types.ts`

**Line 26: Add import**:
```typescript
import type { GeneratedTypeScriptArtifact } from './GeneratedTypeScriptArtifact';
```

**Line 57-58: Add to registry**:
```typescript
    // TypeScript Generation Artifact
    GeneratedTypeScript: GeneratedTypeScriptArtifact;
```

---

## Fix 4: TypeScriptGeneratorPass.ts (COMPLETE REPLACEMENT with all fixes)

**File**: `packages/core/src/compiler/passes/TypeScriptGeneratorPass.ts`

See PHASE_3_DAY_6_BATCH_2_FIXED.md for complete fixed version.

---

## Changes Summary

### GeneratedTypeScriptArtifact.ts:
- ✅ Changed `metadata` → `generationMetadata` to avoid conflict
- ✅ Removed `GeneratedCodeMetadata` interface (inline type)
- ✅ Proper CompilerArtifact extension

### TypeScriptGenerator.ts:
- ✅ Added `getImports()` public method

### artifacts/types.ts:
- ✅ Added GeneratedTypeScriptArtifact import
- ✅ Added GeneratedTypeScript to registry

### TypeScriptGeneratorPass.ts (akan dibuat fixed version):
- ✅ Removed 'name' from descriptor
- ✅ Fixed 'artifactKey' → 'artifact'
- ✅ Fixed ImmutableMap.size → count entries manually
- ✅ Fixed ObjectType.base → check SemanticType.kind
- ✅ Fixed emitToString → use generator.generateInterfaces()
- ✅ Fixed imports access → use getImports()
- ✅ Fixed Array.from typing
- ✅ Removed duplicate metadata
- ✅ Fixed metadata.hash usage
- ✅ Fixed ObjectType.name → get from type directly

---

## Implementation Order

1. **Replace GeneratedTypeScriptArtifact.ts** (paste Fix 1)
2. **Update TypeScriptGenerator.ts** (add getImports method from Fix 2)
3. **Update artifacts/types.ts** (add import + registry from Fix 3)
4. **Replace TypeScriptGeneratorPass.ts** (paste fixed version from BATCH_2_FIXED)
5. **Compile check**: `cd packages/core && npx tsc --noEmit`

---

**Status**: Fixes ready to apply
**Next**: Create PHASE_3_DAY_6_BATCH_2_FIXED.md with complete fixed TypeScriptGeneratorPass
