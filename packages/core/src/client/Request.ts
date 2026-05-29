import { HttpMethod, RequestOptions } from '../types/request'

export class Request {
  private _url: string = ''
  private _method: HttpMethod = 'GET'
  private _body?: any
  private _options?: RequestOptions

  url(url: string): this {
    this._url = url
    return this
  }

  method(method: HttpMethod): this {
    this._method = method
    return this
  }

  body(data: any): this {
    this._body = data
    return this
  }

  options(opts: RequestOptions): this {
    this._options = opts
    return this
  }

  build() {
    return {
      url: this._url,
      method: this._method,
      body: this._body,
      options: this._options
    }
  }
}
