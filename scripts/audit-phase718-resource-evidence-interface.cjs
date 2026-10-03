const fs = require('node:fs');
const root = process.cwd();
const scanner = fs.readFileSync(`${root}/packages/core/src/compiler/scanner/subscanners/ResourceScanner.ts`, 'utf8');
const barrel = fs.readFileSync(`${root}/packages/core/src/compiler/scanner/symbols/resource/index.ts`, 'utf8');
const checks = {
  closedResourceScanEvidence: /interface ResourceScanEvidence\s*\{[\s\S]*kind: 'resource_scan_evidence'/.test(scanner),
  separatedIdentityEvidence: /interface ResourceScanIdentityEvidence\s*\{/.test(scanner),
  separatedSyntaxEvidence: /interface ResourceScanSyntaxEvidence\s*\{/.test(scanner),
  noParsedResourceFile: !/interface ParsedResourceFile|ParsedResourceFile\[\]/.test(scanner),
  bindingUsesEvidenceBoundary: /evidence: ResourceScanEvidence/.test(scanner),
  evidenceFeedsCanonicalBinder: /SemanticResourceBinder\.bindResourceAst/.test(scanner),
  singleBindingSourceExport: (barrel.match(/ResourceModelBindingSource/g) || []).length === 1,
};
const failed = Object.entries(checks).filter(([,v]) => !v).map(([k]) => k);
console.log(JSON.stringify({phase:718, checks, pass: failed.length === 0, failed}, null, 2));
process.exitCode = failed.length ? 1 : 0;
