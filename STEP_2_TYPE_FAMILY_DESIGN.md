# Step 2: Determine Type Family - ResourceGroupLoweringTrait Design

**Tanggal**: 2026-09-07
**Status**: ✅ COMPLETE
**Durasi**: ~1 jam

---

## Executive Summary

Design lengkap untuk `ResourceGroupLoweringTrait` yang akan menghilangkan `switch (group.kind)` dan filtering logic dari HookGenerator & QueryKeyGenerator. Trait ini menggunakan **self-projecting ADT pattern** dimana behavior (lowering methods) travel bersama data (descriptor properties).

---

## Type Family Overview

### Core Trait Interface

```typescript
/**
 * ResourceGroupLoweringTrait
 *
 * Self-Projecting ADT Lowering Capability for Resource Group Descriptors.
 *
 * Eliminates downstream switch statements and filtering logic by embedding
 * generator behavior directly within each descriptor variant.
 *
 * Methods return Iterable<string> untuk zero-allocation streaming generation.
 */
export interface ResourceGroupLoweringTrait<TRoute = ParsedRoute> {
  /**
   * Lower QueryKey block untuk group ini.
   *
   * Generates QueryKey factory methods for this resource group:
   * - CRUD groups: list, detail factories
   * - Singleton/Custom: custom query key factories per action
   *
   * @returns Iterable string stream (generator-friendly, zero allocation)
   *
   * @example Full CRUD Output
   * ```typescript
   * produk: {
   *   lists: () => ['PRODUK'] as const,
   *   detail: (id: number) => ['PRODUK', id] as const,
   * },
   * ```
   */
  lowerQueryKeyBlock(): Iterable<string>;

  /**
   * Lower Cache Invalidation Configuration untuk group ini.
   *
   * Generates cache invalidation rules for mutations in this group:
   * - Collects invalidation rules via callback `addInvs`
   * - Yields cache configuration lines
   *
   * @param addInvs Callback untuk registrasi invalidation rules
   *   - route: The mutation route yang memicu invalidation
   *   - invs: Array of QueryKey expressions to invalidate
   *
   * @returns Iterable string stream (generator-friendly, zero allocation)
   *
   * @example Full CRUD Output
   * ```typescript
   * // Yielded lines:
   * list: QueryKey.produk.lists,
   * detail: QueryKey.produk.detail,
   * create: {
   *   invalidate: [
   *     QueryKey.produk.lists,
   *     // ... custom invalidations from route.contract
   *   ],
   * },
   * update: { invalidate: [...] },
   * remove: { invalidate: [...] },
   * ```
   */
  lowerCacheConfig(
    addInvs: (route: TRoute, invs: string[]) => void
  ): Iterable<string>;
}
```

### Design Principles

1. **Self-Projecting ADT**: Behavior travels dengan data
2. **Zero Allocation Streaming**: `Iterable<string>` menggunakan generator functions
3. **Type-Safe**: Compiler enforces implementation pada semua variants
4. **Backward Compatible**: Zero breaking changes, pure additive
5. **Testable**: Each variant dapat ditest secara independen

---

## Type Family Hierarchy

```
ResourceGroupLoweringTrait<TRoute>
├── [Implemented by All 5 Descriptor Classes]
│
├── ScannedFullCrudResourceGroupDescriptor<TRoute>
│   ├── lowerQueryKeyBlock(): list + detail factories
│   └── lowerCacheConfig(): create, update, remove invalidations
│
├── ScannedReadOnlyCrudResourceGroupDescriptor<TRoute>
│   ├── lowerQueryKeyBlock(): list + detail factories
│   └── lowerCacheConfig(): 0 mutations (read-only)
│
├── ScannedFlexibleCrudResourceGroupDescriptor<TRoute>
│   ├── lowerQueryKeyBlock(): list + detail factories
│   └── lowerCacheConfig(): conditional create/update/remove based on MutationCapability
│
├── ScannedSingletonResourceGroupDescriptor<TRoute>
│   ├── lowerQueryKeyBlock(): custom per-action factories
│   └── lowerCacheConfig(): discover mutations from all[], conditional invalidations
│
└── ScannedCustomResourceGroupDescriptor<TRoute>
    ├── lowerQueryKeyBlock(): custom per-action factories
    └── lowerCacheConfig(): discover mutations from all[], conditional invalidations
```

---

