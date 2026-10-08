# Code Generation Pipeline

Complete code generation engine untuk RouteSync compiler.

## Architecture

```
Input (IR/Manifest) → Generator → Formatter → Emitter → Writer → Files
```

**Pipeline Stages:**
1. **Generation**: Transform input (ContractGraph, etc) ke Target AST
2. **Formatting**: Optimize AST (sort imports, reorder declarations)
3. **Emission**: Convert AST to code string
4. **Writing**: Persist code to files/memory

## Quick Start

### Basic Usage

```typescript
import { PipelineBuilder } from './CodeGenerationEngine';
import { TypeScriptGenerator } from '../generators/typescript/TypeScriptGenerator';
import { TypeScriptFormatter } from '../formatting/TypeScriptFormatter';
import { TypeScriptEmitter } from '../emitters/TypeScriptEmitter';
import { FileWriter } from '../writers/FileWriter';

// Build pipeline
const engine = PipelineBuilder.create()
  .withGenerator(new TypeScriptGenerator())
  .withFormatter(new TypeScriptFormatter())
  .withEmitter(new TypeScriptEmitter())
  .withWriter(new FileWriter({ outputDir: './output' }))
  .withVerbose(true)
  .build();

// Execute pipeline
const result = await engine.execute(contractGraph);

console.log(`Generated ${result.artifacts.length} file(s)`);
console.log(`Total time: ${result.metrics.totalTimeMs}ms`);
```

### With Configuration

```typescript
const engine = PipelineBuilder.create()
  .withGenerator(generator)
  .withFormatter(formatter)
  .withEmitter(emitter)
  .withWriter(writer)
  .withConfig({
    stages: {
      formatting: true,    // Enable formatting
      validation: true,    // Enable validation
      optimization: true   // Enable optimization
    },
    profiling: true,       // Track performance
    failFast: true,        // Stop on first error
    verbose: true          // Detailed logging
  })
  .build();
```

### Memory Writer (Testing)

```typescript
import { MemoryWriter } from '../writers/MemoryWriter';

const writer = new MemoryWriter();

const engine = PipelineBuilder.create()
  .withGenerator(generator)
  .withFormatter(formatter)
  .withEmitter(emitter)
  .withWriter(writer)
  .build();

await engine.execute(input);

// Access generated files in memory
const apiRead = writer.getFile('types/api-read.ts');
const apiForm = writer.getFile('forms/api-form.ts');

console.log(`Generated ${writer.getFileCount()} file(s)`);
console.log(`Total size: ${writer.getTotalSize()} bytes`);
```

### Custom File Naming

```typescript
const customNaming = {
  getFileName(artifactType: string): string {
    return `generated/${artifactType.toLowerCase()}.ts`;
  }
};

const engine = new CodeGenerationEngine({
  generator,
  formatter,
  emitter,
  writer,
  config: {
    fileNaming: customNaming
  }
});
```

## Integration with CompilerBridge

```typescript
// In CompilerBridge.ts
import { PipelineBuilder } from '../../../core/src/compiler/pipeline/CodeGenerationEngine';
import { MemoryWriter } from '../../../core/src/compiler/writers/MemoryWriter';

class CompilerBridge {
  static async generateTypeScript(manifest: RouteManifest): Promise<CompilerOutput> {
    // Convert manifest to semantic types
    const semanticTypes = this.manifestToSemanticTypes(manifest);

    // Build pipeline
    const writer = new MemoryWriter();
    const engine = PipelineBuilder.create()
      .withGenerator(new TypeScriptGenerator())
      .withFormatter(new TypeScriptFormatter())
      .withEmitter(new TypeScriptEmitter())
      .withWriter(writer)
      .withVerbose(process.env.DEBUG === 'routesync:*')
      .build();

    // Execute pipeline
    const result = await engine.execute(semanticTypes);

    // Extract generated code
    const code = writer.getFile('types/api-read.ts') ?? '';

    return {
      code,
      imports: [],
      interfaces: [],
      metadata: {
        typeCount: result.artifacts.length,
        interfaceCount: 0,
        linesOfCode: code.split('\n').length,
        warnings: result.warnings.map(w => w.message)
      }
    };
  }
}
```

## Error Handling

```typescript
import { PipelineError } from './ICodeGenerationPipeline';

try {
  const result = await engine.execute(input);
  console.log('Success!', result);
} catch (error) {
  if (error instanceof PipelineError) {
    console.error(`Pipeline failed at ${error.stage}:`, error.message);
    if (error.cause) {
      console.error('Caused by:', error.cause);
    }
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Performance Profiling

```typescript
const engine = PipelineBuilder.create()
  .withGenerator(generator)
  .withFormatter(formatter)
  .withEmitter(emitter)
  .withWriter(writer)
  .withConfig({ profiling: true, verbose: true })
  .build();

const result = await engine.execute(input);

// Analyze performance
console.log('Performance Metrics:');
console.log(`  Generation: ${result.metrics.stages.generationMs}ms`);
console.log(`  Formatting: ${result.metrics.stages.formattingMs}ms`);
console.log(`  Emission:   ${result.metrics.stages.emissionMs}ms`);
console.log(`  Writing:    ${result.metrics.stages.writingMs}ms`);
console.log(`  Total:      ${result.metrics.totalTimeMs}ms`);
```

## Skip Stages

```typescript
// Skip formatting for faster builds
const engine = PipelineBuilder.create()
  .withGenerator(generator)
  .withFormatter(formatter)
  .withEmitter(emitter)
  .withWriter(writer)
  .withConfig({
    stages: {
      formatting: false  // Skip formatting stage
    }
  })
  .build();
```

## Testing

### Unit Tests

```typescript
import { describe, it, expect } from 'vitest';
import { MemoryWriter } from '../writers/MemoryWriter';

