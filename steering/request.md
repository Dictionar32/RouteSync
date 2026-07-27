# RouteSync: Panduan Sistem Request & API Definition

**Versi:** Request Types v2  
**Status:** Core Runtime Structure untuk AI Agent  
**Sumber:** `packages/core/src/types/request.ts` (65 baris)

Dokumen ini memberikan panduan lengkap untuk AI agent yang bekerja dengan sistem request dan API definition RouteSync. Ini adalah layer runtime yang menghubungkan generated code dengan HTTP requests yang sebenarnya.

---

## 🎯 ARSITEKTUR REQUEST SYSTEM OVERVIEW

RouteSync menggunakan **Type-Safe Request Architecture** yang mengkonversi route definitions menjadi strongly-typed API calls:

```
Laravel Routes
    ↓
RouteManifest (Compile Time)
    ↓
RouteDefinition (Generated Types)
    ↓
HTTP Request (Runtime)
    ↓
Type-Safe Response
```

### Prinsip Desain Core

1. **Type Safety**: Semua request/response fully typed dari compile time
2. **Schema Validation**: Runtime validation dengan Zod schemas
3. **Transform Pipeline**: Input/output transformation untuk data marshalling
4. **Error Handling**: Type-safe error responses dengan proper typing
5. **Runtime Flexibility**: Support untuk caching, retry, abort signals

---

## 🏗️ KOMPONEN ARSITEKTUR UTAMA

### 1. HttpMethod — HTTP Verb Types

**Tujuan:** Strong typing untuk HTTP methods yang didukung

```typescript
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
```

**📋 Method Usage Patterns:**
```typescript
// Route classification berdasarkan HTTP method
const methodIntents = {
  GET: "retrieve",      // Fetch data
  POST: "create",       // Create new resource  
  PUT: "replace",       // Complete replacement
  PATCH: "update",      // Partial update
  DELETE: "destroy"     // Remove resource
};
```

### 2. RouteTransform — Data Transformation Pipeline

**Tujuan:** Transform data antara frontend dan backend format

```typescript
export type RouteTransform = (value: any) => any

export interface RouteTransformMap {
  params?: RouteTransform;    // URL parameters (e.g., {id} -> number)
  query?: RouteTransform;     // Query string (?filter=name)
  body?: RouteTransform;      // Request body (JSON payload)
  request?: RouteTransform;   // Complete request transformation
  response?: RouteTransform;  // Response transformation (snake_case → camelCase)
}

export type RouteMapper = RouteTransform | RouteTransformMap
```

**📋 Transform Examples:**
```typescript
// Single transform function
const simpleTransform: RouteTransform = (data) => ({
  ...data,
  created_at: new Date(data.created_at)
});

// Multi-layer transform map
const complexTransform: RouteTransformMap = {
  params: (params) => ({
    id: parseInt(params.id, 10)
  }),
  
  body: (body) => ({
    // Frontend camelCase → Backend snake_case
    first_name: body.firstName,
    last_name: body.lastName,
    email_address: body.email
  }),
  
  response: (response) => ({
    // Backend snake_case → Frontend camelCase
    id: response.id,
    firstName: response.first_name,
    lastName: response.last_name,
    email: response.email_address,
    createdAt: new Date(response.created_at)
  })
};
```

### 3. RouteSchema — Validation & Parsing System

**Tujuan:** Runtime validation dengan schema parsers (biasanya Zod)

```typescript
export interface RouteParserSchema {
  parse?: RouteTransform;     // Strict parsing (throws on error)
  safeParse?: RouteTransform; // Safe parsing (returns result object)
}

export interface RouteSchemaMap {
  params?: RouteSchemaValue;   // URL parameter validation
  query?: RouteSchemaValue;    // Query string validation
  body?: RouteSchemaValue;     // Request body validation
  request?: RouteSchemaValue;  // Complete request validation
  response?: RouteSchemaValue; // Response validation
}

export type RouteSchemaValue = RouteTransform | RouteParserSchema
export type RouteSchema = RouteSchemaValue | RouteSchemaMap
```