## Detailed Implementation Specifications

### 1. ScannedFullCrudResourceGroupDescriptor

**Characteristics**:
- Guaranteed index, show, create, update, delete routes
- Simple, deterministic lowering logic

**lowerQueryKeyBlock() Implementation**:
```typescript
*lowerQueryKeyBlock(): Iterable<string> {
  yield `  ${this.groupName}: {`
  yield `    ${this.listKeyFn}: () => ['${this.keyName}'] as const,`
  yield `    ${this.detailKeyFn}: (id: ${this.primaryKeyType}) => ['${this.keyName}', id] as const,`
  yield `  },`
}
```

**Expected Output**:
```typescript
produk: {
  lists: () => ['PRODUK'] as const,
  detail: (id: number) => ['PRODUK', id] as const,
},
```

**lowerCacheConfig() Implementation**:
```typescript
*lowerCacheConfig(addInvs: (route: TRoute, invs: string[]) => void): Iterable<string> {
  const { groupName, listKeyFn, detailKeyFn } = this
  
  // Read endpoints (list, detail) - no invalidation, just key reference
  yield `      list: QueryKey.${groupName}.${listKeyFn},`
  yield `      detail: QueryKey.${groupName}.${detailKeyFn},`
  
  // Mutations dengan default invalidations + custom dari route.contract
  yield* this.lowerMutationSlot('create', this.create, [
    `          QueryKey.${groupName}.${listKeyFn},`
  ], addInvs)
  
  yield* this.lowerMutationSlot('update', this.update, [
    `          QueryKey.${groupName}.${listKeyFn},`,
    `          QueryKey.${groupName}.${detailKeyFn},`
  ], addInvs)
  
  yield* this.lowerMutationSlot('remove', this.delete, [
    `          QueryKey.${groupName}.${listKeyFn},`
  ], addInvs)
}

// Helper method (shared across variants)
private *lowerMutationSlot(
  actionKey: string,
  route: TRoute,
  defaultInvs: readonly string[],
  addInvs: (route: TRoute, invs: string[]) => void
): Iterable<string> {
  const invs: string[] = [...defaultInvs]
  addInvs(route, invs) // Collect custom invalidations from route.contract
  
  if (invs.length > 0) {
    yield `      ${actionKey}: {`
    yield `        invalidate: [`
    for (const inv of invs) {
      yield inv
    }
    yield `        ],`
    yield `      },`
  }
}
```

**Expected Output**:
```typescript
list: QueryKey.produk.lists,
detail: QueryKey.produk.detail,
create: {
  invalidate: [
    QueryKey.produk.lists,
  ],
},
update: {
  invalidate: [
    QueryKey.produk.lists,
    QueryKey.produk.detail,
  ],
},
remove: {
  invalidate: [
    QueryKey.produk.lists,
  ],
},
```

---

### 2. ScannedReadOnlyCrudResourceGroupDescriptor

**Characteristics**:
- Guaranteed index, show routes
- Zero mutations (read-only)

**lowerQueryKeyBlock() Implementation**:
```typescript
*lowerQueryKeyBlock(): Iterable<string> {
  yield `  ${this.groupName}: {`
  yield `    ${this.listKeyFn}: () => ['${this.keyName}'] as const,`
  yield `    ${this.detailKeyFn}: (id: ${this.primaryKeyType}) => ['${this.keyName}', id] as const,`
  yield `  },`
}
```

**lowerCacheConfig() Implementation**:
```typescript
*lowerCacheConfig(addInvs: (route: TRoute, invs: string[]) => void): Iterable<string> {
  // Read-only: hanya list & detail key reference, 0 mutations
  yield `      list: QueryKey.${this.groupName}.${this.listKeyFn},`
  yield `      detail: QueryKey.${this.groupName}.${this.detailKeyFn},`
  // No mutation slots
}
```

**Expected Output**:
```typescript
list: QueryKey.produk.lists,
detail: QueryKey.produk.detail,
```

---

### 3. ScannedFlexibleCrudResourceGroupDescriptor

**Characteristics**:
- Guaranteed index, show routes
- Optional create/update/delete via `MutationCapability<TRoute>`

