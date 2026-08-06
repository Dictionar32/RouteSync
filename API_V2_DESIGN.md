# API v2 Design: Resource-Centric dengan Types Eksplisit

## 🎯 Rancangan Baru: api.ts dengan Struktur Per-Resource

Berdasarkan analisis Engine.Fix.md §27, berikut adalah implementasi rancangan baru yang mengatasi masalah struktur flat per-route menjadi grouped per-resource dengan types eksplisit.

## 📊 Target Structure

### **Rancangan Baru:**
```typescript
export const api = defineApi({
  produk: {
    endpoint({
      types: {
        index: typeOf<ProdukIndex>(),   
        show: typeOf<ProdukShow>(),
        createForm: typeOf<ProdukForm["Create"]>(),
        updateForm: typeOf<ProdukForm["Update"]>(),
        createPayload: typeOf<ProdukApiCreate>(),
        updatePayload: typeOf<ProdukApiUpdate>(),
        response: typeOf<ProdukApiResponse>(),
      },
      contract: {
        index: {
          response: validateProdukListResponse,
        },
        show: {
          response: validateProdukItemResponse,
        },
        create: {
          body: validateProdukCreatePayload,
          response: validateProdukItemResponse,
        },
        update: {
          body: validateProdukUpdatePayload,
          response: validateProdukItemResponse,
        },
      },
      mapper: {
        index: {
          response: toProdukListRead,
        },
        show: {
          response: toProdukRead,
        },
        create: {
          body: toApiProdukCreate,
          response: toProdukRead,
        },
        update: {
          body: toApiProdukUpdate,
          response: toProdukRead,
        },
      }
    })
  }
})
```

## 🏗️ Perbedaan dari Struktur Lama

### **Struktur Lama (Flat per-route):**
```typescript
// Masalah: Duplikasi untuk operasi yang sama
export const api = {
  profile: {
    put: endpoint({ contract: {}, mapper: {} }),
    patch: endpoint({ contract: {}, mapper: {} }) // Duplikasi!
  }
}
```

### **Struktur Baru (Grouped per-resource):**
```typescript
// Solusi: Satu endpoint per resource, nested per action
export const api = {
  profile: {
    endpoint({
      contract: {
        update: { /* PUT/PATCH disatukan */ }
      }
    })
  }
}
```

## 🎯 Benefits yang Dicapai

### 1. **Menyelesaikan Inkonsistensi Action Naming (§24.3)**
- ✅ **Problem**: `profile.put` vs `profile.patch` untuk operasi sama
- ✅ **Solution**: `profile.contract.update` - satu action semantik

### 2. **Types Eksplisit (§27.1)**
- ✅ **Problem**: Types implisit dari return function
- ✅ **Solution**: Explicit type declaration dengan `typeOf<T>()`

### 3. **Konsistensi Cross-Block (§27.6)**
- ✅ **Problem**: Naming berbeda di types/contract/mapper
- ✅ **Solution**: Action keys konsisten (index, show, create, update)

### 4. **Body/Response Opsional Natural (§27.6)**
- ✅ **Problem**: Conditional detection `hasBodyContract`
- ✅ **Solution**: Explicit per action (GET = no body, POST = body+response)

## 🛠️ Implementation dalam Contract IR

Mari saya implementasikan struktur ini dalam ContractEmitter:

