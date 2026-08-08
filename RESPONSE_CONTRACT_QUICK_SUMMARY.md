# Response Contract Generation - Quick Summary

**Status**: ✅ Plan Ready  
**Architecture**: SOC + SOT + Small Components  
**Timeline**: 2-3 weeks

---

## 🎯 What We're Building

Generate **RESPONSE validation schemas** dengan struktur **NESTED**:

```typescript
// REQUEST (sudah ada - FLAT)
export const checkoutContractSchema = {
  create: z.object({
    shipping_nama: z.string(),    // ← FLAT
    shipping_telepon: z.string()
  })
};

// RESPONSE (NEW - NESTED)
export const checkoutResponseSchema = z.object({
  id: z.number(),
  shipping: z.object({            // ← NESTED
    nama: z.string().nullable(),
    telepon: z.string().nullable()
  }).nullable().optional(),
  items: z.array(z.object({       // ← ARRAY of objects
    produk_item_id: z.number()
  }))
});

export const checkoutIndexSchema = z.array(checkoutResponseSchema);
```

---

## 📦 New Components (6 Small Classes)

### 1. ResponseFieldParser (~100 lines)
**Purpose**: Parse SATU field dari response  
**Input**: `{ kind: 'primitive', type: 'string' }`  
**Output**: `{ name: 'nama', kind: 'primitive', type: 'string', nullable: false }`

### 2. ResponseStructureBuilder (~120 lines)
**Purpose**: Build complete tree structure  
**Deps**: ResponseFieldParser  
**Output**: Complete parsed structure

### 3. NestedObjectSchemaBuilder (~150 lines)
**Purpose**: Build `z.object({ ... })` recursive  
**Deps**: PrimitiveTypeRegistry, ZodModifierBuilder  
**Output**: `"z.object({ nama: z.string() })"`

### 4. ArraySchemaBuilder (~100 lines)
**Purpose**: Build `z.array(...)`  
**Deps**: NestedObjectSchemaBuilder  
**Output**: `"z.array(z.object({ ... }))"`

### 5. ResponseSchemaMapper (~130 lines)
**Purpose**: Map complete response to Zod  
**Deps**: All builders above  
**Output**: Complete Zod schema code

### 6. ResponseActionGenerator (~100 lines)
**Purpose**: Generate per-resource schemas  
**Deps**: ResponseSchemaMapper  
**Output**: List of actions with schemas

---

## 🔄 Updated Components (2 Classes)

### 1. ContractCodeBuilder (add ~50 lines)
- Add `buildResponseSchemas()` method
- Update `buildCompleteContract()` to include response

### 2. ContractGeneratorPass (add ~80 lines)
- Add `generateResponseContracts()` method
- Integrate with existing request generation

---

## 📊 Component Sizes

| Component | Lines | Tests | Deps |
|-----------|-------|-------|------|
| ResponseFieldParser | ~100 | 15-20 | 0 |
| ResponseStructureBuilder | ~120 | 15-20 | 1 |
| NestedObjectSchemaBuilder | ~150 | 20-25 | 2 |
| ArraySchemaBuilder | ~100 | 15-20 | 1 |
| ResponseSchemaMapper | ~130 | 20-25 | 4 |
| ResponseActionGenerator | ~100 | 15-20 | 1 |
| **Total NEW** | **~700** | **~120** | - |
| ContractCodeBuilder (update) | +50 | +15 | - |
| ContractGeneratorPass (update) | +80 | +20 | - |
| **Grand Total** | **~830** | **~155** | - |

**Average per component**: ~138 lines ✅ (target: < 200)

---

## 🏗️ Dependency Graph

```
ResponseFieldParser (leaf, no deps)
         ↓
ResponseStructureBuilder
         ↓
         ├─→ NestedObjectSchemaBuilder
         │   ├─→ PrimitiveTypeRegistry (existing)
         │   └─→ ZodModifierBuilder (existing)
         ↓
ArraySchemaBuilder
         ↓
ResponseSchemaMapper
         ↓
ResponseActionGenerator
         ↓
ContractCodeBuilder (combines request + response)
         ↓
ContractGeneratorPass (orchestrator)
```

**Max Depth**: 4 levels ✅  
**No Circular Deps**: ✅

---

