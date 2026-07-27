# RouteSync: Panduan Sistem TypeScript Emission

**Versi:** TSEmit v1  
**Status:** Core Code Generation Infrastructure  
**Sumber:** `packages/core/src/types/emit.ts` (64 baris)

Dokumen ini memberikan panduan lengkap untuk AI agent yang bekerja dengan sistem TypeScript emission RouteSync. Ini adalah **structured code generation** system yang mengonversi IR (Intermediate Representation) menjadi TypeScript code yang type-safe dan terstruktur.

---

## 🎯 ARSITEKTUR EMISSION SYSTEM OVERVIEW

### Motivasi: Mengapa Structured Emission?

**MASALAH LAMA (String Concatenation):**
```typescript
// ❌ String-based generation (error-prone)
function generateInterface(name: string, fields: any[]): string {
  let code = `export interface ${name} {\n`;
  fields.forEach(field => {
    code += `  ${field.name}${field.optional ? '?' : ''}: ${field.type};\n`;
  });
  code += `}\n`;
  return code;  // Syntax errors, formatting issues, escape problems
}
```

**SOLUSI BARU (Structured AST):**
```typescript
// ✅ AST-based generation (type-safe, composable)
const interfaceAST: TSInterface = {
  name: 'User',
  fields: [
    { name: 'id', type: 'number', optional: false },
    { name: 'name', type: 'string', optional: false },
    { name: 'email', type: 'string', optional: true }
  ],
  isExported: true
};
// Renderer handles formatting, syntax, escaping automatically
```

### Prinsip Desain Core

1. **AST-First Generation**: Semua code generation melalui structured AST
2. **Composable Units**: File units dapat di-combine dan di-reorder tanpa konflik
3. **Import Management**: Automatic import resolution dan deduplication
4. **Type Safety**: Strong typing dari input IR sampai output TypeScript
5. **Stable IDs**: Consistent output untuk incremental compilation

---

## 🏗️ KOMPONEN ARSITEKTUR UTAMA

### 1. TSEmitModule — Module-Level Container

**Tujuan:** Root container untuk semua emission artifacts dalam satu route/domain

```typescript
interface TSEmitModule {
  routeName: string;    // 'users', 'orders', 'products' 
  files: TSFileUnit[];  // Multiple files per module
}
```

**📋 Contoh TSEmitModule:**
```typescript
const usersModule: TSEmitModule = {
  routeName: 'users',
  files: [
    {
      filePath: 'src/api/types/users.ts',
      imports: [{ from: 'zod', named: ['z'] }],
      interfaces: [userInterface, userListInterface],
      functions: [],
      zodSchemas: [userSchema],
      exports: [{ name: 'User', type: 'named' }]
    },
    {
      filePath: 'src/api/hooks/users.ts', 
      imports: [{ from: '@tanstack/react-query', named: ['useQuery', 'useMutation'] }],
      interfaces: [],
      functions: [useUsersQuery, useCreateUser],
      zodSchemas: [],
      exports: [{ name: 'useUsersQuery', type: 'named' }]
    }
  ]
};
```

### 2. TSFileUnit — File-Level Artifact

**Tujuan:** Representasi structured dari satu TypeScript file

```typescript
interface TSFileUnit {
  filePath: string;           // Output file path
  imports: ImportStatement[]; // All imports untuk file ini
  zodSchemas: TSConst[];      // Zod schema constants
  interfaces: TSInterface[];  // TypeScript interfaces
  functions: TSFunction[];    // Functions (hooks, utilities)
  exports: TSExport[];        // Explicit exports
}
```

**Key Features:**
- **Automatic Import Resolution**: System otomatis resolve imports berdasarkan usage
- **Dependency Ordering**: Interfaces before functions, schemas before dependent types
- **Export Management**: Explicit control atas apa yang di-export

### 3. ImportStatement — Import Management