```typescript
// ContractEmitter enhancement untuk resource-grouped output
interface ResourceEndpoint {
  resourceName: string
  actions: {
    [actionName: string]: {
      method: HttpMethod
      path: string
      hasBody: boolean
      hasResponse: boolean
    }
  }
}

class EnhancedContractEmitter extends ContractEmitter {
  emit(ir: ContractIR): GeneratedFile[] {
    const resourceEndpoints = this.groupByResource(ir)
    
    const content = this.generateResourceGroupedAPI(resourceEndpoints)
    
    return [{
      path: 'api/api.ts',
      content,
      metadata: {
        emitter: 'EnhancedContractEmitter',
        generatedAt: new Date().toISOString(),
        dependencies: []
      }
    }]
  }

  private groupByResource(ir: ContractIR): ResourceEndpoint[] {
    const grouped = new Map<string, ResourceEndpoint>()
    
    for (const endpoint of ir.endpoints) {
      const resourceName = this.extractResourceName(endpoint.id)
      const actionName = this.mapMethodToAction(endpoint.method)
      
      if (!grouped.has(resourceName)) {
        grouped.set(resourceName, {
          resourceName,
          actions: {}
        })
      }
      
      grouped.get(resourceName)!.actions[actionName] = {
        method: endpoint.method,
        path: endpoint.path,
        hasBody: ['POST', 'PUT', 'PATCH'].includes(endpoint.method),
        hasResponse: true
      }
    }
    
    return Array.from(grouped.values())
  }

  private mapMethodToAction(method: HttpMethod): string {
    const ACTION_MAP = {
      'GET': 'index', // or 'show' based on path pattern
      'POST': 'create',
      'PUT': 'update',
      'PATCH': 'update',
      'DELETE': 'destroy'
    }
    return ACTION_MAP[method] || method.toLowerCase()
  }

  private generateResourceGroupedAPI(resources: ResourceEndpoint[]): string {
    return `// Auto-generated API with resource-grouped endpoints

import { defineApi, endpoint, typeOf } from './runtime'

// Type imports
${this.generateTypeImports()}

export const api = defineApi({
${resources.map(resource => this.generateResourceBlock(resource)).join(',\n')}
})

export type ApiClient = typeof api
`
  }

  private generateResourceBlock(resource: ResourceEndpoint): string {
    return `  ${resource.resourceName}: {
    endpoint({
      types: {
${this.generateTypesBlock(resource)}
      },
      contract: {
${this.generateContractBlock(resource)}
      },
      mapper: {
${this.generateMapperBlock(resource)}
      }
    })
  }`
  }

  private generateTypesBlock(resource: ResourceEndpoint): string {
    const types: string[] = []
    
    if (resource.actions.index) {
      types.push(`        index: typeOf<${resource.resourceName}Index>(),`)
    }
    if (resource.actions.show) {
      types.push(`        show: typeOf<${resource.resourceName}Show>(),`)
    }
    if (resource.actions.create) {
      types.push(`        createForm: typeOf<${resource.resourceName}Form["Create"]>(),`)
      types.push(`        createPayload: typeOf<${resource.resourceName}ApiCreate>(),`)
    }
    if (resource.actions.update) {
      types.push(`        updateForm: typeOf<${resource.resourceName}Form["Update"]>(),`)
      types.push(`        updatePayload: typeOf<${resource.resourceName}ApiUpdate>(),`)
    }
    types.push(`        response: typeOf<${resource.resourceName}ApiResponse>(),`)
    
    return types.join('\n')
  }

  private generateContractBlock(resource: ResourceEndpoint): string {
    const contracts: string[] = []
    
    for (const [actionName, action] of Object.entries(resource.actions)) {
      const actionBlock: string[] = []
      
      if (action.hasBody) {
        actionBlock.push(`          body: validate${resource.resourceName}${this.capitalize(actionName)}Payload,`)
      }
      if (action.hasResponse) {
        actionBlock.push(`          response: validate${resource.resourceName}${this.capitalize(actionName)}Response,`)
      }
      
      contracts.push(`        ${actionName}: {
${actionBlock.join('\n')}
        },`)
    }
    
    return contracts.join('\n')
  }

  private generateMapperBlock(resource: ResourceEndpoint): string {
    const mappers: string[] = []
    
    for (const [actionName, action] of Object.entries(resource.actions)) {
      const mapperBlock: string[] = []
      
      if (action.hasBody) {
        mapperBlock.push(`          body: toApi${resource.resourceName}${this.capitalize(actionName)},`)
      }
      if (action.hasResponse) {
        mapperBlock.push(`          response: to${resource.resourceName}Read,`)
      }
      
      mappers.push(`        ${actionName}: {
${mapperBlock.join('\n')}
        },`)
    }
    
    return mappers.join('\n')
  }
}
```

