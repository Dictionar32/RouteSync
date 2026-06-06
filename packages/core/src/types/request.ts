export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export type RouteTransform = (value: any) => any

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

export interface ResponseSchema<T> {
  parse(input: unknown): T
}

export interface RouteDefinition<TResponse = unknown, TParams = unknown, TBody = unknown, TMethod extends HttpMethod = HttpMethod> {
  method: TMethod
  path: string | Function
  auth?: boolean
  schema?: RouteSchema
  responseSchema?: ResponseSchema<any>
  contract?: {
    body?: (payload: unknown) => any
    response?: ResponseSchema<any> | ((payload: unknown) => any)
  }
  mapper?: RouteMapper
  headers?: Record<string, string>
  cache?: unknown
  retry?: unknown
  body?: Record<string, any>
  params?: Record<string, any>
  query?: Record<string, any>
  _typeResponse?: TResponse // Phantom type for inference
  _typeParams?: TParams     // Phantom type for inference
  _typeBody?: TBody         // Phantom type for inference
}

export interface ApiDefinition {
  [group: string]: {
    [action: string]: RouteDefinition<any, any, any>
  }
}
