# API Contract Generation - Quick Reference Card

**Version**: 1.0.0
**Status**: Production Ready ✅

---

## 🚀 Quick Start (30 seconds)

```bash
# Generate contracts
npx routesync generate --manifest manifest.json --output src/api

# Use in code
import { validateregisterCreate } from '@/api/contracts/api-contract';

const validData = validateregisterCreate(userInput);
```

---

## 📁 File Locations

| File | Purpose | Location |
|------|---------|----------|
| Generated Contracts | Zod schemas | `{output}/contracts/api-contract.ts` |
| Core Implementation | Generator logic | `packages/core/src/compiler/generators/contract-generation/` |
| CLI Integration | CompilerBridge | `packages/cli/src/generators/CompilerBridge.ts` |
| Tests | All tests | `packages/core/src/compiler/generators/contract-generation/__tests__/` |

---

## 🧩 Components

| Component | Responsibility | LOC | Tests |
|-----------|----------------|-----|-------|
| `PrimitiveTypeRegistry` | Map Laravel rules → Zod types | ~80 | 8 |
| `ZodModifierBuilder` | Build modifier chains | ~60 | 10 |
| `ContractSchemaMapper` | Map fields → schemas | ~120 | 25 |
| `ContractActionGenerator` | Group by action | ~100 | 12 |
| `ContractCodeBuilder` | Build 4-section output | ~200 | 10 |
| `ContractGeneratorPass` | Orchestrate generation | ~150 | 28 |

**Total**: ~700 LOC, 93 tests

---

## 📤 Output Structure (4 Sections)

```typescript
// Section 1: Zod Schemas
export const resourceContractSchema = {
  create: z.object({ ... }),
  update: z.object({ ... })
};

// Section 2: Inferred Types
export type resourceContract = {
  create: z.infer<typeof resourceContractSchema.create>
};

// Section 3: Validators
export const validateresourceCreate = (data: unknown) => {
  return resourceContractSchema.create.parse(data);
};

// Section 4: Exports
export const ContractSchemas = {
  resource: resourceContractSchema
};
```

---

## 🔧 API Reference

### CompilerBridge Methods

```typescript
// Generate contracts
async generateContractTypes(manifest: Manifest): Promise<ContractOutput>

// Convert manifest to contract input
private manifestToContractInput(manifest: Manifest): RequestTypeInput[]

// Sanitize resource names (kebab-case → camelCase)
private sanitizeResourceName(name: string): string

// Parse validation rules preserving structure
private parseValidationRulesPreserveNested(
  rules: Record<string, string | string[]>
): FieldDefinition[]
```

### ContractGeneratorPass Methods

```typescript
// Execute pass
async run(inputs: [RequestTypesArtifact]): Promise<[GeneratedContractArtifact]>

// Process single request type
private processRequestType(requestType: RequestTypeInput): GeneratedContract

// Generate Zod schema code
private generateSchemaCode(contract: GeneratedContract): string
```

---

## 🧪 Testing

### Run All Tests
```bash
npx vitest run ContractGeneratorPass
```

### Run Specific Component
```bash
npx vitest run ContractSchemaMapper
```

### Run with Coverage
```bash
npx vitest run --coverage
```

### Test Structure
```
__tests__/
├── PrimitiveTypeRegistry.test.ts
├── ZodModifierBuilder.test.ts
├── ContractSchemaMapper.test.ts
├── ContractActionGenerator.test.ts
├── ContractCodeBuilder.test.ts
└── ContractGeneratorPass.test.ts
```

---

## 🐛 Common Issues

### Issue: Invalid JavaScript Identifiers
**Problem**: `forgot-password` becomes `forgot-passwordContractSchema`
**Fix**: Use `sanitizeResourceName()` → `forgotPasswordContractSchema` ✅

### Issue: Nested Array Fields Skipped
**Problem**: `items.*.produk_item_id` not in output
**Reason**: Complex nested arrays not supported yet
**Workaround**: Manual schema definition

### Issue: Non-string Rules Skipped
**Problem**: `{ email: ['required', 'email'] }` not processed
**Reason**: Only string rules supported
**Fix**: Convert to string: `'required|email'`

---

## 📊 Type Mappings

| Laravel Rule | Zod Type | Example |
|--------------|----------|---------|
| `required\|string` | `z.string()` | `name: z.string()` |
| `required\|integer` | `z.number()` | `age: z.number()` |
| `required\|boolean` | `z.boolean()` | `active: z.boolean()` |
| `required\|array` | `z.array(z.unknown())` | `tags: z.array(z.unknown())` |
| `nullable\|string` | `z.string().nullable()` | `bio: z.string().nullable()` |
| `sometimes\|string` | `z.string().optional()` | `note: z.string().optional()` |
| `nullable\|sometimes\|string` | `z.string().nullable().optional()` | Combined |

---

## 🎯 Usage Patterns

