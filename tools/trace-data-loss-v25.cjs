#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(process.argv[2] || process.cwd());
const read = rel => {
  const file = path.join(root, rel);
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
};
const exists = rel => fs.existsSync(path.join(root, rel));
const lineOf = (text, index) => text.slice(0, index).split('\n').length;
const walk = (dir, out = []) => {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', 'dist', '.git'].includes(entry.name)) continue;
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file, out);
    else out.push(file);
  }
  return out;
};
const files = walk(path.join(root, 'packages/core/src'));
const scannerFiles = files.filter(f => /compiler\/scanner\/.+\.ts$/.test(f));
const rel = f => path.relative(root, f).replaceAll(path.sep, '/');

const expectedCategories = [
  'models','resources','requests','routes','controllers','services','migrations',
  'responses','dtos','middlewares','providers','attributes','channels'
];

const findings = [];
const evidence = [];
const add = (severity, kind, detail, repair) => findings.push({ severity, kind, detail, repair });
const has = (relPath, re) => re.test(read(relPath));

if (!exists('packages/core/src/compiler/scanner/orchestrator/sourceAstScanner.ts')) {
  add('critical', 'workspace_not_route_sync', 'Canonical source AST orchestrator is missing from supplied root.', 'Run this tool from the RouteSync repository root.');
}

const sourceAst = read('packages/core/src/compiler/scanner/orchestrator/sourceAstScanner.ts');
const pipeline = read('packages/core/src/compiler/scanner/orchestrator/pipelineScanner.ts');
const ast = read('packages/core/src/types/upstream/ast.ts');
const collections = read('packages/core/src/types/upstream/collections.ts');

// 1. Source category completeness: both SourceAsts and the completeness vocabulary must agree.
const missingCollections = expectedCategories.filter(c => !new RegExp(`\\b${c}\\s*:`).test(collections));
const missingAstTypes = expectedCategories.filter(c => c !== 'channels' && !new RegExp(`\\b${c.slice(0,-1)[0].toUpperCase()}\\w*Ast\\b`).test(ast));
if (missingCollections.length) add('critical', 'source_category_missing_from_adt', { missing: missingCollections }, 'Add the category to the existing SourceAsts ADT and completeness vocabulary; do not create a parallel collection.');

// 2. Canonical producer double interpretation: scanAsts + scan of same category in one source boundary.
const scannerMap = {
  models: 'ModelScanner',
  requests: 'FormRequestScanner',
  controllers: 'ControllerScanner',
  resources: 'ResourceScanner',
  routes: 'RouteScanner'
};
const hiddenRescans = [];
for (const [category, scanner] of Object.entries(scannerMap)) {
  const astCall = new RegExp(`${scanner}\\.scan(?:CanonicalAsts|Asts)\\s*\\(\\s*projectRoot`, 'g');
  const plainCall = new RegExp(`${scanner}\\.scan\\s*\\(\\s*projectRoot`, 'g');
  const astHits = [...sourceAst.matchAll(astCall)].map(m => lineOf(sourceAst, m.index));
  const plainHits = [...sourceAst.matchAll(plainCall)].map(m => lineOf(sourceAst, m.index));
  if (astHits.length && plainHits.length) {
    hiddenRescans.push({ category, scanner, astHits, plainHits });
    add('critical', 'hidden_rescan_after_ast_origin', { category, scanner, astHits, plainHits }, 'Make one canonical source interpretation pass produce the authoritative existing high-level model, then adapt it to the AST boundary without rescanning projectRoot.');
  }
}

// 3. Pipeline projectRoot rescans after sourceAst boundary.
const pipelineScanners = ['ModelScanner','FormRequestScanner','ControllerScanner','ResourceScanner','RouteScanner','ChannelScanner'];
const pipelineRescans = [];
for (const scanner of pipelineScanners) {
  const re = new RegExp(`${scanner}\\.scan\\s*\\(\\s*projectRoot`, 'g');
  const hits = [...pipeline.matchAll(re)].map(m => lineOf(pipeline, m.index));
  if (hits.length) {
    pipelineRescans.push({ scanner, lines: hits });
    add('critical', 'pipeline_rescan_after_ast', { scanner, lines: hits }, 'Consume SourceAsts/high-level upstream data already produced at the origin boundary. Strengthen the existing ADT if required data is missing; never add a cast to bypass the gap.');
  }
}

