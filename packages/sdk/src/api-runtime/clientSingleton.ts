/**
 * clientSingleton.ts
 *
 * Singleton HTTP client management for SDK defineApi.
 *
 * @module sdk/api-runtime/clientSingleton
 */

import { HttpClient, type ServiceConfig } from '@routesync/core';

let _client: HttpClient | null = null;

export function getClient(): HttpClient {
  if (!_client) {
    throw new Error('RouteSync not initialized. Call createClient() first.');
  }
  return _client;
}

export function createClient(config: ServiceConfig): HttpClient {
  _client = new HttpClient(config);
  return _client;
}
