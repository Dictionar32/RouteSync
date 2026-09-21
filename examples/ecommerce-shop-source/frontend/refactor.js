const fs = require('fs');
const path = require('path');

const dirs = [
  'src/components/layout',
  'src/components/shared',
];

function processDir(dir) {
  const fullPath = path.join(__dirname, dir);
  if (!fs.existsSync(fullPath)) return;
  const entries = fs.readdirSync(fullPath, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      processDir(path.join(dir, entry.name));
    } else if (entry.name.endsWith('.styles.ts')) {
      const filePath = path.join(fullPath, entry.name);
      let content = fs.readFileSync(filePath, 'utf-8');

      content = content.replace(/tw\.([a-zA-Z0-9_]+)`([^`]+)`/g, (match, tag, classes) => {
        return `tw.${tag}({ base: "${classes}" })`;
      });

      content = content.replace(/tw\(([^)]+)\)`([^`]+)`/g, (match, comp, classes) => {
        return `tw(${comp})({ base: "${classes}" })`;
      });

      fs.writeFileSync(filePath, content, 'utf-8');
      console.log(`Updated ${filePath}`);
    }
  }
}

for (const dir of dirs) {
  processDir(dir);
}
