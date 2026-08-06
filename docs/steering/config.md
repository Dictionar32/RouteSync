# RouteSync: Panduan Sistem Configuration

**Versi:** Config v1  
**Status:** Runtime Configuration Infrastructure  
**Sumber:** `packages/core/src/types/config.ts` (27 baris)

Dokumen ini memberikan panduan lengkap untuk AI agent yang bekerja dengan sistem configuration RouteSync. Ini adalah **runtime configuration** system yang mengatur behavior dari generated SDK, HTTP client, authentication, dan error handling.

---

## 🎯 ARSITEKTUR CONFIGURATION SYSTEM OVERVIEW

### Motivasi: Mengapa Runtime Configuration?

**MASALAH LAMA (Hardcoded Behavior):**
```typescript
// ❌ Hardcoded configuration di generated code
class ApiClient {
  private baseURL = 'https://api.example.com';  // Cannot change
  private timeout = 5000;                       // Fixed timeout
  
  async request(path: string) {
    // No retry, no error handling, no customization
    return fetch(`${this.baseURL}${path}`);
  }
}
```

**SOLUSI BARU (Runtime Configuration):**
```typescript
// ✅ Configurable behavior via ServiceConfig
const apiClient = new ApiClient({
  baseURL: process.env.API_BASE_URL || 'https://api.example.com',
  timeout: 10000,
  retry: { attempts: 3, delay: 1000 },
  validateResponse: true,
  onValidationError: (error, context) => {
    console.error('API validation failed:', error);
    Sentry.captureException(error, { extra: context });
  },
  toast: {
    success: (message) => toast.success(message),
    error: (message) => toast.error(message)
  }
});
```

### Prinsip Desain Core

1. **Runtime Flexibility**: Semua behavior dapat di-configure at runtime
2. **Environment Awareness**: Support untuk different environments (dev/staging/prod)
3. **Error Handling**: Comprehensive error handling dengan custom callbacks
4. **Authentication Support**: Multiple auth strategies (Bearer, Basic, API Key)
5. **Developer Experience**: Built-in retry, caching, dan validation dengan sensible defaults
---

## 🏗️ KOMPONEN ARSITEKTUR UTAMA

### 1. ServiceConfig — Primary Configuration Interface

```typescript
interface ServiceConfig {
  baseURL: string;                    // API base URL
  token?: string;                     // Authentication token
  headers?: Record<string, string>;   // Default headers
  timeout?: number;                   // Request timeout (ms)
  retry?: RetryConfig;                // Retry configuration
  cache?: boolean;                    // Enable response caching
  validateResponse?: boolean;         // Enable Zod validation
  onValidationError?: ValidationErrorHandler;  // Error callback
  toast?: ToastConfig;                // UI notifications
}
```

**Core Features:**
- **HTTP Configuration**: baseURL, headers, timeout
- **Authentication**: token-based auth dengan flexible strategies
- **Error Handling**: custom callbacks untuk validation errors
- **UX Integration**: toast notifications untuk success/error states
- **Performance**: caching dan retry mechanisms

**📋 ServiceConfig Examples:**
```typescript
// Production configuration
const prodConfig: ServiceConfig = {
  baseURL: 'https://api.production.com/v1',
  token: process.env.REACT_APP_API_TOKEN,
  timeout: 15000,  // 15 seconds
  retry: {
    attempts: 3,
    delay: 1000,
    statusCodes: [408, 429, 502, 503, 504]  // Retry pada specific errors
  },
  cache: true,
  validateResponse: true,
  onValidationError: (error, context) => {
    Sentry.captureException(error, { extra: context });
    console.error('API validation failed:', error);
  },
  toast: {
    success: (message) => toast.success(message),
    error: (message) => toast.error(message)
  }
};

// Development configuration  
const devConfig: ServiceConfig = {
  baseURL: 'http://localhost:8000/api',
  timeout: 30000,  // Longer timeout untuk development
  retry: { attempts: 1 },  // No retry untuk faster debugging
  cache: false,    // Disable cache untuk fresh data
  validateResponse: true,
  onValidationError: (error, context) => {
    console.group('🚨 Validation Error');
    console.error('Error:', error);
    console.log('Context:', context);
    console.groupEnd();
  }
};

// Testing configuration
const testConfig: ServiceConfig = {
  baseURL: 'http://localhost:3001/mock-api',
  timeout: 5000,
  retry: { attempts: 0 },    // No retry dalam tests
  cache: false,
  validateResponse: false,   // Disable untuk faster tests
  headers: {
    'X-Test-Mode': 'true'
  }
};
```
### 2. RetryConfig — Retry Strategy Configuration