```typescript
interface ImportStatement {
  from: string;      // Module path ('zod', '@tanstack/react-query', './types')
  named?: string[];  // Named imports ['z', 'ZodSchema']
  default?: string;  // Default import name
  isType?: boolean;  // Type-only import (import type)
}
```

**📋 Import Examples:**
```typescript
// import { z, ZodSchema } from 'zod'
const zodImport: ImportStatement = {
  from: 'zod',
  named: ['z', 'ZodSchema']
};

// import type { User } from './types'
const typeImport: ImportStatement = {
  from: './types',
  named: ['User'],
  isType: true
};

// import React from 'react'
const defaultImport: ImportStatement = {
  from: 'react',
  default: 'React'
};

// import { useQuery, type UseQueryOptions } from '@tanstack/react-query'
const mixedImport: ImportStatement = {
  from: '@tanstack/react-query',
  named: ['useQuery', 'UseQueryOptions'],
  isType: false  // Mixed runtime + type import
};
```

### 4. TSInterface — Type Definition

```typescript
interface TSInterface {
  name: string;               // Interface name
  fields: TSInterfaceField[]; // Interface fields
  isExported?: boolean;       // Export dari module
}

interface TSInterfaceField {
  name: string;      // Field name
  type: string;      // TypeScript type string
  optional?: boolean; // Optional field (?)
}
```

**📋 Interface Examples:**
```typescript
// Simple interface
const userInterface: TSInterface = {
  name: 'User',
  fields: [
    { name: 'id', type: 'number' },
    { name: 'name', type: 'string' },
    { name: 'email', type: 'string', optional: true }
  ],
  isExported: true
};
// Generates: export interface User { id: number; name: string; email?: string; }

// Complex nested interface
const orderInterface: TSInterface = {
  name: 'Order',
  fields: [
    { name: 'id', type: 'number' },
    { name: 'user', type: 'User' },
    { name: 'items', type: 'OrderItem[]' },
    { name: 'metadata', type: 'Record<string, unknown>', optional: true }
  ],
  isExported: true
};
// Generates: export interface Order { id: number; user: User; items: OrderItem[]; metadata?: Record<string, unknown>; }
```

### 5. TSFunction — Function Definition

```typescript
interface TSFunction {
  name: string;        // Function name
  type: "query" | "mutation" | "fetcher";  // Function category
  key: string[];       // Cache key untuk stability
  params: string;      // Parameter string
  returnType: string;  // Return type
  body: string[];      // Function body lines
  stableId: string;    // Unique ID untuk deduplication
  isExported?: boolean;
  isAsync?: boolean;
}
```

**Function Categories:**
- **query**: Read operations (useQuery hooks)
- **mutation**: Write operations (useMutation hooks)
- **fetcher**: Low-level API calls (axios/fetch wrappers)

**📋 Function Examples:**
```typescript
// Query hook
const useUsersQuery: TSFunction = {
  name: 'useUsersQuery',
  type: 'query',
  key: ['users', 'list'],
  params: 'params?: UsersQueryParams',
  returnType: 'UseQueryResult<User[], Error>',
  body: [
    'return useQuery({',
    '  queryKey: [\'users\', \'list\', params],',
    '  queryFn: () => api.users.list(params),',
    '  ...options',
    '});'
  ],
  stableId: 'users-list-query',
  isExported: true,
  isAsync: false
};

// Mutation hook
const useCreateUser: TSFunction = {
  name: 'useCreateUser',
  type: 'mutation',
  key: ['users', 'create'],
  params: 'options?: UseMutationOptions<User, Error, CreateUserPayload>',
  returnType: 'UseMutationResult<User, Error, CreateUserPayload>',
  body: [
    'return useMutation({',
    '  mutationFn: (payload: CreateUserPayload) => api.users.create(payload),',
    '  onSuccess: () => {',
    '    queryClient.invalidateQueries({ queryKey: [\'users\'] });',
    '  },',
    '  ...options',
    '});'
  ],
  stableId: 'users-create-mutation',
  isExported: true,
  isAsync: false
};

// Fetcher function
const fetchUser: TSFunction = {
  name: 'fetchUser',
  type: 'fetcher',
  key: ['users', 'show'],
  params: 'id: number',
  returnType: 'Promise<User>',
  body: [
    'const response = await httpClient.get(`/users/${id}`);',
    'return UserSchema.parse(response.data);'
  ],
  stableId: 'users-show-fetcher',
  isExported: false,
  isAsync: true
};
```
### 6. TSConst — Constant Definition (Zod Schemas)

