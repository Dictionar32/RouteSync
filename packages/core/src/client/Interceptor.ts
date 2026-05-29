import { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios'

export type RequestInterceptor = (
  config: InternalAxiosRequestConfig
) => InternalAxiosRequestConfig | Promise<InternalAxiosRequestConfig>

export type ResponseInterceptor = (
  response: AxiosResponse
) => AxiosResponse | Promise<AxiosResponse>

export type ErrorInterceptor = (error: any) => any

export class Interceptor {
  constructor(private client: AxiosInstance) {}

  addRequestInterceptor(
    onFulfilled: RequestInterceptor,
    onRejected?: ErrorInterceptor
  ): number {
    return this.client.interceptors.request.use(onFulfilled, onRejected)
  }

  addResponseInterceptor(
    onFulfilled: ResponseInterceptor,
    onRejected?: ErrorInterceptor
  ): number {
    return this.client.interceptors.response.use(onFulfilled, onRejected)
  }

  removeRequestInterceptor(id: number) {
    this.client.interceptors.request.eject(id)
  }

  removeResponseInterceptor(id: number) {
    this.client.interceptors.response.eject(id)
  }
}
