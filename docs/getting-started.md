# Getting Started

## Prerequisites

- Node.js >= 18
- pnpm >= 8 (recommended for monorepo)

---

## Installation

### Using the SDK only

```bash
npm install @routesync/sdk
```

### Using the CLI (route scanner + generator)

```bash
npm install -g @routesync/cli
# or
npx @routesync/cli sync
```

### Using React hooks

```bash
npm install @routesync/react @tanstack/react-query
```

### Using Vue composables

```bash
npm install @routesync/vue @tanstack/vue-query
```

---

## Basic Setup

### Step 1 — Create API definition

```ts
// src/api/index.ts
import { defineApi } from '@routesync/sdk'

export const api = defineApi(
  {
    auth: {
      login:    { method: 'POST', path: '/login' },
      register: { method: 'POST', path: '/register' },
      logout:   { method: 'POST', path: '/logout', auth: true }
    },
    users: {
      index:   { method: 'GET',    path: '/users',     auth: true },
      show:    { method: 'GET',    path: '/users/:id', auth: true },
      store:   { method: 'POST',   path: '/users',     auth: true },
      update:  { method: 'PUT',    path: '/users/:id', auth: true },
      destroy: { method: 'DELETE', path: '/users/:id', auth: true }
    }
  },
  {
    baseURL: 'http://localhost:8000/api'
  }
)
```

### Step 2 — Call your API

```ts
import { api } from './api'

// POST /login
const result = await api.auth.login({
  body: { email: 'user@example.com', password: 'secret' }
})

// GET /users?page=1&limit=10
const users = await api.users.index({
  query: { page: 1, limit: 10 }
})

// GET /users/42
const user = await api.users.show({
  params: { id: 42 }
})
```

### Step 3 — Handle authentication

```ts
import { createClient } from '@routesync/sdk'

const { setToken, clearToken } = createClient({
  baseURL: 'http://localhost:8000/api'
})

// After login response:
setToken(loginResult.data.token)

// On logout:
clearToken()
```

---

## CLI Auto-generation

If you're using Laravel, you can skip writing the definition manually.

```bash
# From your frontend project root
npx routesync sync \
  --input ../my-laravel-app/routes/api.php \
  --output ./src/api \
  --baseURL http://localhost:8000/api
```

This scans your `routes/api.php` and auto-generates:

- `src/api/api.ts` — typed API client
- `src/api/types.ts` — TypeScript interfaces
- `src/api/hooks.ts` — React Query hooks

---

## Next Steps

- [Routing & Path Params](./routing.md)
- [Authentication](./auth.md)
- [React Hooks](./hooks.md)
- [CLI Generators](./generators.md)