```typescript
interface RetryConfig {
  attempts: number;        // Maximum retry attempts
  delay?: number;          // Delay between retries (ms)
  statusCodes?: number[];  // HTTP status codes untuk retry
}
```

**Retry Strategies:**
- **Linear Backoff**: Fixed delay antar retries
- **Exponential Backoff**: Increasing delay (implemented di HTTP client)
- **Status-Based**: Only retry pada specific HTTP status codes
- **Circuit Breaker**: Automatic disable retry setelah consecutive failures

**📋 RetryConfig Examples:**
```typescript
// Aggressive retry untuk network issues
const aggressiveRetry: RetryConfig = {
  attempts: 5,
  delay: 500,
  statusCodes: [408, 429, 500, 502, 503, 504]
};

// Conservative retry untuk user actions
const conservativeRetry: RetryConfig = {
  attempts: 2,
  delay: 1000,
  statusCodes: [502, 503, 504]  // Only server errors
};

// No retry untuk critical operations
const noRetry: RetryConfig = {
  attempts: 0
};

// Custom retry dengan exponential backoff (implemented di client)
const exponentialRetry: RetryConfig = {
  attempts: 3,
  delay: 1000,  // Base delay, client implements exponential
  statusCodes: [429, 502, 503, 504]
};
```

**Retry Logic Implementation:**
```typescript
async function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= config.attempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Check if error is retryable
      if (attempt === config.attempts) break;  // Last attempt
      if (!isRetryableError(error, config.statusCodes)) break;
      
      // Calculate delay (exponential backoff)
      const delay = config.delay ? config.delay * Math.pow(2, attempt) : 1000;
      await sleep(delay);
    }
  }
  
  throw lastError!;
}
```

### 3. AuthConfig — Authentication Configuration

```typescript
interface AuthConfig {
  type: 'bearer' | 'basic' | 'api-key';
  token?: string;           // Bearer token
  apiKey?: string;          // API key value
  apiKeyHeader?: string;    // API key header name
}
```

**Authentication Strategies:**
**📋 AuthConfig Examples:**
```typescript
// Bearer token authentication (OAuth, JWT)
const bearerAuth: AuthConfig = {
  type: 'bearer',
  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
};

// Basic authentication (username:password)
const basicAuth: AuthConfig = {
  type: 'basic',
  token: btoa('username:password')  // Base64 encoded
};

// API key dalam custom header
const apiKeyAuth: AuthConfig = {
  type: 'api-key',
  apiKey: 'sk_live_1234567890abcdef',
  apiKeyHeader: 'X-API-Key'
};

// API key dalam standard Authorization header
const apiKeyAuthStandard: AuthConfig = {
  type: 'api-key',
  apiKey: 'api_key_123456',
  apiKeyHeader: 'Authorization'  // Will be formatted as "Bearer api_key_123456"
};
```

**Auth Header Generation:**
```typescript
function generateAuthHeader(authConfig: AuthConfig): Record<string, string> {
  switch (authConfig.type) {
    case 'bearer':
      return {
        'Authorization': `Bearer ${authConfig.token}`
      };
      
    case 'basic':
      return {
        'Authorization': `Basic ${authConfig.token}`
      };
      
    case 'api-key':
      const headerName = authConfig.apiKeyHeader || 'X-API-Key';
      const headerValue = headerName === 'Authorization'
        ? `Bearer ${authConfig.apiKey}`
        : authConfig.apiKey!;
        
      return {
        [headerName]: headerValue
      };
      
    default:
      return {};
  }
}
```

### 4. ValidationErrorHandler — Error Handling Callback

```typescript
type ValidationErrorHandler = (
  error: unknown,
  context: ValidationErrorContext
) => void;

interface ValidationErrorContext {
  endpoint: string;    // API endpoint name
  method: string;      // HTTP method
  path: string;        // Request path
  request: unknown;    // Request payload
  response: unknown;   // Response data
}
```

