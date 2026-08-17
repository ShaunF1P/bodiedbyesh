import { execSync } from "child_process";

console.log("================================================================================");
console.log("  WATCHING FOR GITHUB REPOSITORY 'ShaunF1P/bodiedbyesh' CREATION...");
console.log("================================================================================");

let attempts = 0;
const maxAttempts = 60; // 3 minutes total

function pollAndPush() {
  attempts++;
  try {
    const ls = execSync("git ls-remote https://github.com/ShaunF1P/bodiedbyesh.git", { stdio: "pipe" });
    console.log("[SUCCESS] Repository detected on GitHub! Pushing 'main' branch now...");
    
    const pushOutput = execSync("git push -u origin main", { stdio: "inherit" });
    console.log("[SUCCESS] Successfully pushed all commits to GitHub!");
    process.exit(0);
  } catch (err) {
    if (attempts % 5 === 0) {
      console.log(`Waiting for repository creation... (Attempt ${attempts}/${maxAttempts})`);
    }
    if (attempts >= maxAttempts) {
      console.log("[TIMEOUT] Timed out waiting for repository creation.");
      process.exit(1);
    }
    setTimeout(pollAndPush, 3000);
  }
}

pollAndPush();