**📋 Schema Usage Examples:**
```typescript
// Zod-based validation schemas
import { z } from 'zod';

const userSchemas: RouteSchemaMap = {
  params: {
    parse: z.object({
      id: z.string().transform(val => parseInt(val, 10))
    }).parse,
    safeParse: z.object({
      id: z.string().transform(val => parseInt(val, 10))
    }).safeParse
  },
  
  body: {
    parse: z.object({
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      email: z.string().email()
    }).parse
  },
  
  response: {
    parse: z.object({
      id: z.number(),
      firstName: z.string(),
      lastName: z.string(),
      email: z.string(),
      createdAt: z.string().datetime()
    }).parse
  }
};

// Usage dalam request pipeline
function validateRequest(data: unknown, schema: RouteParserSchema) {
  if (schema.safeParse) {
    const result = schema.safeParse(data);
    if (!result.success) {
      throw new ValidationError(result.error);
    }
    return result.data;
  }
  
  if (schema.parse) {
    return schema.parse(data); // Throws on validation error
  }
  
  return data; // No validation
}
```

### 4. RequestOptions — HTTP Configuration

**Tujuan:** Konfigurasi runtime untuk HTTP requests

```typescript
export interface RequestOptions {
  params?: Record<string, any>;    // URL path parameters
  headers?: Record<string, string>; // HTTP headers
  timeout?: number;                // Request timeout (ms)
  signal?: AbortSignal;           // Abort controller signal
}
```

**📋 RequestOptions Usage:**
```typescript
// Basic request dengan parameters
const basicRequest: RequestOptions = {
  params: { id: 123 },
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  timeout: 5000
};

// Request dengan abort signal untuk cancellation
const abortController = new AbortController();
const cancellableRequest: RequestOptions = {
  signal: abortController.signal,
  timeout: 10000
};

// Cancel request setelah 3 detik
setTimeout(() => {
  abortController.abort();
}, 3000);
```

### 5. RouteDefinition — Complete Route Specification

**Tujuan:** Definisi lengkap untuk satu API endpoint dengan semua metadata

```typescript
export interface RouteDefinition<
  TResponse = unknown, 
  TParams = unknown, 
  TBody = unknown, 
  TMethod extends HttpMethod = HttpMethod
> {
  method: TMethod;                    // HTTP method
  path: string | Function;            // URL path atau path builder
  auth?: boolean;                     // Requires authentication
  schema?: RouteSchema;               // Validation schemas
  responseSchema?: ResponseSchema<any>; // Response parser
  contract?: {                        // Contract validation
    body?: (payload: unknown) => any;
    response?: ResponseSchema<any> | ((payload: unknown) => any);
  };
  mapper?: RouteMapper;               // Data transformations
  headers?: Record<string, string>;   // Default headers
  cache?: unknown;                    // Cache configuration
  retry?: unknown;                    // Retry configuration
  body?: Record<string, any>;         // Default body
  params?: Record<string, any>;       // Default params
  query?: Record<string, any>;        // Default query
  
  // Phantom types untuk TypeScript inference
  _typeResponse?: TResponse;          // Response type inference
  _typeParams?: TParams;              // Parameters type inference  
  _typeBody?: TBody;                  // Body type inference
}
```

**📋 RouteDefinition Examples:**
```typescript
// Simple GET route
const getUserRoute: RouteDefinition<User, { id: number }> = {
  method: 'GET',
  path: '/users/{id}',
  auth: true,
  schema: {
    params: userParamsSchema,
    response: userResponseSchema
  },
  mapper: {
    params: (params) => ({ id: parseInt(params.id, 10) }),
    response: (response) => mapUserResponse(response)
  }
};

// Complex POST route dengan validation
const createUserRoute: RouteDefinition<User, {}, CreateUserPayload> = {
  method: 'POST',
  path: '/users',
  auth: true,
  contract: {
    body: createUserPayloadSchema.parse,
    response: userResponseSchema
  },
  mapper: {
    body: (body) => ({
      first_name: body.firstName,
      last_name: body.lastName,
      email_address: body.email
    }),
    response: mapUserResponse
  },
  headers: {
    'Content-Type': 'application/json'
  },
  retry: {
    attempts: 3,
    delay: 1000
  }
};

// Function-based path builder
const dynamicRoute: RouteDefinition<any, { userId: number; postId: number }> = {
  method: 'GET',
  path: (params) => `/users/${params.userId}/posts/${params.postId}`,
  auth: true
};
```

