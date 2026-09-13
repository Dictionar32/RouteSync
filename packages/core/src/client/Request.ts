import {
  HttpMethod,
  RequestOptions,
  RequestOptionsContract,
  RequestOptionsDescriptor
} from '../types/request'

export class Request {
  private _url: string = ''
  private _method: HttpMethod = 'GET'
  private _body: unknown = undefined
  private _options: RequestOptionsContract = RequestOptionsDescriptor.empty()

  url(url: string): this {
    this._url = url
    return this
  }

  method(method: HttpMethod): this {
    this._method = method
    return this
  }

  body(data: unknown): this {
    this._body = data
    return this
  }

  options(opts: RequestOptionsContract | RequestOptions): this {
    if (opts instanceof RequestOptionsDescriptor) {
      this._options = opts
    } else {
      const anyOpts = opts as any
      const timeoutMs = typeof anyOpts.timeoutMs === 'number'
        ? anyOpts.timeoutMs
        : (typeof anyOpts.timeout === 'number' ? anyOpts.timeout : 0)
      this._options = new RequestOptionsDescriptor(
        opts.params,
        opts.headers,
        timeoutMs,
        opts.signal
      )
    }
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
