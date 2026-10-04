const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const files = [
  'packages/core/src/compiler/types/system/subtypingChecker.ts',
  'packages/core/src/compiler/types/system/assignabilityChecker.ts',
  'packages/core/src/compiler/domain/common/semantic-resolver/compoundHandlers.ts',
  'packages/core/src/compiler/scanner/subscanners/request-deriver/responseDeriver.ts',
];
const text = file => fs.readFileSync(path.join(root, file), 'utf8');
const contents = files.map(file => ({ file, source: text(file) }));
const all = contents.map(({ source }) => source).join('\n');

const result = {
  relationVariantAuthority: contents.every(({ source }) => source.includes('relationVariantFold')),
  noSemanticTypeExtractCasts: !all.includes('as Extract<SemanticType'),
  noParsedDescriptor: !all.includes('ParsedDescriptor') && !all.includes('parsedDescriptor'),
  noUnknownAny: !/\b(?:unknown|any)\b/.test(all),
};
result.allPass = Object.values(result).every(Boolean);
console.log(JSON.stringify(result, null, 2));
process.exitCode = result.allPass ? 0 : 1;