## 🚀 Runtime Helper Implementation

```typescript
// runtime.ts - Helper functions for new API structure

export function defineApi<T>(config: T): T {
  return config
}

export function endpoint<T>(config: T): T {
  return config
}

export const typeOf = <T>(): T => undefined as unknown as T

// Usage type extraction helpers
export type ExtractTypes<T> = T extends { endpoint(config: { types: infer U }): any } ? U : never
export type ExtractContract<T> = T extends { endpoint(config: { contract: infer U }): any } ? U : never
export type ExtractMapper<T> = T extends { endpoint(config: { mapper: infer U }): any } ? U : never
```

## 📊 Comparison: Lama vs Baru

| Aspect | Struktur Lama | Struktur Baru |
|--------|---------------|---------------|
| **Grouping** | Per HTTP method | Per resource/action |
| **Type Declaration** | Implicit (dari return type) | Explicit (dalam types block) |
| **Action Naming** | HTTP method (put/patch) | Semantic action (update) |
| **Consistency** | Manual sync required | Single action key vocabulary |
| **Duplication** | profile.put + profile.patch | profile.contract.update |
| **Body/Response** | Conditional detection | Natural per action |

## 🎯 Generator Impact

### **SDKGenerator Restructuring Needed:**

1. **Loop Structure**: 
   - **Old**: `for (route of routes)` → one endpoint per iteration
   - **New**: `for (resource of resources)` → collect all actions per resource

2. **Action Mapping**:
   - **Old**: Direct HTTP method usage
   - **New**: Consistent semantic action mapping (POST→create, PUT/PATCH→update)

3. **Output Structure**:
   - **Old**: Flat object with method keys
   - **New**: Nested object with types/contract/mapper blocks

### **ContractIR Enhancement Needed:**

```typescript
interface EnhancedContractIR extends ContractIR {
  // Group endpoints by resource for easier generation
  resourceGroups: {
    [resourceName: string]: {
      actions: {
        [actionName: string]: {
          endpoint: EndpointIR
          types: ResourceTypeDefinition
          contracts: ValidationDefinition
          mappers: TransformDefinition
        }
      }
    }
  }
}
```

## 🏆 Benefits Delivered

### 1. **Developer Experience:**
```typescript
// Clean, consistent API usage
const users = await api.users.contract.index.response(data)
const user = await api.users.mapper.show.response(rawUser)
const form = api.users.types.createForm // Type-safe form structure
```

### 2. **Architecture Benefits:**
- ✅ **Single Action Vocabulary**: index/show/create/update across all blocks
- ✅ **Type Safety**: Explicit type declarations with `typeOf<T>()`
- ✅ **No Duplication**: One action per semantic operation
- ✅ **Natural Structure**: Body optional for GET, required for POST/PUT

### 3. **Generator Simplification:**
- ✅ **Consistent Naming**: One `ACTION_MAP` used across all generators
- ✅ **Resource Grouping**: Natural fit with ContractIR resource structure
- ✅ **Extensible**: Easy to add new actions or modify existing ones

## 🚀 Implementation Roadmap

1. **Phase 1**: Enhance ContractIR with resource grouping
2. **Phase 2**: Implement EnhancedContractEmitter
3. **Phase 3**: Update SDKGenerator for new structure
4. **Phase 4**: Create runtime helpers (defineApi, typeOf)
5. **Phase 5**: Migration guide for existing usage

**This design represents a significant architectural improvement that aligns perfectly with the Contract IR Architecture's resource-centric approach!**