```typescript
interface TSConst {
  name: string;           // Constant name
  value: string[];        // Value lines (multiline support)
  isExported?: boolean;   // Export dari module
  isType?: boolean;       // Type assertion
  typeAnnotation?: string; // Explicit type annotation
}
```

**Primary Use Case:** Zod schema generation

**📋 TSConst Examples:**
```typescript
// Simple Zod schema
const userSchema: TSConst = {
  name: 'UserSchema',
  value: [
    'z.object({',
    '  id: z.number(),',
    '  name: z.string(),',
    '  email: z.string().email(),',
    '  created_at: z.string().datetime()',
    '})'
  ],
  isExported: true,
  typeAnnotation: 'z.ZodSchema<User>'
};

// Complex nested schema
const orderSchema: TSConst = {
  name: 'OrderSchema', 
  value: [
    'z.object({',
    '  id: z.number(),',
    '  user: UserSchema,',
    '  items: z.array(OrderItemSchema),',
    '  total: z.number().positive(),',
    '  metadata: z.record(z.unknown()).optional()',
    '})'
  ],
  isExported: true,
  typeAnnotation: 'z.ZodSchema<Order>'
};

// String constant
const apiBaseUrl: TSConst = {
  name: 'API_BASE_URL',
  value: ['"https://api.example.com/v1"'],
  isExported: true,
  typeAnnotation: 'string'
};
```

### 7. TSExport — Export Management

```typescript
interface TSExport {
  name: string;              // Export name
  type: "named" | "default"; // Export type
}
```
**📋 Export Examples:**
```typescript
// Named exports
const namedExports: TSExport[] = [
  { name: 'User', type: 'named' },
  { name: 'UserSchema', type: 'named' },
  { name: 'useUsersQuery', type: 'named' }
];
// Generates: export { User, UserSchema, useUsersQuery };

// Default export
const defaultExport: TSExport = {
  name: 'apiClient',
  type: 'default'
};
// Generates: export default apiClient;
```

---

## 🔄 EMISSION PIPELINE FLOW

### 1. IR → TSEmitModule Conversion

```
RouteManifest/NormalizedManifest
    ↓
Generator Logic (ZodTierGenerator, HookGenerator, etc)
    ↓
TSEmitModule Construction
    ├─ Create TSFileUnit untuk setiap output file
    ├─ Populate imports berdasarkan dependencies
    ├─ Generate interfaces dari IR types
    ├─ Generate functions dari route operations
    ├─ Generate constants (Zod schemas)
    └─ Specify exports
    ↓
TSRenderer
    ├─ Resolve import dependencies
    ├─ Order declarations (imports → constants → interfaces → functions)
    ├─ Format code (prettier/custom formatter)
    └─ Write ke filesystem
    ↓
Generated TypeScript Files
```

### 2. Dependency Resolution Strategy

**Import Dependency Chain:**
1. **Scan Usage**: Analyze semua references dalam functions/interfaces
2. **Resolve Modules**: Determine mana yang external vs internal
3. **Deduplicate**: Merge duplicate imports dari same module
4. **Order**: Type imports first, then runtime imports