### 6. ApiDefinition — Complete API Specification

**Tujuan:** Container untuk semua routes dalam satu API, terorganisir berdasarkan group dan action

```typescript
export interface ApiDefinition {
  [group: string]: {
    [action: string]: RouteDefinition<any, any, any>
  }
}
```

**📋 ApiDefinition Structure:**
```typescript
// Structured API definition
const myApi: ApiDefinition = {
  // User management group
  users: {
    index: {
      method: 'GET',
      path: '/users',
      auth: true,
      schema: { 
        query: listUsersQuerySchema,
        response: userListResponseSchema 
      }
    },
    
    show: {
      method: 'GET', 
      path: '/users/{id}',
      auth: true,
      schema: {
        params: userParamsSchema,
        response: userResponseSchema
      }
    },
    
    store: {
      method: 'POST',
      path: '/users', 
      auth: true,
      contract: {
        body: createUserPayloadSchema.parse,
        response: userResponseSchema
      }
    },
    
    update: {
      method: 'PUT',
      path: '/users/{id}',
      auth: true,
      contract: {
        body: updateUserPayloadSchema.parse,
        response: userResponseSchema
      }
    },
    
    destroy: {
      method: 'DELETE',
      path: '/users/{id}',
      auth: true,
      schema: {
        params: userParamsSchema
      }
    }
  },
  
  // Posts management group  
  posts: {
    index: { /* ... */ },
    show: { /* ... */ },
    store: { /* ... */ }
  },
  
  // Authentication group
  auth: {
    login: {
      method: 'POST',
      path: '/auth/login',
      auth: false,
      contract: {
        body: loginPayloadSchema.parse,
        response: authResponseSchema
      }
    },
    
    logout: {
      method: 'POST', 
      path: '/auth/logout',
      auth: true
    },
    
    refresh: {
      method: 'POST',
      path: '/auth/refresh',
      auth: true,
      contract: {
        response: authResponseSchema
      }
    }
  }
};
```

---

## 🚨 POLA PENGGUNAAN KRITIS

### ✅ Implementasi yang Benar

**1. Type-Safe Route Definition:**
```typescript
// BENAR: Proper generic typing
interface CreateUserParams {}
interface CreateUserBody {
  firstName: string;
  lastName: string;
  email: string;
}
interface UserResponse {
  id: number;
  firstName: string; 
  lastName: string;
  email: string;
  createdAt: Date;
}

const createUser: RouteDefinition<UserResponse, CreateUserParams, CreateUserBody> = {
  method: 'POST',
  path: '/users',
  auth: true,
  contract: {
    body: (payload) => createUserSchema.parse(payload),
    response: (response) => userResponseSchema.parse(response)
  }
};
```

**2. Layered Transform Pipeline:**
```typescript
// BENAR: Separate concerns dalam transforms
const userTransforms: RouteTransformMap = {
  // Input transformation (frontend → backend)
  body: (frontendData) => ({
    first_name: frontendData.firstName,
    last_name: frontendData.lastName,
    email_address: frontendData.email,
    date_of_birth: frontendData.dateOfBirth?.toISOString()
  }),
  
  // Output transformation (backend → frontend)
  response: (backendData) => ({
    id: backendData.id,
    firstName: backendData.first_name,
    lastName: backendData.last_name, 
    email: backendData.email_address,
    dateOfBirth: backendData.date_of_birth ? new Date(backendData.date_of_birth) : null,
    createdAt: new Date(backendData.created_at),
    updatedAt: new Date(backendData.updated_at)
  })
};
```

