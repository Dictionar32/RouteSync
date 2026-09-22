const { PhpCodeParser } = require('../dist/cli.js');
console.log(JSON.stringify(PhpCodeParser.parseExpression("Category::orderBy('nama')->get(['id', 'nama'])"), null, 2));
