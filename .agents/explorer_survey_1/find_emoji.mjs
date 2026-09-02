import fs from "node:fs";
import path from "node:path";

const emojiRegex = /[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F018}-\u{1F270}\u{2388}\u{2B05}\u{2B06}\u{2B07}\u{2B1B}\u{2B1C}\u{2B50}\u{2B55}\u{1F004}\u{1F0CF}\u{1F18E}\u{3030}]/u;

function audit(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const f of files) {
    const full = path.join(dir, f.name);
    if (f.isDirectory() && f.name !== 'node_modules' && f.name !== '.next') {
      audit(full);
    } else if (/\.(tsx|ts|js|jsx|sql)$/.test(f.name)) {
      const txt = fs.readFileSync(full, 'utf8');
      const lines = txt.split('\n');
      lines.forEach((l, idx) => {
        if (emojiRegex.test(l)) {
          console.log(`VIOLATION: ${full}:${idx+1} -> [${l.trim()}]`);
        }
      });
    }
  }
}

console.log("Auditing src and scratch...");
audit("src");
audit("scratch");
console.log("Audit complete.");