// 4. AST construction proof: declared Ast must be explicitly constructed in producer files.
const astKinds = [...ast.matchAll(/export type (\w+Ast)\s*=\s*\{\s*readonly kind:\s*['\"]([^'\"]+)['\"]/g)].map(m => ({ type: m[1], kind: m[2] }));
const construction = [];
for (const item of astKinds.filter(item => item.type !== 'CompleteSourceAst')) {
  const kindRe = new RegExp(`kind\\s*:\\s*['"]${item.kind.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`);
  const producers = files.filter(f => { if (!/scanner/.test(f)) return false; return kindRe.test(fs.readFileSync(f,'utf8')); }).map(rel);
  construction.push({ ...item, producers });
  if (!producers.length) add('critical', 'adt_construction_unproven', item, 'Locate or implement an explicit constructor/adapter for the declared ADT using the existing semantic model.');
}

// 5. Existing high-level semantic payload proof for the critical categories.
const payloadChecks = [
  ['RequestAst', /RequestAst\s*=\s*\{[\s\S]*?definition:\s*RequestDefinition/, /FormRequestSource/],
  ['ControllerAst', /ControllerAst\s*=\s*\{[\s\S]*?action:\s*ControllerAction/, /ControllerAction/],
  ['ResourceAst', /ResourceAst\s*=\s*\{[\s\S]*?definition:\s*ResourceDefinition/, /ParsedResource/],
  ['RouteAst', /RouteAst\s*=\s*\{[\s\S]*?definition:\s*RouteDefinition/, /ParsedRoute/]
];
for (const [name, declaration, desired] of payloadChecks) {
  const declared = declaration.test(ast);
  const desiredName = desired.source.match(/[A-Z][A-Za-z]+/)[0];
  const strengthened = desired.test(ast);
  if (declared && !strengthened) {
    add('high', 'semantic_projection_gap', { ast: name, current: 'lower-level definition', missingAuthoritativePayload: desiredName }, 'Promote the existing high-level semantic model into this existing AST boundary; do not introduce a parallel interface.');
  }
}

// 6. Free-data / fallback audit with semantic-boundary classification.
// Parser-internal optional access is REVIEW, not automatic loss. Only fallback that supplies
// semantic meaning is HIGH. This prevents the tool from treating every ?. as data loss.
const boundaryFiles = [
  'packages/core/src/types/upstream',
  'packages/core/src/compiler/scanner/orchestrator',
  'packages/core/src/compiler/scanner/subscanners'
].flatMap(dir => walk(path.join(root, dir)));
const freeData = [];
const semanticFallbackPatterns = [
  { re: /\b(?:semanticType|primKind|semantic|meaning|presence|responseType|resourceType|modelType|requestType|schemaType)\b[^\n;]*\?\?/, kind: 'semantic_nullish_fallback' },
  { re: /\b(?:semanticType|primKind|semantic|meaning|presence|responseType|resourceType|modelType|requestType|schemaType)\b[^\n;]*\|\|/, kind: 'semantic_or_fallback' }
];
for (const file of boundaryFiles) {
  const text = fs.readFileSync(file, 'utf8');
  const relFile = rel(file);
  const lines = text.split('\n');
  const records = [...text.matchAll(/\b(?:Readonly<)?Record\s*</g)].map(m => lineOf(text, m.index));
  if (records.length) freeData.push({ file: relFile, kind: 'free_record', severity: 'high', lines: records });
  const maps = [...text.matchAll(/\b(?:new\s+)?Map\s*</g)].map(m => lineOf(text, m.index));
  if (maps.length) freeData.push({ file: relFile, kind: 'runtime_index', severity: 'review', lines: maps });
  for (const [index, line] of lines.entries()) {
    if (/\?\?|\?\./.test(line)) {
      const semantic = semanticFallbackPatterns.find(x => x.re.test(line));
      freeData.push({
        file: relFile,
        kind: semantic ? semantic.kind : (line.includes('??') ? 'nullish_nonsemantic_or_unproven' : 'optional_access'),
        severity: semantic ? 'high' : 'review',
        lines: [index + 1],
        evidence: line.trim()
      });
    }
  }
}
for (const item of freeData) {
  if (item.severity === 'review') continue;
  add('high', 'semantic_boundary_free_data_or_fallback', item, 'Trace the missing invariant upstream. Replace semantic fallback with explicit ADT data; parser-internal optional access must remain classified as review rather than data-loss proof.');
}

// 7. Fail-closed completeness proof: discovered_empty is not sufficient for a "complete" source proof.
const completeness = read('packages/core/src/types/upstream/completeness.ts');
if (/discovered_empty/.test(completeness) && /completeSourceProof/.test(completeness)) {
  add('high', 'empty_discovery_can_pass_completeness', { file: 'packages/core/src/types/upstream/completeness.ts' }, 'Completeness must distinguish scanned-empty from semantically verified-empty and require category coverage/provenance before issuing completeSourceProof.');
}

// 8. Source boundary union must cover every SourceAsts category.
const boundary = read('packages/core/src/types/upstream/sourceBoundary.ts');
if (boundary && /CanonicalSourceNode/.test(boundary)) {
  const channelCovered = /ChannelAst|channel_ast/.test(boundary);
  if (!channelCovered) add('high', 'source_boundary_category_gap', { category: 'channels', file: 'packages/core/src/types/upstream/sourceBoundary.ts' }, 'Extend the existing source-boundary ADT to include the channel AST rather than handling channels outside the canonical vocabulary.');
}

// 9. Report source inventory. Never use legacy manifest as evidence.
const sourceDir = path.join(root, 'examples/ecommerce-shop-source');
const phpFiles = walk(sourceDir).filter(f => f.endsWith('.php')).map(rel);
const legacyManifest = ['routesync.manifest.json','routesync.graph.json'].filter(name => exists(name));

const critical = findings.filter(f => f.severity === 'critical').length;
const high = findings.filter(f => f.severity === 'high').length;
const status = critical ? 'REPAIR_REQUIRED' : high ? 'REVIEW_REQUIRED' : 'CLEAN';

const report = {
  schema: 'routesync.data-loss-trace/v25',
  status,
  target: 'Laravel ecommerce-shop -> PHP AST/ADT -> high-level upstream model -> SourceAsts -> manifest',
  method: {
    failClosed: true,
    legacyManifestRejected: true,
    rules: [
      'A declared AST type is valid only when an explicit constructor/adapter is proven.',
      'An AST producer must not call the same source scanner again for the same category.',
      'The pipeline must consume the origin-boundary AST/model and must not rescan projectRoot.',
      'Existing high-level semantic models are authoritative; no parallel production interfaces.',
      'Semantic fallbacks and free Record-based contracts are findings; runtime Map is review-only unless it crosses a semantic boundary.',
      'A complete proof cannot be issued merely because a category is scanned-empty.'
    ]
  },
  sourceEvidence: {
    project: 'examples/ecommerce-shop-source',
    phpFiles: phpFiles.length,
    legacyManifestRejected: true,
    legacyArtifactsPresent: legacyManifest
  },
  coverage: {
    expectedCategories: expectedCategories,
    sourceAstsMissing: missingCollections,
    sourceBoundaryChannelCovered: boundary ? /ChannelAst|channel_ast/.test(boundary) : false
  },
  hiddenRescans,
  pipelineRescans,
  astConstruction: construction,
  freeDataAudit: freeData,
  findings,
  summary: { critical, high, hiddenRescans: hiddenRescans.length, pipelineRescans: pipelineRescans.length, freeDataFindings: freeData.filter(x => x.severity === 'high').length },
  repairOrder: [
    '1. Repair missing SourceAsts categories / canonical source-boundary vocabulary.',
    '2. Remove hidden scanAsts -> scan double interpretation at the origin boundary.',
    '3. Promote existing high-level semantic payloads into existing AST ADTs where projections are lossy.',
    '4. Remove pipeline projectRoot rescans only after field-level lineage is proven.',
    '5. Make completeness proof fail closed for unverified empty categories.',
    '6. Re-run against fresh ecommerce-shop source AST output; never validate from the legacy manifest.'
  ]
};

const out = path.join(root, 'data-loss-trace-v25.json');
fs.writeFileSync(out, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ out, status, phpFiles: phpFiles.length, critical, high, hiddenRescans: hiddenRescans.length, pipelineRescans: pipelineRescans.length, freeDataFindings: report.summary.freeDataFindings }, null, 2));