**📋 Contoh Dependency Resolution:**
```typescript
// Generator creates TSFileUnit dengan references
const hooksFile: TSFileUnit = {
  filePath: 'src/api/hooks/users.ts',
  // Functions reference external types
  functions: [
    {
      name: 'useUsersQuery',
      returnType: 'UseQueryResult<User[], Error>',  // References: UseQueryResult, User, Error
      body: ['return useQuery({ ... })']           // References: useQuery
    }
  ],
  interfaces: [],
  zodSchemas: [],
  // System automatically resolves imports
  imports: [], // Will be populated by resolver
  exports: [{ name: 'useUsersQuery', type: 'named' }]
};

// After dependency resolution:
const resolvedFile: TSFileUnit = {
  ...hooksFile,
  imports: [
    { from: '@tanstack/react-query', named: ['useQuery', 'UseQueryResult'] },
    { from: '../types/users', named: ['User'], isType: true }
    // Error is built-in, no import needed
  ]
};
```

### 3. Code Ordering & Structure

**Standard File Structure:**
```typescript
// 1. Type-only imports
import type { User } from './types';

// 2. Runtime imports  
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';

// 3. Constants (Zod schemas)
export const UserSchema = z.object({ ... });

// 4. Interfaces
export interface UserQueryParams {
  limit?: number;
  offset?: number;
}

// 5. Functions
export function useUsersQuery(params?: UserQueryParams) {
  return useQuery({ ... });
}
```

---

## 🚨 POLA PENGGUNAAN KRITIS

### ✅ Implementasi yang Benar

**1. Structured AST Construction:**
```typescript
// BENAR: Build TSFileUnit secara structured
function createUserTypesFile(): TSFileUnit {
  const userInterface: TSInterface = {
    name: 'User',
    fields: [
      { name: 'id', type: 'number' },
      { name: 'name', type: 'string' },
      { name: 'email', type: 'string', optional: true }
    ],
    isExported: true
  };
  
  const userSchema: TSConst = {
    name: 'UserSchema',
    value: [
      'z.object({',
      '  id: z.number(),',
      '  name: z.string(),', 
      '  email: z.string().email().optional()',
      '})'
    ],
    isExported: true,
    typeAnnotation: 'z.ZodSchema<User>'
  };
  
  return {
    filePath: 'src/api/types/users.ts',
    imports: [{ from: 'zod', named: ['z'] }],
    interfaces: [userInterface],
    zodSchemas: [userSchema],
    functions: [],
    exports: [
      { name: 'User', type: 'named' },
      { name: 'UserSchema', type: 'named' }
    ]
  };
}
```

**2. Stable ID Management:**
```typescript
// BENAR: Generate stable IDs untuk consistency
function generateStableId(routeName: string, operation: string, type: string): string {
  return `${routeName}-${operation}-${type}`;
}

const queryFunction: TSFunction = {
  name: 'useUsersQuery',
  type: 'query',
  stableId: generateStableId('users', 'list', 'query'),  // 'users-list-query'
  // ... other properties
};

// Benefits:
// - Consistent naming across generations
// - Deduplication tanpa hash collisions  
// - Incremental compilation support
```
**3. Immutable Construction & Composition:**
```typescript
// BENAR: Immutable TSFileUnit construction
function addInterfaceToFile(file: TSFileUnit, newInterface: TSInterface): TSFileUnit {
  return {
    ...file,
    interfaces: [...file.interfaces, newInterface],
    exports: [...file.exports, { name: newInterface.name, type: 'named' }]
  };
}

// BENAR: Compose multiple generators
function combineEmitModules(modules: TSEmitModule[]): TSFileUnit[] {
  const fileMap = new Map<string, TSFileUnit>();
  
  modules.forEach(module => {
    module.files.forEach(file => {
      const existing = fileMap.get(file.filePath);
      if (existing) {
        // Merge file units
        fileMap.set(file.filePath, mergeFileUnits(existing, file));
      } else {
        fileMap.set(file.filePath, file);
      }
    });
  });
  
  return Array.from(fileMap.values());
}
```