describe('MyGenerator', () => {
  it('should generate correct code', async () => {
    const writer = new MemoryWriter();
    const engine = PipelineBuilder.create()
      .withGenerator(new MyGenerator())
      .withFormatter(new MyFormatter())
      .withEmitter(new MyEmitter())
      .withWriter(writer)
      .build();

    await engine.execute(testInput);

    const code = writer.getFile('output.ts');
    expect(code).toContain('export interface User');
  });
});
```

### Integration Tests

```typescript
describe('E2E Pipeline', () => {
  it('should generate valid TypeScript', async () => {
    const writer = new MemoryWriter();
    const engine = PipelineBuilder.create()
      .withGenerator(new TypeScriptGenerator())
      .withFormatter(new TypeScriptFormatter())
      .withEmitter(new TypeScriptEmitter())
      .withWriter(writer)
      .build();

    const result = await engine.execute(contractGraph);

    // Verify TypeScript compilation
    const code = writer.getFile('types/api-read.ts');
    const tsProgram = ts.createProgram([code], {});
    const diagnostics = ts.getPreEmitDiagnostics(tsProgram);

    expect(diagnostics).toHaveLength(0);
  });
});
```

## Best Practices

### 1. Use MemoryWriter for Testing
```typescript
// ✅ Good: Fast tests, no I/O
const writer = new MemoryWriter();

// ❌ Bad: Slow tests, filesystem cleanup needed
const writer = new FileWriter({ outputDir: './test-output' });
```

### 2. Enable Verbose Mode in Development
```typescript
const engine = PipelineBuilder.create()
  .withGenerator(generator)
  .withFormatter(formatter)
  .withEmitter(emitter)
  .withWriter(writer)
  .withVerbose(process.env.NODE_ENV === 'development')
  .build();
```

### 3. Handle Errors Gracefully
```typescript
try {
  await engine.execute(input);
} catch (error) {
  if (error instanceof PipelineError) {
    // Log structured error
    console.error({
      stage: error.stage,
      message: error.message,
      cause: error.cause?.message
    });
  }
  throw error;
}
```

### 4. Profile Performance
```typescript
const engine = PipelineBuilder.create()
  .withGenerator(generator)
  .withFormatter(formatter)
  .withEmitter(emitter)
  .withWriter(writer)
  .withConfig({
    profiling: true,
    verbose: process.env.PROFILE === 'true'
  })
  .build();
```

## Architecture Benefits

### ✅ Separation of Concerns
- Generator: IR → AST
- Formatter: AST → Optimized AST
- Emitter: AST → String
- Writer: String → File

### ✅ Testability
- Each component testable in isolation
- MemoryWriter untuk fast tests
- Easy to mock any stage

### ✅ Extensibility
- Add new generators without changing pipeline
- Add new formatters/emitters easily
- Plugin architecture ready

### ✅ Performance
- Stage profiling built-in
- Skip optional stages (formatting)
- Parallel writing possible (future)

### ✅ Type Safety
- Fully typed pipeline
- No `any` types
- Compile-time checks

## API Reference

### CodeGenerationEngine

```typescript
class CodeGenerationEngine<TInput, TTargetNode extends ITargetNode> {
  constructor(deps: {
    generator: IGenerator<TInput, TTargetNode>;
    formatter: IFormatter<TTargetNode>;
    emitter: IEmitter<TTargetNode>;
    writer: IWriter;
    config?: EngineConfig;
  });

  execute(input: TInput): Promise<PipelineResult>;
}
```

### PipelineBuilder

```typescript
class PipelineBuilder<TInput, TTargetNode extends ITargetNode> {
  static create<TInput, TTargetNode>(): PipelineBuilder<TInput, TTargetNode>;
  
  withGenerator(generator: IGenerator): this;
  withFormatter(formatter: IFormatter): this;
  withEmitter(emitter: IEmitter): this;
  withWriter(writer: IWriter): this;
  withConfig(config: EngineConfig): this;
  withVerbose(verbose: boolean): this;
  withOutputDir(dir: string): this;
  
  build(): CodeGenerationEngine<TInput, TTargetNode>;
}
```

### PipelineResult

```typescript
interface PipelineResult {
  readonly artifacts: readonly GeneratedArtifact[];
  readonly warnings: readonly PipelineWarning[];
  readonly metrics: PipelineMetrics;
}
```

### EngineConfig

```typescript
interface EngineConfig {
  readonly stages?: {
    readonly formatting?: boolean;
    readonly validation?: boolean;
    readonly optimization?: boolean;
  };
  readonly profiling?: boolean;
  readonly failFast?: boolean;
  readonly verbose?: boolean;
  readonly outputDir?: string;
  readonly fileNaming?: FileNamingStrategy;
}
```

## Migration from Old Architecture

### Before (Manual Orchestration)
```typescript
// In CompilerBridge
const artifact = pass.run([input]);
const code = artifact[0].code;
await fs.writeFile('output.ts', code);
```

### After (Pipeline Engine)
```typescript
const engine = PipelineBuilder.create()
  .withGenerator(generator)
  .withFormatter(formatter)
  .withEmitter(emitter)
  .withWriter(writer)
  .build();

const result = await engine.execute(input);
```

**Benefits:**
- ✅ Consistent error handling
- ✅ Performance metrics
- ✅ Configurable stages
- ✅ Better testability
- ✅ Type-safe throughout

## Future Enhancements

- [ ] Parallel writing untuk multiple files
- [ ] Incremental compilation support
- [ ] Caching between stages
- [ ] Plugin system
- [ ] Watch mode integration
- [ ] Source map generation
- [ ] Memory profiling
- [ ] Distributed compilation
