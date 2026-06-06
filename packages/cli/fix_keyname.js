const fs = require('fs')
const file = 'src/generators/ZodTierGenerator.ts'
let content = fs.readFileSync(file, 'utf8')

// The 3-line path/resource/TitleCaseResource block
// nameParts line + resource line + TitleCaseResource line
const lines = content.split('\n')
const result = []
let i = 0
let count = 0

while (i < lines.length) {
  const l0 = lines[i]
  const l1 = lines[i + 1]
  const l2 = lines[i + 2]

  if (
    l0 && l1 && l2 &&
    l0.includes("const nameParts = route.path.replace(/^\\//, '').split('/')") &&
    l1.includes("const resource = nameParts[0].replace(") &&
    l2.includes("const TitleCaseResource = toTypeName(resource)")
  ) {
    // Detect indentation from l2
    const indent = l2.match(/^(\s*)/)[1]
    result.push(
      indent + "const TitleCaseResource = toTypeName(route.groupName || (route.path || '').replace(/^\\//, '').split('/')[0].replace(/\\{.*\\}/, '') || 'App')"
    )
    count++
    i += 3
    // skip blank line between the 3 lines if any
    continue
  }

  result.push(l0)
  i++
}

fs.writeFileSync(file, result.join('\n'))
console.log('Replacements made:', count)