**Error Handling Patterns:**
```typescript
// Comprehensive error handler dengan logging dan reporting
const comprehensiveErrorHandler: ValidationErrorHandler = (error, context) => {
  // 1. Log ke console untuk development
  console.group(`🚨 Validation Error: ${context.endpoint}`);
  console.error('Error:', error);
  console.log('Request:', context.request);
  console.log('Response:', context.response);
  console.groupEnd();
  
  // 2. Report ke error monitoring
  if (process.env.NODE_ENV === 'production') {
    Sentry.captureException(error, {
      tags: {
        type: 'validation_error',
        endpoint: context.endpoint,
        method: context.method
      },
      extra: context
    });
  }
  
  // 3. Show user notification
  toast.error(`Data validation failed for ${context.endpoint}`);
  
  // 4. Track analytics event
  analytics.track('API Validation Error', {
    endpoint: context.endpoint,
    method: context.method,
    errorType: error instanceof Error ? error.constructor.name : 'Unknown'
  });
};

// Development-focused error handler
const devErrorHandler: ValidationErrorHandler = (error, context) => {
  // Rich debugging information
  console.group(`🔍 Debug: ${context.endpoint} validation failed`);
  
  if (error instanceof ZodError) {
    console.log('Validation issues:');
    error.issues.forEach((issue, index) => {
      console.log(`  ${index + 1}. ${issue.path.join('.')}: ${issue.message}`);
    });
  }
  
  console.log('Expected schema: Check generated types');
  console.log('Actual response:', JSON.stringify(context.response, null, 2));
  console.groupEnd();
  
  // Show development notification
  toast.error(`${context.endpoint}: Check console for details`, {
    duration: 10000  // Longer duration untuk debugging
  });
};
```
### 5. ToastConfig — UI Notification Integration

```typescript
interface ToastConfig {
  success?: (message: string) => void;
  error?: (message: string) => void;
}
```

**Toast Integration Examples:**
```typescript
// React Hot Toast integration
const reactHotToastConfig: ToastConfig = {
  success: (message) => toast.success(message, {
    duration: 3000,
    position: 'top-right',
    icon: '✅'
  }),
  error: (message) => toast.error(message, {
    duration: 5000,
    position: 'top-right', 
    icon: '❌'
  })
};

// Chakra UI Toast integration
const chakraToastConfig: ToastConfig = {
  success: (message) => toast({
    title: 'Success',
    description: message,
    status: 'success',
    duration: 3000,
    isClosable: true
  }),
  error: (message) => toast({
    title: 'Error', 
    description: message,
    status: 'error',
    duration: 5000,
    isClosable: true
  })
};

// Custom notification system
const customNotificationConfig: ToastConfig = {
  success: (message) => {
    NotificationManager.success(message);
    // Also trigger confetti atau success animation
    triggerSuccessAnimation();
  },
  error: (message) => {
    NotificationManager.error(message);
    // Also trigger error sound atau haptic feedback
    triggerErrorFeedback();
  }
};

// No-op untuk headless usage (tests, server-side)
const silentToastConfig: ToastConfig = {
  success: () => {},  // Silent
  error: () => {}     // Silent
};
```

---

## 🔄 ENVIRONMENT-BASED CONFIGURATION

### Configuration Factory Pattern

```typescript
type Environment = 'development' | 'staging' | 'production' | 'test';

interface EnvironmentConfig {
  api: ServiceConfig;
  auth: AuthConfig;
  features: Record<string, boolean>;
}

class ConfigFactory {
  static create(env: Environment): EnvironmentConfig {
    const baseConfig = this.getBaseConfig(env);
    const envOverrides = this.getEnvironmentOverrides(env);
    
    return {
      ...baseConfig,
      ...envOverrides
    };
  }
  
  private static getBaseConfig(env: Environment): EnvironmentConfig {
    return {
      api: {
        baseURL: this.getApiUrl(env),
        timeout: env === 'production' ? 10000 : 30000,
        retry: {
          attempts: env === 'production' ? 3 : 1,
          delay: 1000,
          statusCodes: [429, 502, 503, 504]
        },
        cache: env === 'production',
        validateResponse: true,
        onValidationError: this.getErrorHandler(env),
        toast: this.getToastConfig(env)
      },
      auth: this.getAuthConfig(env),
      features: this.getFeatureFlags(env)
    };
  }
  
  private static getApiUrl(env: Environment): string {
    switch (env) {
      case 'production': return 'https://api.production.com/v1';
      case 'staging': return 'https://api.staging.com/v1';
      case 'development': return 'http://localhost:8000/api';
      case 'test': return 'http://localhost:3001/mock-api';
    }
  }
}
### Runtime Configuration Management

```typescript
// Configuration provider dengan React context
const ConfigContext = createContext<EnvironmentConfig | null>(null);

