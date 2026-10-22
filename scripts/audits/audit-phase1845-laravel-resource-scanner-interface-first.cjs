const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const pipeline = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelResourceScanner.ts');
const sourceEvidence = read('packages/core/src/compiler/scanner/lexer/resourceSourceEvidence.ts');
const contract = read('packages/core/src/types/upstream/laravelResourceScannerInterface.ts');
const sourceAsts = read('packages/core/src/types/upstream/collections.ts');
const packageJson = JSON.parse(read('package.json'));
const checks = [
  ['resource scanner contract is versioned and receives the complete controller judgment', /contractVersion: 10/.test(contract) && /readonly controllerScan: LaravelControllerScanJudgment/.test(contract)],
  ['model definitions and ASTs are separate semantic input and projection surfaces', /readonly modelDefinitions: readonly ModelDefinition\[\]/.test(contract) && /readonly modelAsts: readonly ModelAst\[\]/.test(contract)],
  ['resolved resources require a resolved binding judgment', /ResolvedResourceModelBindingJudgment/.test(contract) && /readonly outcome: Extract<ResourceModelBindingOutcome, \{ readonly kind: 'resolved' \}>/.test(contract)],
  ['unresolved and ambiguous resource bindings remain explicit rejections', /LaravelResourceRejectedArtifact/.test(contract) && /readonly rejected: readonly LaravelResourceRejectedArtifact\[\]/.test(contract) && /readonly modelBinding: ResourceModelBindingJudgment/.test(contract)],
  ['production pipeline calls the resource scanner interface implementation', /laravelResourceScanner\.scan\(/.test(pipeline) && /bindingAuthority: resourceModelBindingAuthority/.test(pipeline)],
  ['production pipeline no longer calls ResourceScanner or ControllerScanner legacy bundle', !/ResourceScanner\.scanCanonicalBundle/.test(pipeline) && !/ControllerScanner\.scanCanonicalBundle/.test(pipeline) && !/ControllerScanner\.extractResourceDataflow/.test(pipeline)],
  ['production AST and definitions derive from the same resolved resource artifacts', /resourceScan\.resources\.map\(artifact => artifact\.ast\)/.test(pipeline) && /resourceScan\.resources\.map\(artifact => artifact\.definition\)/.test(pipeline)],
  ['SourceAsts preserves the complete resource scan judgment', /readonly resourceScan: import\('\.\/laravelResourceScannerInterface'\)\.LaravelResourceScanJudgment/.test(sourceAsts) && /resourceScan,/.test(pipeline)],
  ['resource scanner passes the whole controller scan to the binding authority', /controllerScan: input\.controllerScan/.test(scanner) && /input\.bindingAuthority\.judgeBatch/.test(scanner)],
  ['only authority-resolved models are passed to ResourceProducer', /relationRefine\(outcome, isResolved\)/.test(scanner) && /model: Object/.test(scanner) === false && /model,/.test(scanner) && /candidate\.candidate\.model\.identity\.name/.test(scanner)],
  ['resource source evidence extraction does not make model-binding decisions', /scanResourceSourceEvidence/.test(sourceEvidence) && !/ResourceModelBindingJudgmentAuthority/.test(sourceEvidence) && !/resourceProducer/.test(sourceEvidence)],
  ['legacy ResourceScanner implementation and export are retired', !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/subscanners/ResourceScanner.ts')) && !/ResourceScanner/.test(read('packages/core/src/compiler/scanner/subscanners/index.ts')) && !/from ['"]\.\.\/subscanners\/ResourceScanner['"]/.test(scanner)],
  ['resource source evidence preserves file provenance, PHP syntax, and nested resource relation facts', /sourceFile: SemanticValueFactory\.sourceFilePath\(fullPath\)/.test(sourceEvidence) && /entries: parsedArray\.entries/.test(sourceEvidence) && /sourceLength: source\.length/.test(sourceEvidence) && /resourceRelationEvidence\(resourceName/.test(sourceEvidence) && /evidence => evidence\.relations/.test(scanner)],
  ['implementation does not depend on semantic foundation or use casts', !/semantic\/foundation/.test(scanner) && !/\bas\s+(?:unknown|any)\b/.test(scanner)],
  ['audit command is registered', packageJson.scripts?.['audit:phase1845-laravel-resource-scanner-interface-first'] === 'node scripts/audits/audit-phase1845-laravel-resource-scanner-interface-first.cjs'],
];
for (const [label, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`);
const passed = checks.filter(([, value]) => value).length;
console.log(`${passed}/${checks.length} checks passed`);
if (passed !== checks.length) process.exitCode = 1;
