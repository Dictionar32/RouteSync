# RouteSync: Panduan Kontribusi Developer

## Filosofi Kontribusi

RouteSync adalah **open-source project** yang mengutamakan **code quality**, **type safety**, dan **developer experience**. Kontribusi terbaik adalah yang mempertahankan philosophy ini sambil menambah value untuk community.

## Getting Started

### Prerequisites
- **Node.js** 20+
- **PHP** 8.2+ (untuk Laravel integration testing)
- **Git** dengan SSH key setup
- **VS Code** (recommended) dengan TypeScript extension

### Local Development Setup
```bash
# Clone repository
git clone git@github.com:routesync/routesync.git
cd routesync

# Install dependencies
npm install

# Build semua packages
npm run build

# Run tests
npm test

# Start development mode
npm run dev
```

### Workspace Setup
```bash
# Install recommended VS Code extensions
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension bradlc.vscode-tailwindcss
code --install-extension esbenp.prettier-vscode

# Setup Git hooks
npm run prepare
```

## Contribution Workflow

### 1. Issue Creation
```markdown
# Bug Report Template
**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Generate manifest with '...'
2. Run command '...'  
3. See error

**Expected behavior**
What you expected to happen.

**Environment:**
- OS: [e.g. macOS 14.1]
- Node version: [e.g. 20.10.0]
- RouteSync version: [e.g. 1.0.49]
- Laravel version: [e.g. 10.x]

**Additional context**
Add any other context about the problem here.
```

### 2. Branch Strategy
```bash
# Feature development
git checkout -b feature/semantic-resolution-optimization

# Bug fixes
git checkout -b fix/type-inference-edge-case

# Documentation
git checkout -b docs/update-cli-examples

# Refactoring
git checkout -b refactor/extract-emitter-base-class
```

### 3. Development Process
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes dengan incremental commits
git add packages/core/src/semantic/
git commit -m "feat(semantic): add caching layer for type resolution"

git add packages/cli/src/generators/
git commit -m "feat(cli): integrate cached semantic resolver"

git add packages/cli/src/__tests__/
git commit -m "test: add integration tests for cached resolution"

# Update documentation
git add README.md docs/
git commit -m "docs: update performance benchmarks"

# Push branch
git push origin feature/your-feature-name
```

### 4. Pull Request Process
```markdown
# PR Template
## Summary
Brief description of the changes in this PR.

## Changes
- [ ] Added caching layer to semantic resolver
- [ ] Updated CLI to use cached resolver
- [ ] Added integration tests
- [ ] Updated documentation

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] Performance benchmarks updated

## Breaking Changes
List any breaking changes and migration steps.

## Related Issues
Fixes #123
Resolves #456
```

## Code Standards

### TypeScript Guidelines
```typescript
// ✅ Good: Explicit types, descriptive names
interface SemanticResolverOptions {
  enableCaching: boolean
  cacheSize: number
  debugMode?: boolean
}

class OptimizedSemanticResolver implements ISemanticResolver {
  private readonly cache: LRUCache<string, ResolvedType>
  
  constructor(private options: SemanticResolverOptions) {
    this.cache = new LRUCache({ max: options.cacheSize })
  }
  
  async resolveType(typeName: string): Promise<ResolvedType> {
    const cached = this.cache.get(typeName)
    if (cached) return cached
    
    const resolved = await this.performResolution(typeName)
    this.cache.set(typeName, resolved)
    return resolved
  }
}

// ❌ Bad: Implicit types, unclear naming
class Resolver {
  cache: any
  
  resolve(name: any) {
    // Implementation
  }
}
```

### Error Handling Standards
```typescript
// ✅ Good: Structured error handling
export class SemanticResolutionError extends Error {
  constructor(
    message: string,
    public readonly typeName: string,
    public readonly cause?: Error
  ) {
    super(message)
    this.name = 'SemanticResolutionError'
  }
}

