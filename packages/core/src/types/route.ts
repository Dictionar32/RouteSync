export interface RouteManifest {
  version: string
  baseURL: string
  routes: ParsedRoute[]
  generatedAt: string
}

export interface ParsedRoute {
  name: string
  method: string
  path: string
  auth: boolean
  middleware: string[]
  group?: string
  action?: string
}
