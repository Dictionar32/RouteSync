import { describe, expect, test } from 'vitest';
import type { AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { HttpClient } from '../HttpClient';
import type { ServiceConfig } from '../../types/config';

describe('Phase 2356 HTTP operation contract', () => {
  test('executes QUERY through the configured Axios instance with its body and interceptors', async () => {
    const client = new HttpClient({ baseURL: 'https://routesync.test' } satisfies ServiceConfig);
    let observedMethod: string | undefined;
    let observedUrl: string | undefined;
    let observedBody: unknown;
    const adapter = async (config: InternalAxiosRequestConfig) => {
      observedMethod = config.method;
      observedUrl = config.url;
      observedBody = config.data;
      return {
        data: { accepted: true },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    };
    client.getInstance().defaults.adapter = adapter;

    const response = await client.request({
      url: '/search',
      method: 'QUERY',
      body: { searchTerm: 'tea' },
      config: {} satisfies AxiosRequestConfig,
    });

    expect(response).toEqual({ accepted: true });
    expect(observedMethod).toBe('query');
    expect(observedUrl).toBe('/search');
    expect(observedBody).toEqual({ search_term: 'tea' });
  });
});
