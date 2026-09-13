/**
 * moduleConverter.ts
 *
 * Converts a GeneratedSDKModule into a TSEmitModule.
 *
 * @module sdk/emitter/zod-converter
 */

import type {
  TSEmitModule,
  TSInterface,
  TSFunction,
  TSConst,
  ImportStatement,
  GeneratedSDKModule
} from '@routesync/core';
import type { TSExportDefinition } from './types';
import { astToZodCode, astToInterface } from './astToZodCode';

function pascalCase(s: string): string {
  const words = s.split(/[^a-zA-Z0-9]/).filter(Boolean);
  return words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
}

function camelCase(s: string): string {
  const p = pascalCase(s);
  return p.charAt(0).toLowerCase() + p.slice(1);
}

function buildUrl(endpoint: string): string {
  if (endpoint.includes('{')) {
    return '\`' + endpoint.replace(/\{([^}]+)\}/g, '${$1}') + '\`';
  }
  return `'${endpoint}'`;
}

export function convertGeneratedModule(module: GeneratedSDKModule): TSEmitModule {
  const interfaces: TSInterface[] = [];
  const functions: TSFunction[] = [];
  const constants: TSConst[] = [];
  const exports: TSExportDefinition[] = [];
  const imports: ImportStatement[] = [
    { from: 'zod', named: ['z'] },
    { from: '@routesync/react', named: ['useQuery', 'useMutation'] },
    { from: 'axios', default: 'axios' }
  ];

  const pascalRouteName = pascalCase(module.routeName);
  const camelRouteName = camelCase(module.routeName);

  const responseInterfaceName = `${pascalRouteName}Response`;

  // 1. Zod Schema
  const zodLines = astToZodCode(module.zod.ast);
  constants.push({
    name: `${camelRouteName}Schema`,
    isExported: true,
    value: zodLines
  });

  const resInterface = astToInterface(module.zod.ast, responseInterfaceName);
  if (resInterface) {
    interfaces.push(resInterface);
  } else {
    constants.push({
      name: responseInterfaceName,
      isExported: true,
      value: [`export type ${responseInterfaceName} = z.infer<typeof ${camelRouteName}Schema>;`]
    });
  }

  // 2. Fetcher Function
  const fetcherName = `fetch${pascalRouteName}`;
  const url = buildUrl(module.endpoint);
  const method = module.method.toLowerCase();
  const hasBody = module.method !== 'GET' && module.method !== 'DELETE';

  let fetcherParams = '';
  let axiosCall = `  const res = await axios.${method}(${url});`;
  const pathKeys = Object.keys(module.request.params || {});

  if (pathKeys.length > 0) {
    const pathArgs = pathKeys.map(p => `${p}: string | number`).join(', ');
    fetcherParams = hasBody ? `${pathArgs}, data: Record<string, unknown>` : pathArgs;
    if (hasBody) {
      axiosCall = `  const res = await axios.${method}(${url}, data);`;
    }
  } else {
    if (hasBody) {
      fetcherParams = `data: Record<string, unknown>`;
      axiosCall = `  const res = await axios.${method}(${url}, data);`;
    }
  }

  functions.push({
    name: fetcherName,
    type: 'fetcher',
    key: [],
    stableId: `${module.routeName}_fetcher`,
    isExported: true,
    isAsync: true,
    params: fetcherParams,
    returnType: `Promise<${responseInterfaceName}>`,
    body: [
      axiosCall,
      `  return res.data;`
    ]
  });

  return {
    routeName: module.routeName,
    files: [
      {
        filePath: `routes/${module.routeName}.ts`,
        imports,
        zodSchemas: constants,
        interfaces,
        functions,
        exports: exports.map(exp => ({
          name: exp.name,
          type: exp.isDefault ? 'default' : 'named'
        }))
      }
    ]
  };
}