### Pattern 1: Form Validation
```typescript
import { validateregisterCreate } from '@/api/contracts/api-contract';

function RegisterForm() {
  const handleSubmit = (data: any) => {
    try {
      const validData = validateregisterCreate(data);
      // Send to API
      await api.post('/register', validData);
    } catch (error) {
      // Handle validation errors
      console.error(error);
    }
  };
}
```

### Pattern 2: Type Inference
```typescript
import { ContractSchemas } from '@/api/contracts/api-contract';

type RegisterData = z.infer<typeof ContractSchemas.register.create>;

const data: RegisterData = {
  name: 'John',
  email: 'john@example.com',
  password: 'secret'
};
```

### Pattern 3: Conditional Validation
```typescript
import { ContractSchemas } from '@/api/contracts/api-contract';

const validateIfNeeded = (data: unknown, shouldValidate: boolean) => {
  if (shouldValidate) {
    return ContractSchemas.register.create.parse(data);
  }
  return data;
};
```

---

## 🔄 Data Flow

```
Laravel Manifest
    ↓
manifestToContractInput()
    ↓
RequestTypeInput[]
    ↓
ContractGeneratorPass.run()
    ↓
  ├─ processRequestType()
  │     ↓
  │   PrimitiveTypeRegistry.getType()
  │     ↓
  │   ZodModifierBuilder.build()
  │     ↓
  │   ContractSchemaMapper.mapFields()
  │     ↓
  │   ContractActionGenerator.generate()
  │     ↓
  │   ContractCodeBuilder.build()
  │
  └─ GeneratedContractArtifact
         ↓
      File Write
         ↓
  contracts/api-contract.ts
```

---

## 📋 Cheat Sheet

### Build & Test
```bash
npm run build                           # Build project
npm test                                # Run all tests
npx vitest run ContractGeneratorPass   # Run specific tests
npx tsc --noEmit                       # Type check
```

### Generate
```bash
# Basic
npx routesync generate --manifest manifest.json --output src/api

# With specific output
npx routesync generate \
  --manifest manifest.json \
  --output src/api \
  --contracts
```

### Debug
```bash
# Enable debug logging
DEBUG=routesync:* npx routesync generate

# Check generated output
cat src/api/contracts/api-contract.ts

# Validate TypeScript
npx tsc --noEmit src/api/contracts/api-contract.ts
```

---

## 🎨 Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Schema Constant | `{resource}ContractSchema` | `registerContractSchema` |
| Type Definition | `{resource}Contract` | `registerContract` |
| Validator Function | `validate{resource}{Action}` | `validateregisterCreate` |
| Export Object | `ContractSchemas` | Fixed name |

**Note**: Resource names converted from kebab-case → camelCase

---

## 🚦 Feature Flags

| Flag | Type | Description |
|------|------|-------------|
| `--manifest` | Required | Path to manifest file |
| `--output` | Required | Output directory |
| `--contracts` | Optional | Enable contract generation (auto-enabled) |

---

## 📈 Performance

| Metric | Value |
|--------|-------|
| Generation Time (13 contracts) | < 250ms |
| Memory Usage | ~30MB growth |
| Complexity | O(n) linear |
| Output Size | ~20 LOC per contract |

---

## ✅ Quality Checklist

### Before Commit
- [ ] All tests passing (`npm test`)
- [ ] TypeScript compiles (`npx tsc --noEmit`)
- [ ] No console.log/debug code
- [ ] Documentation updated
- [ ] Examples working

### Before Release
- [ ] Version bumped
- [ ] CHANGELOG updated
- [ ] Documentation reviewed
- [ ] Real manifest tested
- [ ] Performance acceptable

---

## 🔗 Related Files

| File | Purpose |
|------|---------|
| `API_CONTRACT_IMPLEMENTATION_PROMPT.md` | Implementation guide |
| `CONTRACT_GENERATION_COMPONENT_SPECS.md` | Component specs |
| `API_CONTRACT_CODE_QUALITY_PRINCIPLES.md` | Quality standards |
| `CONTRACT_GENERATION_ARCHITECTURE_DIAGRAM.md` | Architecture visual |
| `API_CONTRACT_GENERATION_COMPLETE.md` | Complete documentation |

---

## 📞 Support

### Issues
- Check `CONTRACT_GENERATION_STEP_8_STATUS.md` for known issues
- Review tests for usage examples
- Check inline documentation in code

### Questions
- See `API_CONTRACT_GENERATION_COMPLETE.md` for detailed info
- Review architecture diagrams for system understanding
- Check component specs for design decisions

---

**Quick Links**:
- [Implementation Guide](./API_CONTRACT_IMPLEMENTATION_PROMPT.md)
- [Complete Docs](./API_CONTRACT_GENERATION_COMPLETE.md)
- [Architecture](./CONTRACT_GENERATION_ARCHITECTURE_DIAGRAM.md)
- [Next Steps](./API_CONTRACT_NEXT_STEPS.md)

---

**Last Updated**: 2026-08-08
**Version**: 1.0.0
**Status**: Production Ready ✅
