# Authentication

## Bearer Token (Laravel Sanctum / JWT)

Pass `token` in config:

```ts
const api = defineApi(routes, {
  baseURL: 'https://api.myapp.com/api',
  token: 'your-token-here'
})
```

Or set it after login:

```ts
import { createClient } from '@routesync/sdk'

const { client, setToken, clearToken } = createClient({
  baseURL: 'https://api.myapp.com/api'
})

const result = await api.auth.login({ body: { email, password } })
setToken(result.data.token)

// Now all `auth: true` routes automatically send:
// Authorization: Bearer your-token-here
```

---

## auth: true on Routes

Mark routes that require authentication:

```ts
{
  logout:  { method: 'POST', path: '/logout',  auth: true },
  profile: { method: 'GET',  path: '/profile', auth: true },
  orders:  { method: 'GET',  path: '/orders',  auth: true }
}
```

The SDK will automatically inject the `Authorization` header for these routes.

---

## Token Persistence

`TokenManager` persists the token to `localStorage` in browser environments:

```ts
import { TokenManager } from '@routesync/core'

const tm = new TokenManager()
tm.set('abc123')        // saves to localStorage
tm.get()                // reads from localStorage
tm.clear()              // removes from localStorage
tm.exists()             // → true/false
```

---

## Refresh Token (advanced)

Use the request interceptor to implement auto-refresh:

```ts
import { Interceptor } from '@routesync/core'

const interceptor = new Interceptor(httpClient.getInstance())

interceptor.addResponseInterceptor(
  (response) => response,
  async (error) => {
    if (error?.status === 401) {
      const refreshed = await api.auth.refresh({
        body: { refresh_token: getRefreshToken() }
      })
      setToken(refreshed.data.token)
      // retry original request
    }
    return Promise.reject(error)
  }
)
```
