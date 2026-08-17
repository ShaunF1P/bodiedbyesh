import { chromium } from "playwright";
import { execSync } from "child_process";
import fs from "fs";

const brainDir = "C:/Users/shaun/.gemini/antigravity/brain/49886191-7dff-4fc9-bf7e-2daa1ea16fd5";
const screenshotPath = `${brainDir}/github_new_repo.png`;

async function main() {
  console.log("Launching visible Chromium browser...");
  const browser = await chromium.launch({
    headless: false,
    args: ["--start-maximized"],
  });

  const context = await browser.newContext({ viewport: null });
  const page = await context.newPage();

  console.log("Navigating to https://github.com/new?name=bodiedbyesh ...");
  await page.goto("https://github.com/new?name=bodiedbyesh", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);

  // Take screenshot of the opened browser window
  await page.screenshot({ path: screenshotPath, fullPage: false });
  console.log(`[SCREENSHOT_SAVED] Screenshot saved to ${screenshotPath}`);

  // Watch for repo creation in background
  console.log("Browser is open and visible for you. Watching for repository creation...");

  const checkInterval = setInterval(() => {
    try {
      execSync("git ls-remote https://github.com/ShaunF1P/bodiedbyesh.git", { stdio: "pipe" });
      console.log("[REPO_DETECTED] Repository is live! Executing git push now...");
      
      const pushRes = execSync("git push -u origin main", { stdio: "inherit" });
      console.log("[PUSH_SUCCESS] All commits pushed to GitHub main successfully!");
      
      clearInterval(checkInterval);
      setTimeout(async () => {
        await browser.close();
        process.exit(0);
      }, 5000);
    } catch (e) {
      // Still waiting
    }
  }, 2500);
}

main().catch((err) => {
  console.error("Error in browser automation:", err);
});
