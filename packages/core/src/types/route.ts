export interface RouteManifest {
  version: string
  baseURL: string
  routes: ParsedRoute[]
  channels?: ParsedChannel[]
  generatedAt: string
}

export interface ParsedChannel {
  name: string
  isPrivate: boolean
  isPresence: boolean
}

export interface ParsedRoute {
  name: string
  method: string
  path: string
  auth: boolean
  middleware: string[]
  schema?: Record<string, any>
  group?: string
  action?: string
}
