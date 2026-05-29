import { HttpClient, ServiceConfig, TokenManager } from '@routesync/core'

export function createClient(config: ServiceConfig) {
  const client = new HttpClient(config)
  const tokenManager = new TokenManager()

  if (config.token) {
    tokenManager.set(config.token)
  }

  return {
    client,
    tokenManager,

    setToken(token: string) {
      tokenManager.set(token)
      client.setToken(token)
    },

    clearToken() {
      tokenManager.clear()
      client.removeToken()
    }
  }
}
