# RouteSync: Panduan Testing & Quality Assurance

## Filosofi Testing

RouteSync menggunakan **multi-layered testing strategy** untuk memastikan reliabilitas code generation dan type safety. Setiap layer memiliki tanggung jawab berbeda dalam memastikan kualitas output.

## Testing Framework & Tools

### Core Testing Stack
- **Vitest** (v4.1+): Primary test runner (TypeScript-first)
- **Node.js Environment**: Semua tests run di Node environment (no DOM/browser APIs)
- **Property-Based Testing**: Untuk core algorithms dan type inference
- **Integration Testing**: End-to-end pipeline testing dengan real Laravel manifests

### Testing File Naming
```
**/*.test.ts          # Unit tests
**/*.integration.test.ts   # Integration tests
**/*.spec.ts          # Specification tests (property-based)
```

## Testing Layers

### 1. Unit Tests
**Scope:** Individual functions, classes, utilities
**Location:** `packages/*/src/**/*.test.ts`

```typescript
// Example: Type inference unit test
import { inferResponseType } from '../semantic/TypeInference'

describe('TypeInference', () => {
  test('should infer User type from UserResource', () => {
    const result = inferResponseType('UserResource', mockRegistry)
    expect(result.type).toBe('User')
    expect(result.collection).toBe(false)
  })
  
  test('should handle collection inference', () => {
    const result = inferResponseType('UserResource::collection', mockRegistry)
    expect(result.collection).toBe(true)
  })
})
```

### 2. Integration Tests  
**Scope:** Full pipeline testing (Parse → Semantic → IR → Emit)
**Location:** `packages/cli/src/generators/__tests__/*.integration.test.ts`

```typescript
// Example: Full pipeline integration test
describe('Generator Pipeline Integration', () => {
  test('should generate complete SDK from Laravel manifest', async () => {
    const manifest = await loadTestManifest('basic-crud.json')
    const generator = new ContractGenerator(manifest)
    
    const result = await generator.generateAll()
    
    expect(result.files).toContain('api.ts')
    expect(result.files).toContain('types.ts')
    expect(result.files).toContain('hooks.ts')
    
    // Validate generated TypeScript compiles
    await expectTypeScriptToCompile(result.files)
  })
})
```

### 3. Property-Based Tests
**Scope:** Core algorithms, type safety invariants
**Location:** `packages/core/src/**/*.spec.ts`

```typescript
// Example: Property-based test for semantic resolution
import { fc, test } from '@fast-check/vitest'

test.prop([
  fc.record({
    method: fc.constantFrom('GET', 'POST', 'PUT', 'DELETE'),
    path: fc.string({ minLength: 1 }),
    controller: fc.string({ minLength: 1 }),
  })
])('should always preserve route method and path during semantic resolution', (route) => {
  const resolved = semanticResolver.resolve(route)
  
  expect(resolved.method).toBe(route.method)
  expect(resolved.path).toBe(route.path)
  expect(resolved.controller).toBe(route.controller)
})
```

### 4. Contract Tests
**Scope:** Generated output validation
**Location:** `packages/cli/src/generators/__tests__/contracts/*.test.ts`

```typescript
// Example: Contract test untuk generated API client
describe('Generated API Contract', () => {
  test('should maintain type safety in generated hooks', () => {
    const generatedHooks = generateHooksFromManifest(testManifest)
    
    // Ensure hooks return correct types
    expectTypeOf(generatedHooks.useUsers.index()).toMatchTypeOf<{
      users: User[]
      isLoading: boolean
      error: Error | null
    }>()
  })
})
```

## Test Execution Strategy

### Development Workflow
```bash
# Run tests untuk specific package
cd packages/core && npm test

# Run semua tests dengan watch mode
npm run test:watch

# Run integration tests saja
npm run test:integration

# Run dengan coverage report
npm run test:coverage
```

### CI/CD Pipeline
```bash
# Pre-commit validation
npm run test:unit        # Fast unit tests
npm run lint            # Code quality
npm run typecheck       # TypeScript validation

# Full CI pipeline
npm run test:all        # All test suites
npm run test:integration # End-to-end scenarios
npm run build          # Ensure build passes
```

## Test Data Management

### Mock Manifests
**Location:** `tests/fixtures/manifests/`
```
tests/fixtures/manifests/
├── basic-crud.json           # Simple CRUD operations
├── complex-relations.json    # Models dengan relationships  
├── validation-rules.json     # FormRequest dengan Zod schemas
├── auth-endpoints.json       # Authentication flows
└── edge-cases.json          # Edge cases & error scenarios
```

