const fs = require('fs');
['src/lib/data/quilts.ts', 'src/lib/data/stats.ts', 'src/lib/data/usage.ts'].forEach(f => {
  let lines = fs.readFileSync(f, 'utf8').split('\n');
  lines = lines.filter(l => !l.includes('import { cache } from \'react\''));
  fs.writeFileSync(f, lines.join('\n'));
});
console.log('Done cleaning cache imports.');