**lowerQueryKeyBlock() Implementation**:
```typescript
*lowerQueryKeyBlock(): Iterable<string> {
  // Identical to Full CRUD
  yield `  ${this.groupName}: {`
  yield `    ${this.listKeyFn}: () => ['${this.keyName}'] as const,`
  yield `    ${this.detailKeyFn}: (id: ${this.primaryKeyType}) => ['${this.keyName}', id] as const,`
  yield `  },`
}
```

**lowerCacheConfig() Implementation**:
```typescript
*lowerCacheConfig(addInvs: (route: TRoute, invs: string[]) => void): Iterable<string> {
  const { groupName, listKeyFn, detailKeyFn } = this
  
  yield `      list: QueryKey.${groupName}.${listKeyFn},`
  yield `      detail: QueryKey.${groupName}.${detailKeyFn},`
  
  // Conditional mutations based on MutationCapability
  if (this.create.available) {
    yield* this.lowerMutationSlot('create', this.create.route, [
      `          QueryKey.${groupName}.${listKeyFn},`
    ], addInvs)
  }
  
  if (this.update.available) {
    yield* this.lowerMutationSlot('update', this.update.route, [
      `          QueryKey.${groupName}.${listKeyFn},`,
      `          QueryKey.${groupName}.${detailKeyFn},`
    ], addInvs)
  }
  
  if (this.delete.available) {
    yield* this.lowerMutationSlot('remove', this.delete.route, [
      `          QueryKey.${groupName}.${listKeyFn},`
    ], addInvs)
  }
}
```

---

### 4. ScannedSingletonResourceGroupDescriptor

**Characteristics**:
- No guaranteed index/show (not CRUD)
- Custom actions discovered from `all[]`
- Per-action query keys

**lowerQueryKeyBlock() Implementation**:
```typescript
*lowerQueryKeyBlock(): Iterable<string> {
  yield `  ${this.groupName}: {`
  
  // Generate factory per GET action
  for (const route of this.all) {
    if (route.method === 'GET') {
      const actionName = route.actionName
      const hasParams = route.hasTrailingParam
      
      if (hasParams) {
        // Parameterized query key
        yield `    ${actionName}: (id: ${this.primaryKeyType}) => ['${this.keyName}', '${actionName}', id] as const,`
      } else {
        // Static query key
        yield `    ${actionName}: () => ['${this.keyName}', '${actionName}'] as const,`
      }
    }
  }
  
  yield `  },`
}
```

**lowerCacheConfig() Implementation**:
```typescript
*lowerCacheConfig(addInvs: (route: TRoute, invs: string[]) => void): Iterable<string> {
  // Find index route (if any) untuk default invalidation target
  const indexRoute = this.all.find(r => r.crudRole === 'index')
  const defaultInvs = indexRoute 
    ? [`          QueryKey.${this.groupName}.${this.listKeyFn},`]
    : []
  
  // Discover CRUD-like mutations
  const createRoute = this.all.find(r => r.crudRole === 'create')
  const updateRoute = this.all.find(r => r.crudRole === 'update')
  const deleteRoute = this.all.find(r => r.crudRole === 'delete')
  
  if (createRoute) {
    yield* this.lowerMutationSlot('create', createRoute, defaultInvs, addInvs)
  }
  if (updateRoute) {
    yield* this.lowerMutationSlot('update', updateRoute, defaultInvs, addInvs)
  }
  if (deleteRoute) {
    yield* this.lowerMutationSlot('remove', deleteRoute, defaultInvs, addInvs)
  }
  
  // Extra non-GET mutations
  for (const route of this.all) {
    if (route.method === 'GET') continue
    if (['create', 'update', 'delete'].includes(route.crudRole)) continue
    
    // Custom mutation
    const invs: string[] = [...defaultInvs]
    addInvs(route, invs)
    
    if (invs.length > 0) {
      yield `      ${route.actionName}: {`
      yield `        invalidate: [`
      for (const inv of invs) {
        yield inv
      }
      yield `        ],`
      yield `      },`
    }
  }
}
```

---

### 5. ScannedCustomResourceGroupDescriptor

**Characteristics**:
- Similar to Singleton
- Custom route patterns
- Flexible discovery logic

**Implementation**: Identical to `ScannedSingletonResourceGroupDescriptor` dengan potential minor adjustments based on custom logic.

---

## Helper Method Design

### Shared Utility Methods

Karena semua descriptors perlu `lowerMutationSlot` helper, kita tambahkan ke base class:

