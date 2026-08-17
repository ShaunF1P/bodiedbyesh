import fs from "fs";
import { execSync } from "child_process";

console.log("================================================================================");
console.log("  TRIGGERING LIVE VERCEL PRODUCTION DEPLOYMENT FOR BODIEDBYESH.COM");
console.log("================================================================================");

let token = process.env.VERCEL_TOKEN;

if (!token && fs.existsSync(".env.local")) {
  const txt = fs.readFileSync(".env.local", "utf8");
  const match = txt.match(/VERCEL_TOKEN=([^\r\n]+)/);
  if (match && match[1].trim()) {
    token = match[1].trim().replace(/^["']|["']$/g, "");
  }
}

if (!token) {
  console.error("[ERROR] VERCEL_TOKEN not found in environment or .env.local");
  process.exit(1);
}

console.log("Authenticating with Vercel and deploying live to production...");

try {
  execSync(`npx vercel --prod --yes --token ${token}`, {
    stdio: "inherit",
    encoding: "utf8",
  });
  console.log("================================================================================");
  console.log("  [SUCCESS] PRODUCTION DEPLOYMENT COMPLETE! LIVE AT BODIEDBYESH.COM");
  console.log("================================================================================");
} catch (err) {
  console.error("[ERROR] Vercel deploy error:", err.message);
  process.exit(1);
}
