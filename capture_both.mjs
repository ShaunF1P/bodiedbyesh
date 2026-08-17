import { chromium } from "playwright";
import path from "path";

const brainDir = "C:/Users/shaun/.gemini/antigravity/brain/f4ec8515-4a6e-428a-8275-a6d1f0b90873";

async function run() {
  console.log("Launching browser...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });
  const page = await context.newPage();

  // 1. Capture local homepage header logo
  console.log("Navigating to local home page...");
  await page.goto("http://localhost:3000");
  await page.waitForTimeout(2000);
  
  // Crop specifically the header logo container
  const logoSelector = 'header a';
  const logoElement = await page.locator(logoSelector).first();
  if (await logoElement.count() > 0) {
    await logoElement.screenshot({ path: path.join(brainDir, "local_header_logo.png") });
    console.log("Saved local_header_logo.png");
  }

  // 2. Capture live homepage header logo
  console.log("Navigating to live home page...");
  try {
    await page.goto("https://bodiedbyesh.com");
    await page.waitForTimeout(2000);
    const liveLogoElement = await page.locator(logoSelector).first();
    if (await liveLogoElement.count() > 0) {
      await liveLogoElement.screenshot({ path: path.join(brainDir, "live_header_logo.png") });
      console.log("Saved live_header_logo.png");
    }
  } catch (err) {
    console.error("Failed to fetch live site:", err.message);
  }

  // 3. Go to logo-review page and check what is selected
  console.log("Navigating to local logo-review page...");
  await page.goto("http://localhost:3000/logo-review");
  await page.waitForTimeout(1000);

  // Enter passcode
  await page.fill('input[placeholder="Enter passcode"]', "bodiedbyesh");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);

  // Take screenshot of the selected logo display board
  const board = await page.locator('.aspect-\\[16\\/9\\]');
  if (await board.count() > 0) {
    await board.screenshot({ path: path.join(brainDir, "review_page_active_board.png") });
    console.log("Saved review_page_active_board.png");
  }

  await browser.close();
  console.log("Done!");
}

run().catch(console.error);