### ❌ Anti-Pattern yang Harus Dihindari

**1. String Concatenation Generation:**
```typescript
// SALAH: String-based code generation
function badInterfaceGeneration(name: string, fields: any[]): string {
  let code = `export interface ${name} {\n`;
  fields.forEach(field => {
    code += `  ${field.name}: ${field.type};\n`;  // Syntax errors, escaping issues
  });
  code += `}\n`;
  return code;
}

// BENAR: AST-based generation dengan TSInterface
function goodInterfaceGeneration(name: string, fields: TSInterfaceField[]): TSInterface {
  return {
    name,
    fields,
    isExported: true
  };
}
```
**2. Manual Import Management:**
```typescript
// SALAH: Manual import strings
function badFileGeneration(): string {
  return `
import { z } from 'zod';
import { User } from './types';  // Manual, error-prone, could be wrong path

export const UserSchema = z.object({ ... });
  `;
}

// BENAR: Structured imports dengan dependency resolution
function goodFileGeneration(): TSFileUnit {
  return {
    filePath: 'src/schemas/user.ts',
    imports: [
      { from: 'zod', named: ['z'] },
      { from: './types', named: ['User'], isType: true }
    ],
    // System handles import resolution automatically
    zodSchemas: [{ name: 'UserSchema', value: ['z.object({ ... })'], isExported: true }],
    interfaces: [],
    functions: [],
    exports: [{ name: 'UserSchema', type: 'named' }]
  };
}
```

**3. Mutable File Units:**
```typescript
// SALAH: Mutating file units
function badFileModification(file: TSFileUnit, newFunction: TSFunction): void {
  file.functions.push(newFunction);  // JANGAN! Mutation
  file.exports.push({ name: newFunction.name, type: 'named' });  // JANGAN!
}

// BENAR: Immutable modification
function goodFileModification(file: TSFileUnit, newFunction: TSFunction): TSFileUnit {
  return {
    ...file,
    functions: [...file.functions, newFunction],
    exports: [...file.exports, { name: newFunction.name, type: 'named' }]
  };
}
```

---

## 🔍 DEBUGGING & VALIDATION

### TSEmitModule Validation

```typescript
function validateTSEmitModule(module: TSEmitModule): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check module structure
  if (!module.routeName) {
    errors.push('TSEmitModule must have routeName');
  }
  
  if (!module.files || module.files.length === 0) {
    warnings.push('TSEmitModule has no files');
  }
  
  // Validate each file
  module.files.forEach((file, index) => {
    const fileErrors = validateTSFileUnit(file);
    errors.push(...fileErrors.map(e => `File ${index}: ${e}`));
  });
  
  return { valid: errors.length === 0, errors, warnings };
}

function validateTSFileUnit(file: TSFileUnit): string[] {
  const errors: string[] = [];
  
  // Check required fields
  if (!file.filePath) {
    errors.push('TSFileUnit must have filePath');
  }
  
  // Check export consistency
  file.exports.forEach(exp => {
    const hasDeclaration = 
      file.interfaces.some(i => i.name === exp.name && i.isExported) ||
      file.functions.some(f => f.name === exp.name && f.isExported) ||
      file.zodSchemas.some(z => z.name === exp.name && z.isExported);
    
    if (!hasDeclaration) {
      errors.push(`Export '${exp.name}' has no corresponding declaration`);
    }
  });
  
  return errors;
}
```
### Dependency Analysis Tools

