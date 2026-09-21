export interface AuthUser {
  id: number
  name: string
  email: string
  role: "user" | "admin"
  createdAt?: string
  updatedAt?: string
  noTelepon?: string
  alamat?: string
  avatar?: string
}

export interface AuthSession {
  success: boolean
  message: string
  token: string
  user: AuthUser
}

export type AuthShow = AuthUser
export type AuthIndex = AuthUser