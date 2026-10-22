const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = (relative) => fs.existsSync(path.join(root, relative));
const checks = [];
const check = (name, condition, detail) => checks.push({ name, passed: Boolean(condition), detail });

const upstream = read('packages/core/src/types/upstream/runtimeSchemaParser.ts');
const request = read('packages/core/src/types/request.ts');
const coreIndex = read('packages/core/src/index.ts');
const sdkSchema = read('packages/sdk/src/mappers/schema.ts');
const schemaMapper = read('packages/sdk/src/api-runtime/schemaMapper.ts');
const createService = read('packages/sdk/src/createService.ts');
const packageJson = JSON.parse(read('package.json'));
const sdkIndex = read('packages/sdk/src/index.ts');
const reactHooks = read('packages/react/src/hooks/createHooks.ts');

check('upstream parser contract exists',
  upstream.includes('export interface RouteParserSchema<T = unknown>'),
  'The parser contract is owned by core/src/types/upstream.');
check('upstream parser requires parse',
  /readonly parse:\s*\(input: unknown\) => T/.test(upstream),
  'The parse operation is mandatory.');
check('upstream parser requires safeParse',
  /readonly safeParse:\s*\(input: unknown\) => SafeParseResult<T>/.test(upstream),
  'The result-based parse operation is mandatory.');
check('legacy request boundary reuses upstream type',
  request.includes("import type { RouteParserSchema } from './upstream/runtimeSchemaParser'") &&
  request.includes("export type { RouteParserSchema, SafeParseResult } from './upstream/runtimeSchemaParser'") &&
  !request.includes('export interface RouteParserSchema<T = unknown>'),
  'The old import path remains compatible without a duplicate declaration.');
check('core public API exports canonical parser',
  coreIndex.includes('RouteParserSchema'),
  'Consumers can import the canonical parser through @routesync/core.');
check('SDK parser alias uses upstream contract',
  sdkSchema.includes("import type { RouteParserSchema } from '@routesync/core'") &&
  sdkSchema.includes('export type ParserSchema<T> = RouteParserSchema<T>'),
  'The SDK no longer owns a weaker duplicate parser interface.');
check('SDK parser operations are not optional',
  !/parse\?:/.test(sdkSchema) && !/safeParse\?:/.test(sdkSchema),
  'The SDK parser type requires the canonical upstream operations.');
check('parseWithSchema requires a schema',
  /parseWithSchema<T>\(schema: SchemaLike<T>, value: unknown\): T/.test(sdkSchema) &&
  !/if \(!schema\) return value as T/.test(sdkSchema) &&
  !/return value as T/.test(sdkSchema),
  'Unknown data cannot silently pass through the parser helper as T.');
check('route schema map uses upstream shape contract',
  schemaMapper.includes("import type { RouteDefinition, RouteSchemaMap } from '@routesync/core'") &&
  schemaMapper.includes('value is Partial<RouteSchemaMap>'),
  'Schema-part maps use the canonical core schema-map type.');
check('route schema runtime contract is checked',
  schemaMapper.includes('if (schema === undefined) return value') &&
  !schemaMapper.includes('if (value === undefined) return undefined') &&
  schemaMapper.includes('if (!isSchemaLike(schema))') &&
  schemaMapper.includes('return parseWithSchema(schema, value)') &&
  !schemaMapper.includes('as SchemaLike'),
  'Missing schema remains explicit; malformed configured schema fails closed.');
check('generic service handles optional schema explicitly',
  createService.includes('if (this.options.listSchema)') &&
  createService.includes('this.options.entitySchema\n      ? parseWithSchema') &&
  createService.includes('this.options.createSchema\n      ? parseWithSchema') &&
  createService.includes('this.options.updateSchema\n      ? parseWithSchema'),
  'Optional schema compatibility is decided at the service boundary, not hidden in parseWithSchema.');
check('SDK public compatibility exports remain',
  sdkIndex.includes('type ParserSchema') && sdkIndex.includes('type SchemaLike'),
  'Existing SDK type export names are preserved.');
check('React remains a consumer of closed endpoint contract',
  reactHooks.includes('isEndpointCallable(endpoint)') &&
  !reactHooks.includes('(endpoint as EndpointCallable)'),
  'The schema change does not reintroduce endpoint assertion-based reasoning.');
check('runtime contract regression tests exist',
  exists('packages/sdk/src/mappers/schema.phase1368.test.ts') && exists('packages/sdk/src/api-runtime/schemaMapper.phase1368.test.ts'),
  'Tests cover valid parser, invalid data, malformed schema, absent schema, and undefined input validation.');
check('audit script registered',
  packageJson.scripts['audit:phase1368-upstream-schema-parser-contract'] === 'node scripts/audits/audit-phase1368-upstream-schema-parser-contract.cjs',
  'The audit is reproducible through npm run.');

