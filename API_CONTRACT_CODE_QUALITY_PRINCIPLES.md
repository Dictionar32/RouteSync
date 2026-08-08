# API Contract Implementation - Code Quality Principles

**Tanggal:** 2026-08-07  
**Status:** ✅ ADDED TO PROMPT  
**Purpose:** Ensure maintainable, reusable, well-structured code

---

## 🎯 User Requirements (Summary)

User meminta penambahan prinsip-prinsip code quality ke implementation prompt:

1. **Mudah dimaintain di masa depan** - Code harus sustainable long-term
2. **Kurangi duplikasi** - DRY (Don't Repeat Yourself) principle
3. **Class kecil-kecil reusable** - Small, focused, composable components
4. **Bisa di-wire ke class besar** - Dependency injection pattern
5. **Jangan buat class besar tanpa building blocks** - No god classes
6. **Utamakan SoC** - Separation of Concerns
7. **Utamakan SoT** - Single Source of Truth

---

## 📋 Principles Added

### 1. Small Classes Principle

**Rule:** Setiap class < 200 lines, single purpose

**Bad Example:**
```typescript
// ❌ God class 1000+ lines
class ContractGenerator {
  // Everything in one place
}
```

**Good Example:**
```typescript
// ✅ Small focused classes
class PrimitiveMapper { } // 30 lines
class ArrayMapper { }     // 40 lines
class ObjectMapper { }    // 60 lines
class UnionMapper { }     // 40 lines

// Composed into orchestrator
class TypeMapper {        // 50 lines
  constructor(
    primitive: PrimitiveMapper,
    array: ArrayMapper,
    object: ObjectMapper,
    union: UnionMapper
  ) {}
}
```

### 2. Dependency Injection Pattern

**Rule:** Dependencies injected, not hard-coded

**Bad Example:**
```typescript
// ❌ Cannot test, cannot swap
class Builder {
  build() {
    const mapper = new TypeMapper() // Hard-coded
  }
}
```

**Good Example:**
```typescript
// ✅ Testable, flexible
class Builder {
  constructor(
    private mapper: ITypeMapper, // Injected
    private generator: IGenerator,
    private formatter: IFormatter
  ) {}
}
```

### 3. Separation of Concerns (SoC)

**Rule:** One concern per class

**Bad Example:**
```typescript
// ❌ Multiple concerns
class Generator {
  mapType() { }      // Concern 1
  generateCode() { } // Concern 2
  formatCode() { }   // Concern 3
  writeFile() { }    // Concern 4
}
```

**Good Example:**
```typescript
// ✅ One concern each
class TypeMapper { }      // Mapping only
class CodeGenerator { }   // Generation only
class CodeFormatter { }   // Formatting only
class FileWriter { }      // I/O only

// Orchestrator (thin)
class Orchestrator {
  constructor(mapper, generator, formatter, writer) {}
}
```

### 4. Single Source of Truth (SoT)

**Rule:** Each logic exists in ONE place only

**Bad Example:**
```typescript
// ❌ Duplicate logic
class MapperA {
  if (type === 'string') return z.string()
}
class MapperB {
  if (type === 'string') return z.string() // DUPLICATE
}
class MapperC {
  if (type === 'string') return z.string() // DUPLICATE
}
```

**Good Example:**
```typescript
// ✅ Single registry
class PrimitiveTypeRegistry {
  static MAPPINGS = {
    string: () => z.string()
  }
  static get(kind) {
    return this.MAPPINGS[kind]()
  }
}

// All mappers use registry
class MapperA {
  map(type) {
    return PrimitiveTypeRegistry.get(type.kind)
  }
}
```

### 5. Reusable Utilities

**Rule:** Extract common patterns to utilities

```typescript
// ✅ Shared utility
class ZodModifierBuilder {
  static addNullable(schema) { }
  static addOptional(schema) { }
  static addValidation(schema, rules) { }
}

// Used everywhere
class ObjectMapper {
  map(obj) {
    let schema = z.object({})
    if (obj.nullable) {
      schema = ZodModifierBuilder.addNullable(schema)
    }
    return schema
  }
}
```

### 6. Factory Pattern

**Rule:** Complex creation via factory

```typescript
// ✅ Factory handles complexity
class MapperFactory {
  static createTypeMapper() {
    const primitive = new PrimitiveMapper()
    const typeMapper = new TypeMapper(primitive, ...)
    // Handle circular dependencies
    return typeMapper
  }
}
```

### 7. Test-Driven Design

**Rule:** Design for testability

```typescript
// ✅ Pure function, easy to test
class TypeMapper {
  map(type: SemanticType): ZodSchema {
    // No side effects
    // Deterministic
    // Mockable dependencies
  }
}
```

---

## 🚨 Anti-Patterns (Red Flags)

### Red Flag 1: Class > 200 lines
**Problem:** Too large, too many responsibilities  
**Fix:** Split into smaller classes

### Red Flag 2: Method > 50 lines
**Problem:** Doing too much  
**Fix:** Extract to smaller methods

### Red Flag 3: No dependency injection
**Problem:** Cannot test, cannot swap  
**Fix:** Inject via constructor

### Red Flag 4: Multiple concerns
**Problem:** Violates SoC  
**Fix:** One class per concern

### Red Flag 5: Duplicate logic
**Problem:** Violates SoT  
**Fix:** Extract to registry/utility

---

## 📐 Recommended Structure

### File Organization
```
contract-generation/
├── mappers/               (Small focused classes)
│   ├── TypeMapper.ts      (50 lines - orchestrator)
│   ├── PrimitiveMapper.ts (30 lines)
│   ├── ArrayMapper.ts     (40 lines)
│   ├── ObjectMapper.ts    (60 lines)
│   └── UnionMapper.ts     (40 lines)
├── generators/            (Single responsibility)
│   ├── SchemaGenerator.ts (80 lines)
│   ├── TypeGenerator.ts   (60 lines)
│   └── ValidatorGenerator.ts (70 lines)
├── builders/              (Orchestration)
│   ├── ContractCodeBuilder.ts (100 lines)
│   ├── ImportBuilder.ts   (40 lines)
│   └── SectionBuilder.ts  (50 lines)
├── utils/                 (Shared helpers)
│   ├── PrimitiveTypeRegistry.ts (50 lines)
│   ├── ZodModifierBuilder.ts (60 lines)
│   └── NamingHelper.ts    (40 lines)
└── ContractSchemaMapper.ts (120 lines - facade)
```

### Class Size Guidelines

| Type | Max Lines | Purpose |
|------|-----------|---------|
| Mapper | 60 | Single type mapping |
| Generator | 80 | Single section generation |
| Builder | 100 | Orchestration only |
| Utility | 60 | Pure helper functions |
| Facade | 150 | Public API (delegates) |

---

## ✅ Implementation Checklist

### Before Writing Class
- [ ] Class < 200 lines?
- [ ] ONE clear responsibility?
- [ ] Dependencies injected?
- [ ] Can test in isolation?
- [ ] No duplicate logic?

### During Implementation
- [ ] Each method < 50 lines
- [ ] No nested if/else > 3 levels
- [ ] Magic values → constants/registry
- [ ] Meaningful names (no abbreviations)
- [ ] JSDoc for public APIs

### After Implementation
- [ ] Unit tests for each class (95%+)
- [ ] Integration test for orchestrator
- [ ] No duplicate logic
- [ ] Dependencies mockable
- [ ] Code review against anti-patterns

---

## 📊 Benefits of This Architecture

### Maintainability
- ✅ Small classes easier to understand
- ✅ Changes isolated to single class
- ✅ No ripple effects across codebase
- ✅ Easy to locate bugs

### Testability
- ✅ Each class testable independently
- ✅ Dependencies mockable
- ✅ Pure functions deterministic
- ✅ High coverage achievable

### Reusability
- ✅ Small classes reusable
- ✅ Utilities shared across features
- ✅ No duplicate logic
- ✅ Easy to compose new features

### Scalability
- ✅ Add new mappers without touching existing
- ✅ Swap implementations easily
- ✅ Extend without modification (Open/Closed)
- ✅ No exponential complexity growth

---

## 🔗 Integration with Existing Principles

These code quality principles **complement** existing principles:

### 1. Evidence-Based Architecture
- Small classes → easier to analyze
- Clear responsibilities → easier to document
- Pure functions → easier to verify

### 2. Compiler Bridge Architecture
- SoC → aligns with bridge pattern
- No business logic → thin bridge layer
- Composable → easy to wire

### 3. Frontend Domain Model
- Single source of truth → consistent transformations
- Reusable utilities → shared across generators
- Small classes → easier to maintain philosophy

---

## 📖 Documentation Added to Prompt

Added new section: **"🏗️ Code Architecture Principles (Maintainability Focus)"**

**Location:** After "Key Differences" section, before "Implementation Steps"

**Content includes:**
1. Small Classes Principle (with examples)
2. Dependency Injection Pattern (with examples)
3. Separation of Concerns (with examples)
4. Single Source of Truth (with examples)
5. Reusable Utilities (with examples)
6. Factory Pattern (with examples)
7. Test-Driven Design (with examples)
8. Anti-Pattern Detection (red flags)
9. Recommended Class Structure (file organization)
10. Implementation Checklist (quality gates)

---

## 🎯 Expected Impact

### Code Quality Improvement
- **Before:** Risk of 1000+ line god classes
- **After:** Maximum 200 lines per class, composable

### Maintenance Cost Reduction
- **Before:** Changes affect many files
- **After:** Changes isolated to single class

### Test Coverage Increase
- **Before:** Hard to test large classes
- **After:** Easy to test small, pure classes

### Onboarding Time Reduction
- **Before:** Hard to understand large codebase
- **After:** Easy to understand small, focused classes

### Bug Fix Time Reduction
- **Before:** Bug location unclear
- **After:** Clear responsibility boundaries

---

## ✅ Status: READY FOR IMPLEMENTATION

Dokumen `API_CONTRACT_IMPLEMENTATION_PROMPT.md` telah diupdate dengan:
- ✅ Complete code quality principles section
- ✅ Practical examples (good vs bad)
- ✅ Anti-pattern detection guide
- ✅ Recommended file structure
- ✅ Implementation checklist
- ✅ Updated final reminders

**Next Steps:**
1. ⏳ Follow principles during implementation
2. ⏳ Review against anti-patterns checklist
3. ⏳ Ensure all classes < 200 lines
4. ⏳ Verify no duplicate logic
5. ⏳ Test each small class independently

---

**Last Updated:** 2026-08-07  
**Added By:** Kiro Agent  
**User Request:** "buat code mudah dimaintain, kurangi duplikasi, class kecil reusable, utamakan SoC dan SoT"