export function ConfigProvider({ children, environment }: ConfigProviderProps) {
  const config = useMemo(() => ConfigFactory.create(environment), [environment]);
  
  return (
    <ConfigContext.Provider value={config}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig(): EnvironmentConfig {
  const config = useContext(ConfigContext);
  if (!config) {
    throw new Error('useConfig must be used within ConfigProvider');
  }
  return config;
}

// Usage dalam application
function App() {
  const environment = (process.env.NODE_ENV as Environment) || 'development';
  
  return (
    <ConfigProvider environment={environment}>
      <ApiProvider>
        <Router>
          <Routes />
        </Router>
      </ApiProvider>
    </ConfigProvider>
  );
}
```

### Dynamic Configuration Updates

```typescript
// Hot configuration updates tanpa restart
class ConfigManager {
  private static instance: ConfigManager;
  private config: EnvironmentConfig;
  private listeners: ((config: EnvironmentConfig) => void)[] = [];
  
  static getInstance(): ConfigManager {
    if (!this.instance) {
      this.instance = new ConfigManager();
    }
    return this.instance;
  }
  
  updateConfig(newConfig: Partial<EnvironmentConfig>): void {
    this.config = {
      ...this.config,
      ...newConfig
    };
    
    // Notify all listeners
    this.listeners.forEach(listener => listener(this.config));
  }
  
  subscribe(listener: (config: EnvironmentConfig) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }
  
  // Feature flag toggling
  toggleFeature(featureName: string, enabled: boolean): void {
    this.updateConfig({
      features: {
        ...this.config.features,
        [featureName]: enabled
      }
    });
  }
  
  // API endpoint switching
  switchApiEndpoint(newBaseURL: string): void {
    this.updateConfig({
      api: {
        ...this.config.api,
        baseURL: newBaseURL
      }
    });
  }
}
```

---

## 🚨 POLA PENGGUNAAN KRITIS

### ✅ Implementasi yang Benar

**1. Environment-Aware Configuration:**
```typescript
// BENAR: Environment-specific configuration
function createApiConfig(): ServiceConfig {
  const isProduction = process.env.NODE_ENV === 'production';
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  return {
    baseURL: process.env.REACT_APP_API_URL || (
      isProduction 
        ? 'https://api.production.com/v1'
        : 'http://localhost:8000/api'
    ),
    timeout: isProduction ? 10000 : 30000,
    retry: {
      attempts: isProduction ? 3 : (isDevelopment ? 1 : 0),
      delay: 1000,
      statusCodes: [429, 502, 503, 504]
    },
    cache: isProduction,  // Cache only di production
    validateResponse: !process.env.DISABLE_VALIDATION,
    onValidationError: isDevelopment ? devErrorHandler : prodErrorHandler
  };
}
```
}

**2. Type-Safe Configuration Builder:**
```typescript
// BENAR: Type-safe configuration builder dengan validation
class ConfigBuilder {
  private config: Partial<ServiceConfig> = {};

  setBaseURL(url: string): this {
    if (!url.startsWith('http')) {
      throw new Error('baseURL must be valid HTTP/HTTPS URL');
    }
    this.config.baseURL = url;
    return this;
  }

  setTimeout(ms: number): this {
    if (ms < 0 || ms > 60000) {
      throw new Error('timeout must be between 0-60000ms');
    }
    this.config.timeout = ms;
    return this;
  }

  setRetry(attempts: number, delay?: number): this {
    this.config.retry = { attempts, delay };
    return this;
  }

  build(): ServiceConfig {
    if (!this.config.baseURL) {
      throw new Error('baseURL is required');
    }
    
    return {
      baseURL: this.config.baseURL,
      timeout: this.config.timeout || 10000,
      retry: this.config.retry || { attempts: 3 },
      cache: this.config.cache ?? true,
      validateResponse: this.config.validateResponse ?? true,
      ...this.config
    };
  }
}

// Usage
const config = new ConfigBuilder()
  .setBaseURL('https://api.example.com/v1')
  .setTimeout(15000)
  .setRetry(5, 2000)
  .build();
```

**3. Graceful Error Handling:**
```typescript
// BENAR: Defensive error handling dengan fallbacks
const errorHandler: ValidationErrorHandler = (error, context) => {
  try {
    // Primary error reporting
    if (typeof Sentry !== 'undefined') {
      Sentry.captureException(error, { extra: context });
    }
  } catch (sentryError) {
    // Fallback: log to console jika Sentry gagal
    console.warn('Failed to report to Sentry:', sentryError);
  }

  try {
    // Primary user notification
    if (typeof toast !== 'undefined') {
      toast.error(`API Error: ${context.endpoint}`);
    }
  } catch (toastError) {
    // Fallback: browser notification atau alert
    if ('Notification' in window) {
      new Notification('API Error', { body: `Error in ${context.endpoint}` });
    } else {
      console.error('API validation failed:', context.endpoint);
    }
  }
};
```

### ❌ Anti-Pattern yang Harus Dihindari

**1. Hardcoded Configuration Values:**
```typescript
// SALAH: Hardcoded values tanpa environment awareness
const badConfig: ServiceConfig = {
  baseURL: 'https://api.production.com',  // JANGAN! Tidak flexible
  timeout: 5000,                          // JANGAN! Fixed value
  retry: { attempts: 3 },                 // JANGAN! Same untuk semua env
  validateResponse: true                  // JANGAN! Tidak configurable
};

// BENAR: Environment-aware configuration
const goodConfig: ServiceConfig = {
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api',
  timeout: parseInt(process.env.REACT_APP_TIMEOUT || '10000'),
  retry: { 
    attempts: process.env.NODE_ENV === 'production' ? 3 : 1 
  },
  validateResponse: process.env.NODE_ENV !== 'test'
};
```

**2. Silent Error Handling:**
```typescript
// SALAH: Silent error handling tanpa logging
const badErrorHandler: ValidationErrorHandler = (error, context) => {
  // Silent failure - no logging, no notification
  return;  // JANGAN! Error hilang tanpa trace
};

// BENAR: Comprehensive error handling
const goodErrorHandler: ValidationErrorHandler = (error, context) => {
  // Always log untuk debugging
  console.error('Validation error:', {
    error: error instanceof Error ? error.message : String(error),
    context
  });
  
  // Report di production
  if (process.env.NODE_ENV === 'production') {
    reportError(error, context);
  }
  
  // Notify user
  showUserNotification(`Error: ${context.endpoint}`, 'error');
};
```

**3. Blocking Configuration Loading:**
```typescript
// SALAH: Synchronous configuration loading
function badConfigLoad(): ServiceConfig {
  const config = JSON.parse(localStorage.getItem('config')!);  // Blocking!
  return validateConfig(config);  // Could throw!
}

// BENAR: Asynchronous dengan fallback
async function goodConfigLoad(): Promise<ServiceConfig> {
  try {
    const stored = localStorage.getItem('config');
    const config = stored ? JSON.parse(stored) : null;
    
    if (config && isValidConfig(config)) {
      return config;
    }
  } catch (error) {
    console.warn('Failed to load stored config:', error);
  }
  
  // Fallback to default config
  return getDefaultConfig();
}
```

---

## 🔍 DEBUGGING & VALIDATION

### Configuration Validation

```typescript
// Comprehensive config validation
function validateServiceConfig(config: unknown): config is ServiceConfig {
  if (!config || typeof config !== 'object') return false;
  
  const c = config as ServiceConfig;
  
  // Required fields
  if (!c.baseURL || typeof c.baseURL !== 'string') {
    console.error('Invalid baseURL:', c.baseURL);
    return false;
  }
  
  if (!c.baseURL.startsWith('http')) {
    console.error('baseURL must start with http/https');
    return false;
  }
  
  // Optional fields validation
  if (c.timeout !== undefined) {
    if (typeof c.timeout !== 'number' || c.timeout < 0) {
      console.error('Invalid timeout:', c.timeout);
      return false;
    }
  }
  
  if (c.retry !== undefined) {
    if (!validateRetryConfig(c.retry)) {
      return false;
    }
  }
  
  return true;
}

function validateRetryConfig(retry: unknown): retry is RetryConfig {
  if (!retry || typeof retry !== 'object') return false;
  
  const r = retry as RetryConfig;
  
  if (typeof r.attempts !== 'number' || r.attempts < 0 || r.attempts > 10) {
    console.error('Invalid retry attempts:', r.attempts);
    return false;
  }
  
  if (r.delay !== undefined) {
    if (typeof r.delay !== 'number' || r.delay < 0) {
      console.error('Invalid retry delay:', r.delay);
      return false;
    }
  }
  
  if (r.statusCodes !== undefined) {
    if (!Array.isArray(r.statusCodes) || 
        !r.statusCodes.every(code => typeof code === 'number')) {
      console.error('Invalid retry statusCodes:', r.statusCodes);
      return false;
    }
  }
  
  return true;
}
```

### Configuration Testing

```typescript
// Configuration testing utilities
describe('ServiceConfig Validation', () => {
  test('validates correct configuration', () => {
    const validConfig: ServiceConfig = {
      baseURL: 'https://api.test.com',
      timeout: 5000,
      retry: { attempts: 2, delay: 1000 }
    };
    
    expect(validateServiceConfig(validConfig)).toBe(true);
  });
  
  test('rejects invalid baseURL', () => {
    const invalidConfig = {
      baseURL: 'not-a-url',  // Invalid
      timeout: 5000
    };
    
    expect(validateServiceConfig(invalidConfig)).toBe(false);
  });
  
  test('rejects negative timeout', () => {
    const invalidConfig = {
      baseURL: 'https://api.test.com',
      timeout: -1000  // Invalid
    };
    
    expect(validateServiceConfig(invalidConfig)).toBe(false);
  });
});

// Mock configuration untuk testing
export const mockConfigs = {
  development: {
    baseURL: 'http://localhost:8000/api',
    timeout: 30000,
    retry: { attempts: 0 },
    cache: false,
    validateResponse: false
  } as ServiceConfig,
  
  production: {
    baseURL: 'https://api.production.com/v1',
    timeout: 10000,
    retry: { attempts: 3, delay: 1000 },
    cache: true,
    validateResponse: true
  } as ServiceConfig,
  
  test: {
    baseURL: 'http://mock-api.test',
    timeout: 1000,
    retry: { attempts: 0 },
    cache: false,
    validateResponse: false,
    headers: { 'X-Test-Mode': 'true' }
  } as ServiceConfig
};
```

### Runtime Configuration Monitoring

```typescript
// Monitor configuration changes
class ConfigMonitor {
  private previousConfig: ServiceConfig | null = null;
  
  monitor(config: ServiceConfig): void {
    if (this.previousConfig) {
      this.detectChanges(this.previousConfig, config);
    }
    this.previousConfig = { ...config };
  }
  
  private detectChanges(prev: ServiceConfig, current: ServiceConfig): void {
    const changes: string[] = [];
    
    if (prev.baseURL !== current.baseURL) {
      changes.push(`baseURL: ${prev.baseURL} → ${current.baseURL}`);
    }
    
    if (prev.timeout !== current.timeout) {
      changes.push(`timeout: ${prev.timeout} → ${current.timeout}`);
    }
    
    if (JSON.stringify(prev.retry) !== JSON.stringify(current.retry)) {
      changes.push(`retry: ${JSON.stringify(prev.retry)} → ${JSON.stringify(current.retry)}`);
    }
    
    if (changes.length > 0) {
      console.info('Configuration changed:', changes);
      
      // Optional: Report to analytics
      if (typeof analytics !== 'undefined') {
        analytics.track('Config Changed', { changes });
      }
    }
  }
}

const configMonitor = new ConfigMonitor();

// Usage
function updateApiConfig(newConfig: ServiceConfig): void {
  configMonitor.monitor(newConfig);
  // Apply configuration...
}
```

---

## 🎯 INTEGRASI DENGAN PIPELINE ROUTESYNC

### Generated Code Integration

```typescript
// Generated HTTP client menggunakan ServiceConfig
class GeneratedApiClient {
  private config: ServiceConfig;
  private retryManager: RetryManager;
  private cacheManager?: CacheManager;
  
  constructor(config: ServiceConfig) {
    this.config = config;
    this.retryManager = new RetryManager(config.retry);
    
    if (config.cache) {
      this.cacheManager = new CacheManager();
    }
  }
  
  async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.config.baseURL}${endpoint}`;
    
    // Apply default headers
    const headers = {
      'Content-Type': 'application/json',
      ...this.config.headers,
      ...options.headers
    };
    
    // Add authentication
    if (this.config.token) {
      headers.Authorization = `Bearer ${this.config.token}`;
    }
    
    const requestOptions: RequestInit = {
      ...options,
      headers,
      signal: AbortSignal.timeout(this.config.timeout || 10000)
    };
    
    try {
      // Execute dengan retry logic
      const response = await this.retryManager.execute(() =>
        fetch(url, requestOptions)
      );
      
      if (!response.ok) {
        throw new ApiError(response.status, await response.text());
      }
      
      const data = await response.json();
      
      // Validate response jika enabled
      if (this.config.validateResponse && this.hasValidator(endpoint)) {
        return this.validateResponse(endpoint, data);
      }
      
      return data;
    } catch (error) {
      // Handle validation errors
      if (this.config.onValidationError && error instanceof ValidationError) {
        this.config.onValidationError(error, {
          endpoint,
          method: options.method || 'GET',
          path: endpoint,
          request: options.body,
          response: error.response
        });
      }
      
      throw error;
    }
  }
}
```

### Configuration Provider Integration

```typescript
// Integration dengan React context untuk generated hooks
interface ApiProviderProps {
  config: ServiceConfig;
  children: React.ReactNode;
}

export function ApiProvider({ config, children }: ApiProviderProps) {
  const apiClient = useMemo(() => new GeneratedApiClient(config), [config]);
  
  return (
    <ApiClientContext.Provider value={apiClient}>
      {children}
    </ApiClientContext.Provider>
  );
}

// Generated hooks menggunakan context
export function useUsersQuery() {
  const client = useContext(ApiClientContext);
  
  return useQuery({
    queryKey: ['users'],
    queryFn: () => client.request<User[]>('/users'),
    // Konfigurasi dari ServiceConfig
    staleTime: client.config.cache ? 300000 : 0
  });
}

// Usage di aplikasi
function App() {
  const config = useEnvironmentConfig();
  
  return (
    <ApiProvider config={config}>
      <QueryClient>
        <UsersList />
      </QueryClient>
    </ApiProvider>
  );
}
```

### Environment Configuration Loading

```typescript
// Load configuration berdasarkan environment
async function loadEnvironmentConfig(): Promise<ServiceConfig> {
  const env = process.env.NODE_ENV || 'development';
  
  // Base configuration
  let config: ServiceConfig = {
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api',
    timeout: parseInt(process.env.REACT_APP_TIMEOUT || '10000'),
    retry: {
      attempts: env === 'production' ? 3 : (env === 'test' ? 0 : 1),
      delay: 1000
    },
    cache: env === 'production',
    validateResponse: env !== 'test'
  };
  
  // Environment-specific overrides
  try {
    const envConfig = await import(`./config/${env}.json`);
    config = { ...config, ...envConfig.default };
  } catch (error) {
    console.warn(`No specific config for ${env}, using defaults`);
  }
  
  // Runtime overrides dari server
  if (env === 'production') {
    try {
      const remoteConfig = await fetch('/api/config').then(r => r.json());
      config = { ...config, ...remoteConfig };
    } catch (error) {
      console.warn('Failed to load remote config, using local config');
    }
  }
  
  // Validate final configuration
  if (!validateServiceConfig(config)) {
    throw new Error('Invalid configuration loaded');
  }
  
  return config;
}
```

---

## 📋 EXTENSION GUIDELINES

### Adding New Configuration Options

**1. Extend ServiceConfig Interface:**
```typescript
interface ServiceConfig {
  // ... existing fields
  logging?: LoggingConfig;
  metrics?: MetricsConfig;
  security?: SecurityConfig;
}

interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  enableConsole: boolean;
  enableRemote: boolean;
  remoteEndpoint?: string;
}
```

**2. Update Configuration Builder:**
```typescript
class ConfigBuilder {
  // ... existing methods
  
  setLogging(level: LogLevel, enableRemote = false): this {
    this.config.logging = {
      level,
      enableConsole: true,
      enableRemote,
      remoteEndpoint: enableRemote ? '/api/logs' : undefined
    };
    return this;
  }
}
```

**3. Update Validation Logic:**
```typescript
function validateServiceConfig(config: unknown): config is ServiceConfig {
  // ... existing validation
  
  if (c.logging !== undefined) {
    if (!validateLoggingConfig(c.logging)) {
      return false;
    }
  }
  
  return true;
}
```

### Adding New Environment Support

**1. Extend Environment Types:**
```typescript
type Environment = 'development' | 'staging' | 'production' | 'test' | 'preview';

interface EnvironmentConfig {
  // ... existing fields
  preview?: {
    branch: string;
    deployUrl: string;
    mockData: boolean;
  };
}
```

**2. Update Factory Logic:**
```typescript
class ConfigFactory {
  private static getApiUrl(env: Environment): string {
    switch (env) {
      case 'preview':
        return process.env.VERCEL_URL 
          ? `https://${process.env.VERCEL_URL}/api`
          : 'http://localhost:8000/api';
      // ... existing cases
    }
  }
}
```

---

## 🚀 PERFORMANCE & OPTIMIZATION

### Configuration Caching

```typescript
// Cache configuration untuk menghindari recomputation
class ConfigCache {
  private static cache = new Map<string, ServiceConfig>();
  private static cacheTimeout = new Map<string, number>();
  