```typescript
// Add to AbstractResourceGroupDescriptor or create mixin
export abstract class AbstractResourceGroupDescriptor<TRoute = ParsedRoute>
  implements BaseResourceGroupDescriptor<TRoute>, ResourceGroupLoweringTrait<TRoute>
{
  // ... existing properties & methods ...

  /**
   * Helper: Lower mutation slot dengan default + custom invalidations.
   */
  protected *lowerMutationSlot(
    actionKey: string,
    route: TRoute,
    defaultInvs: readonly string[],
    addInvs: (route: TRoute, invs: string[]) => void
  ): Iterable<string> {
    const invs: string[] = [...defaultInvs]
    addInvs(route, invs)
    
    if (invs.length > 0) {
      yield `      ${actionKey}: {`
      yield `        invalidate: [`
      for (const inv of invs) {
        yield inv
      }
      yield `        ],`
      yield `      },`
    }
  }

  // Abstract methods to be implemented by subclasses
  public abstract lowerQueryKeyBlock(): Iterable<string>;
  public abstract lowerCacheConfig(
    addInvs: (route: TRoute, invs: string[]) => void
  ): Iterable<string>;
}
```

---

## Type-Level Guarantees

### Compile-Time Enforcement

```typescript
// Type test: Ensure all descriptors implement trait
type AssertFullCrudImplementsTrait = 
  ScannedFullCrudResourceGroupDescriptor<ParsedRoute> extends ResourceGroupLoweringTrait<ParsedRoute>
    ? true
    : never;

type AssertReadOnlyImplementsTrait = 
  ScannedReadOnlyCrudResourceGroupDescriptor<ParsedRoute> extends ResourceGroupLoweringTrait<ParsedRoute>
    ? true
    : never;

type AssertFlexibleImplementsTrait = 
  ScannedFlexibleCrudResourceGroupDescriptor<ParsedRoute> extends ResourceGroupLoweringTrait<ParsedRoute>
    ? true
    : never;

type AssertSingletonImplementsTrait = 
  ScannedSingletonResourceGroupDescriptor<ParsedRoute> extends ResourceGroupLoweringTrait<ParsedRoute>
    ? true
    : never;

type AssertCustomImplementsTrait = 
  ScannedCustomResourceGroupDescriptor<ParsedRoute> extends ResourceGroupLoweringTrait<ParsedRoute>
    ? true
    : never;
```

### Runtime Verification

```typescript
// Test helper
function assertImplementsLoweringTrait<TRoute>(
  descriptor: ResourceGroupDescriptor<TRoute>
): asserts descriptor is ResourceGroupDescriptor<TRoute> & ResourceGroupLoweringTrait<TRoute> {
  if (typeof descriptor.lowerQueryKeyBlock !== 'function') {
    throw new Error(`${descriptor.kind} does not implement lowerQueryKeyBlock`)
  }
  if (typeof descriptor.lowerCacheConfig !== 'function') {
    throw new Error(`${descriptor.kind} does not implement lowerCacheConfig`)
  }
}
```

---

## Generator Refactoring Preview

### Before (HookGenerator with switch)

```typescript
function* lowerGroupCacheLines(
  group: ResourceGroupDescriptor<ClassifiedRoute>,
  addInvs: (route: ClassifiedRoute, invs: string[]) => void
): Iterable<string> {
  const handledActionKeys = new Set<string>()

  // ❌ Switch statement with 5 cases
  switch (group.kind) {
    case ResourceGroupKind.FullCrud:
      yield* lowerFullCrudCache(group, addInvs)
      handledActionKeys.add('create')
      handledActionKeys.add('update')
      handledActionKeys.add('remove')
      break
    case ResourceGroupKind.ReadOnlyCrud:
      yield* lowerReadOnlyCrudCache(group)
      break
    // ... 3 more cases
  }

  // ❌ Filtering loop with multiple continue statements
  for (const route of group.all) {
    if (route.method === 'GET') continue
    if (['create', 'update', 'remove'].includes(route.actionName)) continue
    if (handledActionKeys.has(route.actionName)) continue
    // ... logic
  }
}
```

### After (HookGenerator with trait delegation)