**3. Defensive Schema Validation:**
```typescript
// BENAR: Comprehensive validation dengan error handling
function createValidatedRoute<T, P, B>(
  definition: RouteDefinition<T, P, B>
): RouteDefinition<T, P, B> {
  return {
    ...definition,
    contract: {
      body: definition.contract?.body ? (payload) => {
        try {
          return definition.contract!.body!(payload);
        } catch (error) {
          throw new ValidationError(`Body validation failed: ${error.message}`);
        }
      } : undefined,
      
      response: definition.contract?.response ? (response) => {
        try {
          if (typeof definition.contract!.response === 'function') {
            return definition.contract!.response(response);
          }
          return definition.contract!.response!.parse(response);
        } catch (error) {
          throw new ValidationError(`Response validation failed: ${error.message}`);
        }
      } : undefined
    }
  };
}
```

**4. Dynamic Path Building:**
```typescript
// BENAR: Type-safe dynamic paths
function buildTypedPath<P extends Record<string, any>>(
  template: string,
  params: P
): string {
  return template.replace(/{(\w+)}/g, (match, key) => {
    const value = params[key];
    if (value === undefined || value === null) {
      throw new Error(`Missing parameter: ${key}`);
    }
    return encodeURIComponent(String(value));
  });
}

const userRoute: RouteDefinition<User, { id: number }> = {
  method: 'GET',
  path: (params) => buildTypedPath('/users/{id}', params),
  auth: true
};
```

### ❌ Anti-Pattern yang Harus Dihindari

**1. Untyped Route Definitions:**
```typescript
// SALAH: Losing type information
const badRoute: RouteDefinition = {  // No generics!
  method: 'POST',
  path: '/users',
  contract: {
    body: (data) => data,  // No validation!
    response: (data) => data  // No transformation!
  }
};

// BENAR: Proper typing
const goodRoute: RouteDefinition<UserResponse, {}, CreateUserBody> = {
  method: 'POST', 
  path: '/users',
  contract: {
    body: createUserSchema.parse,
    response: userResponseSchema.parse
  }
};
```

**2. Inline Schema Definitions:**
```typescript
// SALAH: Schema definitions scattered
const badRoute: RouteDefinition<any, any, any> = {
  method: 'POST',
  path: '/users',
  contract: {
    body: (data) => {
      // Inline validation logic - hard to test and reuse
      if (!data.firstName) throw new Error('firstName required');
      if (!data.email.includes('@')) throw new Error('invalid email');
      return data;
    }
  }
};

// BENAR: Centralized, reusable schemas
const userPayloadSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email()
});

const goodRoute: RouteDefinition<UserResponse, {}, CreateUserPayload> = {
  method: 'POST',
  path: '/users', 
  contract: {
    body: userPayloadSchema.parse
  }
};
```

**3. Mixed Transformation Concerns:**
```typescript
// SALAH: Mixed validation + transformation
const badTransform: RouteTransform = (data) => {
  // Validation mixed with transformation
  if (!data.email) throw new Error('email required');
  
  return {
    first_name: data.firstName,
    email_address: data.email,
    created_at: new Date().toISOString() // Side effects!
  };
};

// BENAR: Separate validation dan transformation
const validation = userPayloadSchema.parse;
const transformation: RouteTransform = (validatedData) => ({
  first_name: validatedData.firstName,
  last_name: validatedData.lastName,
  email_address: validatedData.email
});
```
---

## 🔍 DEBUGGING & ERROR HANDLING

### Request Pipeline Debugging

**Debug Transform Pipeline:**
```typescript
// Debug transforms dengan logging
function debugTransform<T>(
  name: string,
  transform: RouteTransform
): RouteTransform {
  return (data: T) => {
    console.group(`Transform: ${name}`);
    console.log('Input:', data);
    
    try {
      const result = transform(data);
      console.log('Output:', result);
      return result;
    } catch (error) {
      console.error('Error:', error);
      throw error;
    } finally {
      console.groupEnd();
    }
  };
}

// Usage
const debuggedRoute: RouteDefinition<User, {}, CreateUserBody> = {
  method: 'POST',
  path: '/users',
  mapper: {
    body: debugTransform('UserBody', userBodyTransform),
    response: debugTransform('UserResponse', userResponseTransform)
  }
};
```