## 📅 Implementation Timeline

### Week 1: Foundation + Builders
- **Day 1-2**: ResponseFieldParser + ResponseStructureBuilder
- **Day 3-4**: NestedObjectSchemaBuilder
- **Day 5**: ArraySchemaBuilder

### Week 2: Integration
- **Day 1-2**: ResponseSchemaMapper
- **Day 3**: ResponseActionGenerator
- **Day 4-5**: Update ContractCodeBuilder + ContractGeneratorPass

### Week 3: Testing & Polish
- **Day 1-2**: Update CompilerBridge + CLI
- **Day 3-4**: E2E testing + bug fixes
- **Day 5**: Documentation + release

**Total**: 15 working days (~3 weeks)

---

## ✅ Quality Gates

### Per Component
- [ ] < 200 lines of code
- [ ] Single responsibility
- [ ] Dependency injection
- [ ] 15+ tests
- [ ] 90%+ coverage

### Per Step
- [ ] All tests passing
- [ ] TypeScript compiles
- [ ] No circular deps
- [ ] Documentation complete

### Final Release
- [ ] ~155 new tests passing
- [ ] Real manifest tested
- [ ] Generated code compiles
- [ ] Performance acceptable
- [ ] Documentation complete

---

## 🎯 Success Criteria

### Must Have
- ✅ Parse nested response structures
- ✅ Generate `z.object()` recursive
- ✅ Generate `z.array()` schemas
- ✅ Handle nullable/optional
- ✅ Combine with request schemas
- ✅ Valid TypeScript output

### Nice to Have
- ⭐ Support unions
- ⭐ Custom validation rules
- ⭐ Performance optimization
- ⭐ Advanced type inference

---

## 📝 Next Actions

### Immediate (Hari ini)
1. ✅ Review plan dengan user
2. ✅ Confirm scope dan timeline
3. ✅ Get approval untuk start

### Day 1 (Besok)
1. Create ResponseFieldParser.ts
2. Write 15-20 tests
3. Implement parsing logic
4. Verify tests pass

### Day 2
1. Create ResponseStructureBuilder.ts
2. Write 15-20 tests
3. Implement structure building
4. Integration test with parser

---

## 🚀 Ready to Start?

Plan sudah complete dengan:
- ✅ **SOC**: Each component single responsibility
- ✅ **SOT**: Response fields from manifest is source
- ✅ **Small Components**: Average ~138 lines
- ✅ **Reusable**: Clear interfaces, dependency injection
- ✅ **Testable**: ~155 tests planned
- ✅ **Maintainable**: Clear boundaries, no circular deps

**Decision**: Mulai implementasi? 🚀


---

## ⚡ IMPLEMENTATION PROGRESS

**Updated:** 2026-08-08  
**Status:** Step 4 COMPLETE ✅

### Completed Steps (4/6)

| Step | Component | Tests | Lines | Status |
|------|-----------|-------|-------|--------|
| 1 | ResponseFieldParser | 22 | ~150 | ✅ PASS |
| 2 | ResponseStructureBuilder | 16 | ~120 | ✅ PASS |
| 3 | NestedObjectSchemaBuilder | 17 | ~130 | ✅ PASS |
| 4 | ArraySchemaBuilder | 15 | ~110 | ✅ PASS |
| 5 | ContractSchemaMapper | TBD | ~150 | 📋 NEXT |
| 6 | Integration & E2E | TBD | ~100 | 📋 Pending |

**Total Tests Passing:** 70 ✅  
**Total Production Code:** ~600 lines  
**Progress:** 67% complete 🚀

### Latest Achievement (Step 4)
✅ **ArraySchemaBuilder** - 15 tests passing
- Array of primitives (string, number, boolean)
- Array of objects (simple, nested, empty)
- Nested arrays (2D, 3D, recursive)
- Nullable/optional arrays
- E-commerce scenarios (product variants, order items)

**Key Innovation:** Enhanced NestedObjectSchemaBuilder with `inline` parameter for compact array formatting

### Next Up: Step 5
**ContractSchemaMapper** (~150 lines, 20 tests)
- Map complete route to contract schema
- Handle request + response schemas
- Integrate all builders
- Generate final `defineApi()` contract

**Estimate:** 2-3 hours implementation + testing