```typescript
// Analyze import dependencies
function analyzeImportDependencies(file: TSFileUnit): DependencyAnalysis {
  const usedTypes = new Set<string>();
  const usedFunctions = new Set<string>();
  
  // Scan interfaces untuk type usage
  file.interfaces.forEach(iface => {
    iface.fields.forEach(field => {
      extractTypesFromString(field.type).forEach(type => {
        usedTypes.add(type);
      });
    });
  });
  
  // Scan functions untuk function/type usage
  file.functions.forEach(func => {
    extractTypesFromString(func.returnType).forEach(type => {
      usedTypes.add(type);
    });
    
    func.body.forEach(line => {
      extractFunctionCallsFromString(line).forEach(call => {
        usedFunctions.add(call);
      });
    });
  });
  
  return {
    requiredTypes: Array.from(usedTypes),
    requiredFunctions: Array.from(usedFunctions),
    missingImports: findMissingImports(file.imports, usedTypes, usedFunctions)
  };
}

// Find circular dependencies
function findCircularDependencies(modules: TSEmitModule[]): CircularDependency[] {
  const graph = buildDependencyGraph(modules);
  return detectCycles(graph);
}
```

### Code Generation Preview

```typescript
// Preview generated code sebelum write ke filesystem
function previewTSFileUnit(file: TSFileUnit): string {
  const renderer = new TSRenderer();
  return renderer.render(file);
}

// Example output:
const preview = previewTSFileUnit(userTypesFile);
console.log(preview);
/*
import type { User } from './types';
import { z } from 'zod';

export const UserSchema: z.ZodSchema<User> = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email().optional()
});

export interface UserQueryParams {
  limit?: number;
  offset?: number;
}
*/
```

---

## 🎯 INTEGRASI DENGAN PIPELINE ROUTESYNC

### Generator Integration Points

**ZodTierGenerator → TSEmitModule:**
```typescript
class ZodTierGenerator {
  static generateEmitModule(manifest: NormalizedManifest): TSEmitModule {
    const contractFile = this.generateContractFile(manifest);
    const typesFile = this.generateTypesFile(manifest);
    const mappersFile = this.generateMappersFile(manifest);
    
    return {
      routeName: 'zod-tier',
      files: [contractFile, typesFile, mappersFile]
    };
  }
  
  private static generateContractFile(manifest: NormalizedManifest): TSFileUnit {
    const zodSchemas: TSConst[] = manifest.routes.map(route => 
      this.routeToZodSchema(route)
    );
    
    return {
      filePath: 'src/api/contract/api-contract.ts',
      imports: [{ from: 'zod', named: ['z'] }],
      zodSchemas,
      interfaces: [],
      functions: [],
      exports: zodSchemas.map(schema => ({ name: schema.name, type: 'named' }))
    };
  }
}
```
**HookGenerator → TSEmitModule:**
```typescript
class HookGenerator {
  static generateEmitModule(manifest: NormalizedManifest): TSEmitModule {
    const hooksFile = this.generateHooksFile(manifest);
    
    return {
      routeName: 'hooks',
      files: [hooksFile]
    };
  }
  
  private static generateHooksFile(manifest: NormalizedManifest): TSFileUnit {
    const queryFunctions = manifest.routes
      .filter(route => route.method === 'GET')
      .map(route => this.routeToQueryHook(route));
      
    const mutationFunctions = manifest.routes
      .filter(route => ['POST', 'PUT', 'PATCH', 'DELETE'].includes(route.method))
      .map(route => this.routeToMutationHook(route));
    
    return {
      filePath: 'src/api/hooks.ts',
      imports: [
        { from: '@tanstack/react-query', named: ['useQuery', 'useMutation', 'UseQueryResult', 'UseMutationResult'] },
        { from: './api', named: ['api'] },
        { from: './types', named: ['User', 'CreateUserPayload'], isType: true }
      ],
      interfaces: [],
      functions: [...queryFunctions, ...mutationFunctions],
      zodSchemas: [],
      exports: [...queryFunctions, ...mutationFunctions].map(func => ({ name: func.name, type: 'named' }))
    };
  }
}
```

### Renderer Integration