**Schema Validation Error Handling:**
```typescript
// Comprehensive error handling untuk schema validation
function safeSchemaValidation<T>(
  schema: RouteParserSchema,
  data: unknown,
  context: string
): T {
  if (schema.safeParse) {
    const result = schema.safeParse(data);
    if (!result.success) {
      throw new ValidationError(
        `${context} validation failed`,
        result.error.errors
      );
    }
    return result.data;
  }
  
  if (schema.parse) {
    try {
      return schema.parse(data);
    } catch (error) {
      throw new ValidationError(
        `${context} validation failed`,
        error instanceof Error ? error.message : String(error)
      );
    }
  }
  
  return data as T;
}

// Custom error classes untuk better debugging
class ValidationError extends Error {
  constructor(
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

class TransformError extends Error {
  constructor(
    message: string,
    public stage: 'request' | 'response',
    public originalData?: any
  ) {
    super(message);
    this.name = 'TransformError';
  }
}
```

### Request Tracing

```typescript
// Request tracing untuk debugging
interface RequestTrace {
  routeGroup: string;
  routeAction: string;
  method: HttpMethod;
  path: string;
  timestamp: Date;
  duration?: number;
  success: boolean;
  error?: Error;
}

function traceableRoute<T, P, B>(
  group: string,
  action: string,
  definition: RouteDefinition<T, P, B>
): RouteDefinition<T, P, B> {
  return {
    ...definition,
    contract: {
      ...definition.contract,
      response: definition.contract?.response ? (response) => {
        const trace: RequestTrace = {
          routeGroup: group,
          routeAction: action, 
          method: definition.method,
          path: typeof definition.path === 'string' 
            ? definition.path 
            : '[dynamic]',
          timestamp: new Date(),
          success: true
        };
        
        try {
          const result = typeof definition.contract!.response === 'function'
            ? definition.contract!.response(response)
            : definition.contract!.response!.parse(response);
          
          // Log successful request
          console.log(`✅ ${group}.${action}`, trace);
          return result;
        } catch (error) {
          trace.success = false;
          trace.error = error as Error;
          console.error(`❌ ${group}.${action}`, trace);
          throw error;
        }
      } : undefined
    }
  };
}
```

---

## 🎯 INTEGRASI DENGAN PIPELINE ROUTESYNC

### Code Generation Integration

**Generated Route Definitions:**
```typescript
// Generated dari RouteSync compiler
export const generatedApi: ApiDefinition = {
  users: {
    index: {
      method: 'GET',
      path: '/users',
      auth: true,
      schema: {
        query: {
          parse: UsersIndexQuerySchema.parse,
          safeParse: UsersIndexQuerySchema.safeParse
        },
        response: {
          parse: UsersIndexResponseSchema.parse
        }
      },
      mapper: {
        response: toUsersIndexRead
      }
    },
    
    show: {
      method: 'GET',
      path: '/users/{id}',
      auth: true,
      schema: {
        params: {
          parse: UsersShowParamsSchema.parse
        },
        response: {
          parse: UsersShowResponseSchema.parse
        }
      },
      mapper: {
        params: (params) => ({ id: parseInt(params.id, 10) }),
        response: toUserRead
      }
    }
    
    // ... generated routes
  }
};
```

### Runtime Client Integration

