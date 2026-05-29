export class TokenManager {
  private static TOKEN_KEY = 'routesync_token'
  private token: string | null = null

  set(token: string) {
    this.token = token
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(TokenManager.TOKEN_KEY, token)
    }
  }

  get(): string | null {
    if (this.token) return this.token
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(TokenManager.TOKEN_KEY)
    }
    return null
  }

  clear() {
    this.token = null
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(TokenManager.TOKEN_KEY)
    }
  }

  exists(): boolean {
    return this.get() !== null
  }
}