**TSRenderer Implementation:**
```typescript
class TSRenderer {
  render(file: TSFileUnit): string {
    const sections: string[] = [];
    
    // 1. Render imports
    if (file.imports.length > 0) {
      sections.push(this.renderImports(file.imports));
    }
    
    // 2. Render constants (Zod schemas)
    if (file.zodSchemas.length > 0) {
      sections.push(this.renderConstants(file.zodSchemas));
    }
    
    // 3. Render interfaces
    if (file.interfaces.length > 0) {
      sections.push(this.renderInterfaces(file.interfaces));
    }
    
    // 4. Render functions
    if (file.functions.length > 0) {
      sections.push(this.renderFunctions(file.functions));
    }
    
    return sections.join('\n\n');
  }
  
  private renderImports(imports: ImportStatement[]): string {
    const typeImports = imports.filter(imp => imp.isType);
    const runtimeImports = imports.filter(imp => !imp.isType);
    
    const typeLines = typeImports.map(imp => this.renderImportStatement(imp, true));
    const runtimeLines = runtimeImports.map(imp => this.renderImportStatement(imp, false));
    
    return [...typeLines, ...runtimeLines].join('\n');
  }
  
  private renderImportStatement(imp: ImportStatement, isTypeOnly: boolean): string {
    const typePrefix = isTypeOnly ? 'import type ' : 'import ';
    const defaultPart = imp.default ? imp.default : '';
    const namedPart = imp.named && imp.named.length > 0 ? `{ ${imp.named.join(', ')} }` : '';
    
    const importList = [defaultPart, namedPart].filter(Boolean).join(', ');
    
    return `${typePrefix}${importList} from '${imp.from}';`;
  }
}
```

---

## 📋 EXTENSION GUIDELINES

### Adding New TSFileUnit Components

**1. Extend Component Union:**
```typescript
// Add new component type
interface TSEnum {
  name: string;
  values: { name: string; value?: string | number }[];
  isExported?: boolean;
}

// Update TSFileUnit
interface TSFileUnit {
  // ... existing fields
  enums: TSEnum[];  // New component
}
```

**2. Update Renderer:**
```typescript
class TSRenderer {
  render(file: TSFileUnit): string {
    const sections: string[] = [];
    
    // ... existing sections
    
    // Add enum rendering
    if (file.enums.length > 0) {
      sections.push(this.renderEnums(file.enums));
    }
    
    return sections.join('\n\n');
  }
  
  private renderEnums(enums: TSEnum[]): string {
    return enums.map(enumDef => this.renderEnum(enumDef)).join('\n\n');
  }
  
  private renderEnum(enumDef: TSEnum): string {
    const exportPrefix = enumDef.isExported ? 'export ' : '';
    const values = enumDef.values.map(v => 
      v.value !== undefined ? `  ${v.name} = ${JSON.stringify(v.value)}` : `  ${v.name}`
    ).join(',\n');
    
    return `${exportPrefix}enum ${enumDef.name} {\n${values}\n}`;
  }
}
```
### Adding New Function Types

**1. Extend TSFunction.type Union:**
```typescript
interface TSFunction {
  // ... existing fields
  type: "query" | "mutation" | "fetcher" | "validator" | "transformer";  // Add new types
}
```

**2. Update Generator Logic:**
```typescript
function generateValidatorFunction(field: FieldNode): TSFunction {
  return {
    name: `validate${field.name}`,
    type: 'validator',
    key: ['validation', field.name],
    params: `value: unknown`,
    returnType: `${field.type}`,
    body: [
      `const result = ${field.name}Schema.safeParse(value);`,
      `if (!result.success) {`,
      `  throw new ValidationError(result.error);`,
      `}`,
      `return result.data;`
    ],
    stableId: `${field.name}-validator`,
    isExported: true,
    isAsync: false
  };
}
```

---

## 🚀 PERFORMANCE & OPTIMIZATION

### Memory Management