// Usage
try {
  const resolved = await resolver.resolveType(typeName)
  return resolved
} catch (error) {
  if (error instanceof SemanticResolutionError) {
    logger.error('Type resolution failed', {
      typeName: error.typeName,
      cause: error.cause?.message
    })
  }
  throw new CodeGenerationError(`Failed to resolve type: ${typeName}`, error)
}
```

### Testing Standards
```typescript
// ✅ Good: Descriptive test names, proper setup/teardown
describe('CachedSemanticResolver', () => {
  let resolver: CachedSemanticResolver
  let mockRegistry: jest.Mocked<ModelRegistry>
  
  beforeEach(() => {
    mockRegistry = createMockRegistry()
    resolver = new CachedSemanticResolver({
      enableCaching: true,
      cacheSize: 100
    })
  })
  
  afterEach(() => {
    resolver.clearCache()
  })
  
  describe('when resolving cached types', () => {
    it('should return cached result on second call', async () => {
      // Arrange
      const typeName = 'User'
      const expectedType: ResolvedType = { name: 'User', properties: [] }
      mockRegistry.getModel.mockResolvedValue(expectedType)
      
      // Act
      const firstCall = await resolver.resolveType(typeName)
      const secondCall = await resolver.resolveType(typeName)
      
      // Assert
      expect(firstCall).toEqual(expectedType)
      expect(secondCall).toEqual(expectedType)
      expect(mockRegistry.getModel).toHaveBeenCalledTimes(1)
    })
  })
})
```

## Architecture Guidelines

### Package Structure
```
packages/
├── core/                 # Shared utilities, types, base classes
│   ├── src/
│   │   ├── types/       # Core type definitions
│   │   ├── utils/       # Shared utilities  
│   │   ├── base/        # Base classes
│   │   └── index.ts     # Public API
│   └── package.json
├── cli/                  # CLI commands & generators
│   ├── src/
│   │   ├── commands/    # CLI command implementations
│   │   ├── generators/  # Code generators
│   │   └── utils/       # CLI-specific utilities
│   └── package.json
└── sdk/                  # Runtime SDK
    ├── src/
    │   ├── client/      # HTTP client
    │   ├── types/       # Runtime types
    │   └── index.ts     # Public API
    └── package.json
```

### Dependency Rules
```typescript
// ✅ Good: Clear dependency direction
// core → (no dependencies)
// cli → core
// sdk → core
// react → sdk, core
// vue → sdk, core

// ❌ Bad: Circular dependencies
// core → cli (NOT ALLOWED)
// sdk → cli (NOT ALLOWED)
```

### Interface Design
```typescript
// ✅ Good: Interface segregation
interface ITypeResolver {
  resolveType(typeName: string): Promise<ResolvedType>
}

interface ICacheableResolver extends ITypeResolver {
  clearCache(): void
  getCacheStats(): CacheStats
}

interface IDebugableResolver extends ITypeResolver {
  enableDebug(enabled: boolean): void
  getDebugInfo(): DebugInfo
}

// ✅ Good: Composition over inheritance
class CachedSemanticResolver implements ICacheableResolver, IDebugableResolver {
  constructor(
    private baseResolver: ITypeResolver,
    private cache: ICache<string, ResolvedType>,
    private debugger: IDebugger
  ) {}
}
```

## Performance Considerations

### Contribution Performance Requirements
- **New features** harus maintain atau improve existing benchmarks
- **Semantic resolution** tidak boleh slower dari 5s untuk 1000 routes
- **Memory usage** tidak boleh exceed 512MB peak untuk large projects
- **Generated code size** harus optimal (no unused imports/types)

### Performance Testing
```typescript
// Add performance tests untuk new features
describe('Performance: CachedSemanticResolver', () => {
  it('should resolve 1000 types within 2 seconds', async () => {
    const resolver = new CachedSemanticResolver(options)
    const typeNames = generateTypeNames(1000)
    
    const start = performance.now()
    await Promise.all(typeNames.map(name => resolver.resolveType(name)))
    const duration = performance.now() - start
    
    expect(duration).toBeLessThan(2000)
  })
  
  it('should not leak memory during batch processing', async () => {
    const initialMemory = process.memoryUsage().heapUsed
    
    for (let i = 0; i < 10; i++) {
      await processBatch(generateLargeManifest())
      if (global.gc) global.gc()
    }
    
    const finalMemory = process.memoryUsage().heapUsed
    const memoryGrowth = finalMemory - initialMemory
    
    expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024) // 50MB max
  })
})
```

## Documentation Standards

### Code Documentation
```typescript
/**
 * Resolves TypeScript types from Laravel model definitions with caching support.
 * 
 * @example
 * ```typescript
 * const resolver = new CachedSemanticResolver({
 *   enableCaching: true,
 *   cacheSize: 1000
 * })
 * 
 * const userType = await resolver.resolveType('User')
 * console.log(userType.properties) // [{ name: 'id', type: 'number' }, ...]
 * ```
 */
export class CachedSemanticResolver implements ISemanticResolver {
  /**
   * Creates a new cached semantic resolver.
   * 
   * @param options - Configuration options for the resolver
   * @param options.enableCaching - Whether to enable caching (default: true)
   * @param options.cacheSize - Maximum number of entries to cache (default: 1000)
   * @param options.debugMode - Enable debug logging (default: false)
   */
  constructor(private options: SemanticResolverOptions) {
    // Implementation
  }
  
