# Plugin API Specification

RouteSync menyediakan plugin API yang memungkinkan pengembang memperluas fungsionalitas extractor, optimizer, dan generator.

## Antarmuka Daur Hidup Plugin (Plugin Lifecycle)

```typescript
export interface CompilerContext {
  ast: unknown;
  graph: {
    nodes: Map<string, unknown>;
    edges: unknown[];
  };
  diagnostics: unknown[];
  config: Record<string, unknown>;
}

export interface CompilerPlugin {
  name: string;
  version: string;
  
  setup?(context: CompilerContext): Promise<void>;
  
  beforeExtract?(context: CompilerContext): void;
  afterExtract?(context: CompilerContext): void;
  
  beforeSemantic?(context: CompilerContext): void;
  afterSemantic?(context: CompilerContext): void;
  
  beforeOptimize?(context: CompilerContext): void;
  afterOptimize?(context: CompilerContext): void;
  
  beforeBackend?(context: CompilerContext): void;
  afterBackend?(context: CompilerContext): void;
}
```