  static get(key: string, ttl = 300000): ServiceConfig | null {
    const cached = this.cache.get(key);
    const timeout = this.cacheTimeout.get(key);
    
    if (cached && timeout && Date.now() < timeout) {
      return cached;
    }
    
    // Expired, remove dari cache
    this.cache.delete(key);
    this.cacheTimeout.delete(key);
    return null;
  }
  
  static set(key: string, config: ServiceConfig, ttl = 300000): void {
    this.cache.set(key, { ...config }); // Deep clone
    this.cacheTimeout.set(key, Date.now() + ttl);
  }
  
  static invalidate(pattern?: string): void {
    if (pattern) {
      // Invalidate berdasarkan pattern
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
          this.cacheTimeout.delete(key);
        }
      }
    } else {
      // Clear all cache
      this.cache.clear();
      this.cacheTimeout.clear();
    }
  }
}

// Usage dengan caching
async function getCachedConfig(environment: string): Promise<ServiceConfig> {
  const cacheKey = `config-${environment}`;
  
  let config = ConfigCache.get(cacheKey);
  if (config) {
    return config;
  }
  
  config = await loadEnvironmentConfig();
  ConfigCache.set(cacheKey, config);
  
  return config;
}
```

### Lazy Configuration Loading

```typescript
// Lazy loading untuk configuration yang expensive
class LazyConfigLoader {
  private configPromise: Promise<ServiceConfig> | null = null;
  