  /**
   * Resolves a TypeScript type definition from a type name.
   * 
   * @param typeName - The name of the type to resolve (e.g., 'User', 'Product')
   * @returns Promise that resolves to the type definition
   * @throws {SemanticResolutionError} When type cannot be resolved
   * 
   * @example
   * ```typescript
   * const userType = await resolver.resolveType('User')
   * // Returns: { name: 'User', properties: [...], methods: [...] }
   * ```
   */
  async resolveType(typeName: string): Promise<ResolvedType> {
    // Implementation
  }
}
```

### Changelog Guidelines
```markdown
# Changelog Format (CHANGELOG.md)

## [1.1.0] - 2024-01-15

### Added
- Caching layer for semantic resolution (#123)
- Performance monitoring utilities (#125)
- Support for nested Resource relationships (#127)

### Changed  
- Improved type inference accuracy by 15% (#124)
- Updated CLI progress indicators (#126)

### Fixed
- Fixed memory leak in large manifest processing (#122)
- Resolved circular dependency in generated types (#128)

### Deprecated
- `LegacySemanticResolver` will be removed in v2.0 (#129)

### Performance
- Type resolution now 40% faster with caching enabled
- Memory usage reduced by 25% for large projects
```

## Review Process

### Self-Review Checklist
```markdown
- [ ] Code follows TypeScript style guidelines
- [ ] All tests pass (unit + integration)
- [ ] Performance benchmarks maintained or improved
- [ ] Documentation updated (code + README if needed)
- [ ] Changelog entry added
- [ ] No console.log statements in production code
- [ ] Error handling is comprehensive
- [ ] Types are explicit (no implicit any)
- [ ] Breaking changes are documented
```

### Code Review Guidelines

**For Reviewers:**
```markdown
# Review Focus Areas

## Architecture & Design
- Does the change fit RouteSync's architecture?
- Are interfaces well-designed and extensible?
- Is the code maintainable long-term?

## Performance
- Will this impact generation time or memory usage?
- Are algorithms efficient for large inputs?
- Is caching used appropriately?

## Type Safety
- Are all types explicit and correct?
- Is error handling comprehensive?
- Will this cause runtime type issues?

## Testing
- Are edge cases covered?
- Do tests validate the actual behavior?
- Is test coverage sufficient?
```

**Review Comments Format:**
```markdown
# Constructive feedback format

## Must Fix
- **Issue:** This could cause memory leak in watch mode
- **Suggestion:** Use WeakMap instead of Map for cache
- **Reason:** Long-running processes need careful memory management

## Consider
- **Observation:** This algorithm is O(n²) 
- **Alternative:** Consider using Map for O(1) lookups
- **Trade-off:** Memory vs speed, depends on typical input size

## Praise
- **Good:** Excellent error handling with context
- **Impact:** This will make debugging much easier for users
```

## Release Process

### Version Numbering (SemVer)
- **Major (x.0.0):** Breaking changes
- **Minor (1.x.0):** New features, backward compatible
- **Patch (1.1.x):** Bug fixes, backward compatible

### Release Checklist
```bash
# 1. Pre-release testing
npm run test:all
npm run build
npm run test:integration

# 2. Version bump
npm version minor # or major/patch

# 3. Update changelog
# Edit CHANGELOG.md dengan release notes

# 4. Create release PR
git push origin release/v1.1.0

# 5. After merge, tag release
git tag v1.1.0
git push origin v1.1.0

# 6. Publish packages
npm run publish:all
```

## Community Guidelines

### Communication
- **GitHub Discussions:** Feature requests, architecture discussions
- **Issues:** Bug reports, specific problems
- **Discord:** Real-time community chat
- **Twitter:** Updates, announcements

### Code of Conduct
- Be respectful and inclusive
- Focus on constructive feedback
- Help newcomers learn and contribute
- Assume good intentions
- No harassment or discrimination

### Recognition
Contributors akan credited in:
- CONTRIBUTORS.md file
- Release notes untuk significant contributions
- Special recognition untuk major features
- Invitation to maintainer team untuk consistent contributors

## Advanced Contribution Areas

### 1. Core Engine Development
- Semantic resolution improvements
- Performance optimizations
- Memory management
- Type inference enhancements

### 2. Generator Enhancements  
- New output formats
- Template system improvements
- Code optimization
- Framework integrations

### 3. CLI/UX Improvements
- Better error messages
- Progress indicators
- Developer experience
- Documentation generation

### 4. Testing & Quality
- Property-based testing
- Performance benchmarking
- Integration test scenarios
- Quality metrics

Setiap area membutuhkan different expertise levels. New contributors bisa mulai dengan documentation atau simple bug fixes, kemudian progress ke core engine development.