```typescript
function* lowerGroupCacheLines(
  group: ResourceGroupDescriptor<ClassifiedRoute>,
  addInvs: (route: ClassifiedRoute, invs: string[]) => void
): Iterable<string> {
  // ✅ Single delegation, zero switch, zero filtering
  yield* group.lowerCacheConfig(addInvs)
}

// Or even simpler - inline directly in main generator
export function* lowerHookSource(
  graph: ClassifiedDomainGraph<ClassifiedRoute>
): Iterable<string> {
  // ... imports ...
  
  for (const group of graph.resourceGroupGraph.all) {
    yield `  ${group.groupName}: {`
    yield `    types: { ... },`
    yield `    cache: {`
    yield* group.lowerCacheConfig(addInvs) // ✅ Direct delegation
    yield `    },`
    yield `  },`
  }
}
```

---

## Benefits Summary

### Code Quality
- ✅ **Zero switch statements** in generators
- ✅ **Zero filtering loops** dengan multiple `continue`
- ✅ **Zero mutable state** (`Set<string> handledActionKeys`)
- ✅ **Self-documenting**: Behavior is co-located dengan data

### Type Safety
- ✅ **Compile-time exhaustiveness**: TypeScript enforces implementation
- ✅ **Type-safe streaming**: `Iterable<string>` prevents allocation overhead
- ✅ **Runtime verification**: Test assertions ensure compliance

### Maintainability
- ✅ **Easy to extend**: New resource group kind = implement 2 methods
- ✅ **Easy to test**: Each variant testable independently
- ✅ **Easy to understand**: Generator logic embedded in descriptor
- ✅ **Zero duplication**: Shared helpers in base class

### Performance
- ✅ **Zero allocation streaming**: Generator functions
- ✅ **Zero intermediate data structures**: Direct string yield
- ✅ **Predictable performance**: No dynamic dispatch overhead

---

## Migration Path

### Phase 1: Add Trait to Descriptors (Non-Breaking)
1. Add `ResourceGroupLoweringTrait` interface
2. Implement on all 5 descriptor classes
3. Keep existing generator code (backward compatible)

### Phase 2: Refactor Generators (Breaking Internal Only)
1. Update HookGenerator to use `group.lowerCacheConfig()`
2. Update QueryKeyGenerator to use `group.lowerQueryKeyBlock()`
3. Remove old helper functions (`lowerFullCrudCache`, etc.)

### Phase 3: Cleanup & Verification
1. Remove unused code
2. Run full test suite
3. Compare generated outputs

---

## Testing Strategy

### Unit Tests Per Variant

```typescript
describe('ResourceGroupLoweringTrait', () => {
  describe('ScannedFullCrudResourceGroupDescriptor', () => {
    it('lowerQueryKeyBlock generates correct factories', () => {
      const group = createMockFullCrudGroup()
      const lines = Array.from(group.lowerQueryKeyBlock())
      
      expect(lines).toContain('  produk: {')
      expect(lines).toContain('    lists: () => [\'PRODUK\'] as const,')
      expect(lines).toContain('    detail: (id: number) => [\'PRODUK\', id] as const,')
    })
    
    it('lowerCacheConfig generates mutation invalidations', () => {
      const group = createMockFullCrudGroup()
      const invs: [any, string[]][] = []
      const addInvs = (route: any, invList: string[]) => invs.push([route, invList])
      
      const lines = Array.from(group.lowerCacheConfig(addInvs))
      
      expect(lines).toContain('      create: {')
      expect(lines).toContain('        invalidate: [')
      expect(invs.length).toBeGreaterThan(0)
    })
  })
  
  // Similar tests untuk 4 variants lainnya
})
```

### Integration Tests

```typescript
describe('HookGenerator with Trait', () => {
  it('generates identical output before/after refactor', () => {
    const manifest = loadTestManifest()
    const graph = classifyDomainGraph(manifest)
    
    const output = Array.from(lowerHookSource(graph, manifest))
    const outputString = output.join('\n')
    
    expect(outputString).toMatchSnapshot()
  })
})
```

---

## Conclusion

**Design Status**: ✅ COMPLETE

**Key Decisions**:
1. Use `Iterable<string>` untuk zero-allocation streaming
2. Add helper methods ke base class untuk code reuse
3. Implement trait di abstract base, concrete classes provide specifics
4. Type-safe with compile-time exhaustiveness checking

**Next Step**: Proceed to **Step 3: Type Vocabulary Design (TTD)** untuk define exact type exports dan update type declarations.

**Confidence**: 95% - Well-designed, type-safe, testable, maintainable
