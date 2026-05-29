export class QueryBuilder {
  static build(params?: Record<string, any>): string {
    if (!params || Object.keys(params).length === 0) return ''

    const query = Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => {
        if (Array.isArray(v)) {
          return v.map((item) => `${encodeURIComponent(k)}[]=${encodeURIComponent(item)}`).join('&')
        }
        return `${encodeURIComponent(k)}=${encodeURIComponent(v)}`
      })
      .join('&')

    return query ? `?${query}` : ''
  }

  static append(url: string, params?: Record<string, any>): string {
    const query = this.build(params)
    return url + query
  }
}