**Structural Sharing:**
```typescript
// Share common interfaces across modules
const commonInterfaces = new Map<string, TSInterface>();

function createOrReuseInterface(name: string, fields: TSInterfaceField[]): TSInterface {
  const hash = computeInterfaceHash(name, fields);
  
  if (commonInterfaces.has(hash)) {
    return commonInterfaces.get(hash)!;
  }
  
  const newInterface: TSInterface = { name, fields, isExported: true };
  commonInterfaces.set(hash, newInterface);
  return newInterface;
}
```

**Incremental Compilation Support:**
```typescript
// Cache compiled modules by stable hash
const moduleCache = new Map<string, TSEmitModule>();

function generateOrCacheModule(input: NormalizedManifest, generator: string): TSEmitModule {
  const inputHash = computeManifestHash(input);
  const cacheKey = `${generator}:${inputHash}`;
  
  if (moduleCache.has(cacheKey)) {
    return moduleCache.get(cacheKey)!;
  }
  
  const generated = runGenerator(input, generator);
  moduleCache.set(cacheKey, generated);
  return generated;
}
```

### Code Generation Optimization

**Template Reuse:**
```typescript
// Reuse common function templates
const HOOK_TEMPLATES = {
  query: (name: string, key: string[], fetcher: string) => ({
    name: `use${name}Query`,
    type: 'query' as const,
    key,
    body: [
      'return useQuery({',
      `  queryKey: ${JSON.stringify(key)},`,
      `  queryFn: ${fetcher},`,
      '  ...options',
      '});'
    ]
  }),
  
  mutation: (name: string, mutationFn: string, invalidateKey: string[]) => ({
    name: `use${name}Mutation`,
    type: 'mutation' as const,
    key: [name.toLowerCase()],
    body: [
      'return useMutation({',
      `  mutationFn: ${mutationFn},`,
      '  onSuccess: () => {',
      `    queryClient.invalidateQueries({ queryKey: ${JSON.stringify(invalidateKey)} });`,
      '  },',
      '  ...options',
      '});'
    ]
  })
};
```

---

## 🎯 METRICS & SUCCESS INDICATORS

### Code Quality Metrics

| Metric | Target | Purpose |
|--------|--------|---------|
| Import Accuracy | 100% | No missing/unused imports |
| Export Consistency | 100% | All exports have declarations |
| Type Safety | 100% | No `any` types di generated code |
| Stable ID Uniqueness | 100% | No duplicate stableIds |
| Syntax Validity | 100% | Generated code compiles tanpa error |

### Performance Metrics

| Metric | Target | Purpose |
|--------|--------|---------|
| Generation Time | <500ms per module | Fast iteration |
| Memory Usage | <50MB peak | Efficient compilation |
| Cache Hit Ratio | >80% | Incremental compilation |
| File Size | <100KB per file | Bundle optimization |

### Developer Experience Metrics

- **Code Readability**: Generated code indistinguishable dari hand-written
- **Import Organization**: Type imports separated dari runtime imports
- **Consistent Formatting**: Prettier-compatible output
- **Error Messages**: Clear validation errors dengan source context
- **Incremental Updates**: Only changed files regenerated

---

## 🔗 KOMPONEN TERKAIT

### Dependencies (Upstream)
- `packages/core/src/types/field.ts` - FieldNode unified representation
- `packages/core/src/types/semantic.ts` - Semantic resolution system
- `packages/cli/src/generators/` - Generator implementations

### Consumers (Downstream)  
- `packages/cli/src/generators/layers/` - Layer-specific emitters
- `TSRenderer` (not yet implemented) - Code renderer
- File system writers - Output ke disk

### Configuration Files
- `packages/core/tsconfig.json` - TypeScript configuration
- `prettier.config.js` - Code formatting rules
- `vitest.config.ts` - Test configuration untuk emission tests

---

**Sistem TSEmit adalah foundation untuk structured code generation di RouteSync. Memahami komponen ini essential untuk maintaining type-safe, consistent, dan high-quality generated code.**

**Last Updated:** Juli 26, 2026  
**TSEmit Version:** v1  
**Status:** Core Infrastructure dengan active development