**HTTP Client Implementation:**
```typescript
// Base HTTP client yang consume RouteDefinition
class ApiClient {
  constructor(
    private baseURL: string,
    private defaultHeaders: Record<string, string> = {}
  ) {}
  
  async request<T, P, B>(
    definition: RouteDefinition<T, P, B>,
    options: RequestOptions & { 
      params?: P;
      body?: B;
      query?: Record<string, any>;
    } = {}
  ): Promise<T> {
    // 1. Build URL
    let url = typeof definition.path === 'string' 
      ? definition.path 
      : definition.path(options.params || {});
    
    // Replace path parameters
    if (options.params && typeof definition.path === 'string') {
      url = this.replacePlaceholders(url, options.params);
    }
    
    // 2. Prepare request data
    let requestBody = options.body;
    if (requestBody && definition.mapper?.body) {
      requestBody = definition.mapper.body(requestBody);
    }
    
    // 3. Validate request
    if (definition.contract?.body && requestBody) {
      requestBody = definition.contract.body(requestBody);
    }
    
    // 4. Make HTTP request
    const response = await fetch(`${this.baseURL}${url}`, {
      method: definition.method,
      headers: {
        ...this.defaultHeaders,
        ...definition.headers,
        ...options.headers
      },
      body: requestBody ? JSON.stringify(requestBody) : undefined,
      signal: options.signal
    });
    
    if (!response.ok) {
      throw new ApiError(response.status, await response.text());
    }
    
    // 5. Parse response
    let responseData = await response.json();
    
    // 6. Transform response
    if (definition.mapper?.response) {
      responseData = definition.mapper.response(responseData);
    }
    
    // 7. Validate response
    if (definition.contract?.response) {
      responseData = typeof definition.contract.response === 'function'
        ? definition.contract.response(responseData)
        : definition.contract.response.parse(responseData);
    }
    
    return responseData;
  }
  
  private replacePlaceholders(path: string, params: Record<string, any>): string {
    return path.replace(/{(\w+)}/g, (match, key) => {
      const value = params[key];
      if (value === undefined || value === null) {
        throw new Error(`Missing path parameter: ${key}`);
      }
      return encodeURIComponent(String(value));
    });
  }
}

// Usage dengan generated API
const client = new ApiClient('https://api.example.com');

// Type-safe API calls
const user = await client.request(generatedApi.users.show, {
  params: { id: 123 }  // Typed as { id: number }
});

const users = await client.request(generatedApi.users.index, {
  query: { limit: 10, offset: 0 }  // Typed query parameters
});
```

### React Query Integration

**Hooks Generation dari Route Definitions:**
```typescript
// Generated React Query hooks
export function useUsersShow(params: { id: number }) {
  return useQuery({
    queryKey: ['users', 'show', params],
    queryFn: () => client.request(generatedApi.users.show, { params })
  });
}

export function useUsersCreate() {
  return useMutation({
    mutationFn: (body: CreateUserPayload) => 
      client.request(generatedApi.users.store, { body })
  });
}

// Usage di React components
function UserProfile({ userId }: { userId: number }) {
  const { data: user, isLoading, error } = useUsersShow({ id: userId });
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      <h1>{user.firstName} {user.lastName}</h1>
      <p>Email: {user.email}</p>
      <p>Created: {user.createdAt.toLocaleDateString()}</p>
    </div>
  );
}
```

---

## 📋 EXTENSION GUIDELINES

### Menambah Request Options Baru

**1. Extend RequestOptions Interface:**
```typescript
interface RequestOptions {
  // ... existing fields
  retryConfig?: {
    attempts: number;
    delay: number;
    backoff?: 'linear' | 'exponential';
  };
  cacheStrategy?: 'no-cache' | 'cache-first' | 'network-first';
}
```

**2. Update HTTP Client untuk Handle Options Baru:**
```typescript
class ApiClient {
  async request<T, P, B>(
    definition: RouteDefinition<T, P, B>,
    options: RequestOptions & { params?: P; body?: B } = {}
  ): Promise<T> {
    // Handle retry logic
    if (options.retryConfig) {
      return this.requestWithRetry(definition, options);
    }
    
    // Handle caching
    if (options.cacheStrategy) {
      return this.requestWithCache(definition, options);
    }
    
    // Normal request flow
    return this.makeRequest(definition, options);
  }
}
```

### Menambah Transform Types Baru