  async getConfig(): Promise<ServiceConfig> {
    if (!this.configPromise) {
      this.configPromise = this.loadConfig();
    }
    return this.configPromise;
  }
  
  private async loadConfig(): Promise<ServiceConfig> {
    // Parallel loading dari multiple sources
    const [envConfig, remoteConfig, userPrefs] = await Promise.allSettled([
      this.loadEnvironmentConfig(),
      this.loadRemoteConfig(),
      this.loadUserPreferences()
    ]);
    
    // Merge configurations dengan priority
    let config = this.getDefaultConfig();
    
    if (envConfig.status === 'fulfilled') {
      config = { ...config, ...envConfig.value };
    }
    
    if (remoteConfig.status === 'fulfilled') {
      config = { ...config, ...remoteConfig.value };
    }
    
    if (userPrefs.status === 'fulfilled') {
      config = { ...config, ...userPrefs.value };
    }
    
    return config;
  }
  
  // Reset untuk force reload
  invalidate(): void {
    this.configPromise = null;
  }
}
```

### Memory Management

```typescript
// Cleanup configuration resources
class ConfigCleanup {
  private static cleanupTasks: (() => void)[] = [];
  
  static addCleanupTask(task: () => void): void {
    this.cleanupTasks.push(task);
  }
  
  static cleanup(): void {
    this.cleanupTasks.forEach(task => {
      try {
        task();
      } catch (error) {
        console.warn('Cleanup task failed:', error);
      }
    });
    this.cleanupTasks.length = 0;
  }
}