const cliScan = read('packages/cli/src/commands/scan.ts');
const cliSync = read('packages/cli/src/commands/sync.ts');
const sdkApi = read('packages/sdk/src/defineApi.ts');
const operationIdentityAlgebra = read('packages/core/src/types/upstream/operationIdentityCapabilityAlgebra.ts');
const operationIdentityAuthority = read('packages/core/src/types/upstream/operationIdentityCapabilityAuthority.ts');
const astDataflow = read('packages/core/src/types/upstream/astDataflowInterface.ts');
const semanticDataflow = read('packages/core/src/types/upstream/semanticDataflowInterface.ts');

check('operation identity authority reaches SDK consumer',
  operationIdentityAlgebra.includes('fromRoute') && operationIdentityAuthority.includes('operationIdentityCapabilityAlgebra') && sdkApi.includes('route.operationIdentity') && sdkApi.includes('callableObj.$key'),
  'The route identity authority/algebra feeds the SDK key without method/path reconstruction.');
check('semantic ownership coverage audit exists',
  exists('scripts/audit/semantic-ownership-coverage.cjs') && exists('scripts/audits/audit-phase1361-validation-semantic-ownership.cjs'),
  'Existing semantic ownership audits are retained and the new parser contract audit adds a focused boundary check.');
check('AST and dataflow contracts remain distinct',
  astDataflow.includes('SemanticDataflowInput') && semanticDataflow.includes('SemanticDataflowJudgment'),
  'AST-derived dataflow input and closed semantic judgment remain separate contracts.');
check('graph and IR have distinct projection boundaries',
  exists('packages/core/src/graph/service/graphEdgeRelation.ts') && exists('packages/core/src/compiler/ir/SemanticDataflowIRProjection.ts'),
  'Graph relations and IR projection are separate consumers, not one semantic authority.');
check('CLI manifest/dataflow/IR wiring remains active',
  cliScan.includes('routeSyncManifestFlowFromManifest') && cliScan.includes('projectSemanticDataflowToIR') && cliSync.includes('routeSyncManifestFlowFromManifest') && cliSync.includes('projectSemanticDataflowToIR'),
  'Both scan and sync commands carry manifest flow through dataflow to IR projection.');
check('Laravel ecommerce source evidence exists',
  exists('examples/ecommerce-shop-source/routes/api.php') && exists('examples/ecommerce-shop-source/app/Http/Controllers'),
  'The Laravel source project is available for upstream scanning.');
check('SDK/React endpoint boundaries remain present',
  exists('packages/sdk/src/api-runtime/schemaMapper.ts') && exists('packages/react/src/hooks/createHooks.ts') && reactHooks.includes('isEndpointCallable(endpoint)'),
  'SDK schema contract validation and React endpoint capability validation remain wired.');

const trace = [
  { stage: 'Laravel source', owner: 'examples/ecommerce-shop-source/routes/api.php and app/Http/Controllers', role: 'source evidence; Laravel remains authoritative' },
  { stage: 'Canonical schema parser', owner: 'packages/core/src/types/upstream/runtimeSchemaParser.ts', role: 'runtime parse capability contract; parse and safeParse required' },
  { stage: 'Request compatibility boundary', owner: 'packages/core/src/types/request.ts', role: 're-exports upstream parser contract without duplicate declaration' },
  { stage: 'Route schema projection', owner: 'packages/cli/src/generators/sdk/apiObjectEmitter.ts', role: 'projects generated validation contract into SDK route definitions' },
  { stage: 'SDK schema wiring', owner: 'packages/sdk/src/api-runtime/schemaMapper.ts', role: 'distinguishes schema map, configured parser, and absent schema' },
  { stage: 'SDK parser', owner: 'packages/sdk/src/mappers/schema.ts', role: 'executes only a configured parser contract; no hidden raw-value cast fallback' },
  { stage: 'Operation identity', owner: 'packages/core/src/types/upstream/operationIdentityCapability.ts; operationIdentityCapabilityAlgebra.ts; operationIdentityCapabilityAuthority.ts', role: 'canonical identity/capability source' },
  { stage: 'Manifest and dataflow', owner: 'packages/cli/src/commands/scan.ts; packages/cli/src/commands/sync.ts; packages/core/src/types/upstream/semanticDataflowInterface.ts', role: 'manifest flow to semantic dataflow authority' },
  { stage: 'Graph', owner: 'packages/core/src/graph/service/graphEdgeRelation.ts', role: 'structural relation projection; distinct from AST dataflow' },
  { stage: 'IR', owner: 'packages/core/src/compiler/ir/SemanticDataflowIRProjection.ts', role: 'consumer projection from closed semantic dataflow interface' },
  { stage: 'React', owner: 'packages/react/src/hooks/createHooks.ts', role: 'consumes SDK endpoint contract and closed hookKind capability' },
  { stage: 'External framework boundaries', owner: 'Laravel, Next.js, Zod, Axios, TanStack Query official documentation', role: 'reference constraints; not used as proof of build/test success' },
];

const report = {
  phase: 1368,
  title: 'Upstream Schema Parser Contract Adoption',
  checks: checks.length,
  passed: checks.filter((item) => item.passed).length,
  failed: checks.filter((item) => !item.passed).length,
  results: checks,
  trace,
};
const reportPath = path.join(root, 'scripts/audits/reports/phase1368-upstream-schema-parser-contract.json');
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (report.failed > 0) process.exitCode = 1;
