import { HttpClient, type ServiceConfig, TokenManager } from '@routesync/core'

export interface CreatedClient {
  readonly client: HttpClient
  readonly tokenManager: TokenManager
  setToken(token: string): void
  clearToken(): void
}

export interface CreateClient {
  (config: ServiceConfig): CreatedClient
}

export const createClient: CreateClient = (config: ServiceConfig): CreatedClient => {
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