### Test Databases
- **SQLite in-memory**: Untuk model schema tests
- **Mock Eloquent models**: Untuk type inference tests
- **Fixture data**: JSON fixtures untuk consistent test data

## Quality Gates

### Code Coverage Requirements
- **Unit tests:** Minimum 80% line coverage
- **Integration tests:** Minimum 70% branch coverage
- **Critical paths:** 90% coverage untuk type inference & semantic resolution

### Performance Benchmarks
```typescript
// Example: Performance test
describe('Performance Benchmarks', () => {
  test('should process large manifest within acceptable time', async () => {
    const largeManifest = generateLargeManifest(1000) // 1000 routes
    
    const start = performance.now()
    await generator.processManifest(largeManifest)
    const duration = performance.now() - start
    
    expect(duration).toBeLessThan(5000) // Max 5 seconds
  })
})
```

### Memory Usage Tests
```typescript
test('should not leak memory during large generations', async () => {
  const initialMemory = process.memoryUsage().heapUsed
  
  for (let i = 0; i < 100; i++) {
    await generator.processManifest(testManifest)
  }
  
  global.gc?.() // Force garbage collection if available
  const finalMemory = process.memoryUsage().heapUsed
  const memoryGrowth = finalMemory - initialMemory
  
  expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024) // Max 50MB growth
})
```

## Testing Best Practices

### 1. Test Isolation
```typescript
// ✅ Good: Each test is isolated
describe('SemanticResolver', () => {
  let resolver: SemanticResolver
  
  beforeEach(() => {
    resolver = new SemanticResolver(createFreshRegistry())
  })
})

// ❌ Bad: Shared state between tests
const globalResolver = new SemanticResolver()
```

### 2. Descriptive Test Names
```typescript
// ✅ Good: Describes behavior clearly
test('should infer collection type when Resource::collection() is used')

// ❌ Bad: Vague description  
test('test collection type')
```

### 3. Arrange-Act-Assert Pattern
```typescript
test('should transform snake_case to camelCase in response mapper', () => {
  // Arrange
  const input = { user_name: 'john', created_at: '2024-01-01' }
  
  // Act
  const result = responseMapper.transform(input)
  
  // Assert
  expect(result).toEqual({ userName: 'john', createdAt: '2024-01-01' })
})
```

### 4. Error Scenario Testing
```typescript
describe('Error Handling', () => {
  test('should throw meaningful error when manifest is invalid', () => {
    const invalidManifest = { routes: null }
    
    expect(() => generator.processManifest(invalidManifest))
      .toThrow('Invalid manifest: routes must be an array')
  })
})
```

## Manual Testing Scenarios

### End-to-End Validation
1. **Laravel Integration**: Test dengan real Laravel app
2. **Generated Code Compilation**: Verify TypeScript compilation
3. **Runtime Validation**: Test generated hooks di real React/Vue app
4. **Type Safety**: Verify IntelliSense dan type checking

### Cross-Platform Testing
- **Windows**: PowerShell compatibility
- **macOS**: Bash compatibility
- **Linux**: Various distributions
- **Node versions**: 20, 21, 22

## Test Debugging

### Debugging Failed Tests
```bash
# Run specific test dengan verbose output
npm test -- --reporter=verbose packages/core/src/semantic.test.ts

# Debug dengan Node inspector
node --inspect-brk ./node_modules/vitest/vitest.mjs run

# Generate detailed error logs
DEBUG=routesync:* npm test
```

### Visual Test Output
```typescript
// Generate visual diffs untuk generated code
test('should match expected generated output', () => {
  const result = generator.generateAPI(manifest)
  expect(result).toMatchFileSnapshot('./expected/api.ts')
})
```

## Continuous Testing

### Pre-commit Hooks
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run test:unit && npm run lint",
      "pre-push": "npm run test:all"
    }
  }
}
```

### Test Automation
- **GitHub Actions**: Run tests pada setiap PR
- **Dependabot**: Auto-test dependency updates
- **Nightly builds**: Test dengan latest Laravel versions
- **Performance regression testing**: Track performance over time

## Metrics & Reporting

### Test Metrics Tracking
- **Test execution time trends**
- **Code coverage progression**  
- **Flaky test detection**
- **Performance benchmark history**

### Quality Dashboard
- Real-time test status
- Coverage reports
- Performance graphs
- Error trending analysis