// Auto cleanup pada page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    ConfigCleanup.cleanup();
  });
}

// Usage
const configMonitor = new ConfigMonitor();
ConfigCleanup.addCleanupTask(() => configMonitor.stop());

const cacheManager = new CacheManager();
ConfigCleanup.addCleanupTask(() => cacheManager.clear());
```

---

## 🎯 METRICS & SUCCESS INDICATORS

### Configuration Quality Metrics

| Metric | Target | Purpose |
|--------|--------|---------|
| Config Load Time | <100ms | Fast application startup |
| Configuration Errors | 0 | Robust configuration system |
| Cache Hit Ratio | >80% | Efficient configuration loading |
| Validation Success Rate | 100% | Type-safe configuration |
| Environment Coverage | 100% | All environments supported |

### Runtime Performance Metrics

| Metric | Target | Purpose |
|--------|--------|---------|
| Request Success Rate | >99% | Reliable HTTP communication |
| Average Response Time | <200ms | Fast API responses |
| Retry Success Rate | >90% | Effective retry strategy |
| Cache Utilization | >70% | Efficient caching strategy |
| Error Notification Rate | <1% | Minimize error noise |

### Developer Experience Metrics

- **Configuration Clarity**: 100% configuration options documented
- **Type Safety**: 0 runtime configuration errors
- **Environment Parity**: Same configuration interface across environments
- **Error Messages**: Clear validation error messages
- **Hot Reload**: Configuration changes without restart

---

## 🔗 KOMPONEN TERKAIT

### Dependencies (Upstream)
- Runtime environment variables - Configuration values
- Network infrastructure - API endpoints dan connectivity
- Authentication providers - Token management

### Consumers (Downstream)
- `packages/cli/src/generators/` - Generated HTTP clients
- `packages/react/` - React hooks dengan configuration
- `packages/vue/` - Vue composables dengan configuration
- `packages/sdk/` - Core SDK dengan configuration support

### Configuration Files
- `.env` files - Environment variables
- `config/` directory - Environment-specific configuration
- `packages/core/tsconfig.json` - TypeScript configuration
- Application configuration files

---

**Sistem configuration ini adalah runtime foundation yang memungkinkan generated code RouteSync untuk beradaptasi dengan berbagai environment dan kebutuhan aplikasi. Memahami struktur ini essential untuk deployment yang sukses dan maintenance jangka panjang.**

**Last Updated:** Juli 26, 2026  
**Config Version:** v1  
**Status:** Production dengan active development