**1. Extend RouteTransformMap:**
```typescript
interface RouteTransformMap {
  // ... existing transforms
  headers?: RouteTransform;     // Transform request headers
  metadata?: RouteTransform;    // Transform request metadata
  error?: RouteTransform;       // Transform error responses
}
```

**2. Update Pipeline untuk Handle Transform Baru:**
```typescript
// Error transform untuk consistent error handling
const errorTransform: RouteTransform = (error) => {
  if (error.status === 422) {
    return {
      type: 'validation',
      message: error.message,
      fields: error.errors
    };
  }
  
  return {
    type: 'generic',
    message: error.message || 'An error occurred'
  };
};
```

---

## 🚀 PERFORMANCE & BEST PRACTICES

### Request Optimization

**Batch Request Processing:**
```typescript
// Batch multiple requests untuk efficiency
class BatchApiClient extends ApiClient {
  private pendingRequests = new Map<string, Promise<any>>();
  
  async batchRequest<T, P, B>(
    definition: RouteDefinition<T, P, B>,
    options: RequestOptions & { params?: P; body?: B } = {}
  ): Promise<T> {
    const key = this.generateRequestKey(definition, options);
    
    // Return existing promise jika request sudah pending
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)!;
    }
    
    // Create new request
    const promise = this.request(definition, options)
      .finally(() => {
        this.pendingRequests.delete(key);
      });
    
    this.pendingRequests.set(key, promise);
    return promise;
  }
}
```

**Response Caching:**
```typescript
// Simple response caching
class CachedApiClient extends ApiClient {
  private cache = new Map<string, { data: any; expiry: number }>();
  
  async cachedRequest<T, P, B>(
    definition: RouteDefinition<T, P, B>,
    options: RequestOptions & { 
      params?: P; 
      body?: B;
      cacheTTL?: number;
    } = {}
  ): Promise<T> {
    // Only cache GET requests
    if (definition.method !== 'GET') {
      return this.request(definition, options);
    }
    
    const key = this.generateRequestKey(definition, options);
    const cached = this.cache.get(key);
    
    // Return cached data jika masih valid
    if (cached && cached.expiry > Date.now()) {
      return cached.data;
    }
    
    // Fetch fresh data
    const data = await this.request(definition, options);
    const ttl = options.cacheTTL || 300000; // 5 minutes default
    
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttl
    });
    
    return data;
  }
}
```

---

## 🎯 METRICS & SUCCESS INDICATORS

### Request Performance Metrics

| Metric | Baik | Warning | Kritis |
|--------|------|---------|--------|
| Request Success Rate | >98% | 95-98% | <95% |
| Average Response Time | <200ms | 200-500ms | >500ms |
| Schema Validation Time | <10ms | 10-50ms | >50ms |
| Transform Processing Time | <5ms | 5-20ms | >20ms |
| Cache Hit Ratio | >70% | 50-70% | <50% |

### Type Safety Indicators

- **Schema Coverage**: 100% endpoints punya validation schema
- **Transform Coverage**: 100% routes punya proper transformers
- **Error Handling**: 100% requests punya error boundary
- **Type Inference**: Zero `any` types dalam route definitions
- **Runtime Safety**: Zero runtime type errors dengan proper validation

---

## 🔗 KOMPONEN TERKAIT

### Dependencies (Upstream)
- `packages/core/src/types/route.ts` - Route manifest structures
- `packages/core/src/types/semantic.ts` - Semantic type system
- `zod` - Runtime schema validation library

### Consumers (Downstream)
- `packages/cli/src/generators/` - Code generation dari request definitions
- `packages/react/` - React Query hooks generation
- `packages/vue/` - Vue Query composables generation
- `packages/sdk/` - HTTP client implementation

### Configuration Files
- `packages/core/tsconfig.json` - TypeScript configuration
- `vitest.config.ts` - Test configuration untuk request types

---

**Sistem request ini adalah runtime foundation dari RouteSync's type-safe HTTP communication. Memahami struktur ini essential untuk menjaga type safety dan performance dalam API interactions.**

**Last Updated:** Juli 26, 2026  
**Request Types Version:** v2  
**Status:** Production dengan active development