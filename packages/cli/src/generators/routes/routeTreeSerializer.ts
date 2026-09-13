/**
 * routeTreeSerializer.ts
 *
 * Builds and serializes hierarchical route tree into JavaScript and TypeScript definitions.
 *
 * @module cli/generators/routes
 */

import { matchPageEndpoint } from '@routesync/core';
import { ScannedPageEndpointDescriptor } from './pageEndpointDescriptor';

export function buildRouteTree(pages: Record<string, unknown>): any {
  const routeTree: any = {};

  for (const [key, value] of Object.entries(pages)) {
    const segments = key.split('.');
    let current = routeTree;
    for (let i = 0; i < segments.length - 1; i++) {
      const seg = segments[i];
      if (!current[seg]) {
        current[seg] = {};
      }
      current = current[seg];
    }
    const lastSeg = segments[segments.length - 1];

    let pagePath = '';
    let queryKeys: string[] = [];
    if (typeof value === 'string') {
      pagePath = value;
    } else if (value && typeof value === 'object') {
      const val = value as Record<string, unknown>;
      pagePath = (val.path as string) || '';
      queryKeys = (val.query as string[]) || [];
    }

    const params: string[] = [];
    const paramRegex = /\{([^}]+)\}|:([a-zA-Z0-9_]+)/g;
    let match;
    while ((match = paramRegex.exec(pagePath)) !== null) {
      params.push(match[1] || match[2]);
    }

    current[lastSeg] = queryKeys.length > 0
      ? ScannedPageEndpointDescriptor.queryFiltered(pagePath, queryKeys, params)
      : (params.length > 0
          ? ScannedPageEndpointDescriptor.parameterized(pagePath, params)
          : ScannedPageEndpointDescriptor.static(pagePath));
  }

  return routeTree;
}

export function serializeRouteTree(tree: any, indent: string = '  '): { js: string[], dts: string[] } {
  const jsLines: string[] = [];
  const dtsLines: string[] = [];

  for (const [key, val] of Object.entries(tree)) {
    if (val instanceof ScannedPageEndpointDescriptor || (val && typeof val === 'object' && 'path' in val)) {
      const page = val as ScannedPageEndpointDescriptor;
      const rendered = matchPageEndpoint(page, {
        static: (p) => ({
          js: `${indent}${key}: '${p.path}',`,
          dts: `${indent}readonly ${key}: '${p.path}';`
        }),
        parameterized: (p) => {
          const signature = `(params: { ${p.params.map(k => `${k}: string | number | null`).join('; ')} })`;
          return {
            js: `${indent}${key}: (params) => PathResolver.resolveUrl('${p.path}', params),`,
            dts: `${indent}readonly ${key}: ${signature} => string;`
          };
        },
        query_filtered: (p) => {
          const allKeys = [...p.params, ...p.query];
          const signature = `(params: { ${allKeys.map(k => `${k}${p.query.includes(k) ? '?:' : ':'} string | number | null`).join('; ')} })`;
          return {
            js: `${indent}${key}: (params) => PathResolver.resolveUrl('${p.path}', params),`,
            dts: `${indent}readonly ${key}: ${signature} => string;`
          };
        }
      });
      jsLines.push(rendered.js);
      dtsLines.push(rendered.dts);
    } else {
      jsLines.push(`${indent}${key}: {`);
      dtsLines.push(`${indent}readonly ${key}: {`);

      const sub = serializeRouteTree(val, indent + '  ');
      jsLines.push(...sub.js);
      dtsLines.push(...sub.dts);

      jsLines.push(`${indent}},`);
      dtsLines.push(`${indent}};`);
    }
  }
  return { js: jsLines, dts: dtsLines };
}
