export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export type RouteTransform = (value: unknown) => unknown

export interface RouteTransformMap {
  params?: RouteTransform
  query?: RouteTransform
  body?: RouteTransform
  request?: RouteTransform
  response?: RouteTransform
}

export type RouteMapper = RouteTransform | RouteTransformMap

export interface RouteParserSchema {
  parse?: RouteTransform
  safeParse?: RouteTransform
}

export interface RouteSchemaMap {
  params?: RouteSchemaValue
  query?: RouteSchemaValue
  body?: RouteSchemaValue
  request?: RouteSchemaValue
  response?: RouteSchemaValue
}

export type RouteSchemaValue = RouteTransform | RouteParserSchema

export type RouteSchema = RouteSchemaValue | RouteSchemaMap

export interface RequestOptions {
  params?: Record<string, any>
  headers?: Record<string, string>
  timeout?: number
  signal?: AbortSignal
}

export interface RouteDefinition {
  method: HttpMethod
  path: string
  auth?: boolean
  schema?: RouteSchema
  mapper?: RouteMapper
  headers?: Record<string, string>
  cache?: unknown
  retry?: unknown
  body?: Record<string, any>
  params?: Record<string, any>
  query?: Record<string, any>
}

export interface ApiDefinition {
  [group: string]: {
    [action: string]: RouteDefinition
  }
}
