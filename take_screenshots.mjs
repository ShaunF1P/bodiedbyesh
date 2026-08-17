import { chromium } from "playwright";

const brainDir = "C:/Users/shaun/.gemini/antigravity/brain/f4ec8515-4a6e-428a-8275-a6d1f0b90873";

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  // Go to brand guide
  await page.goto("http://localhost:3000/brand-guide", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);

  // Click on Logo Assets tab
  const logoTab = page.locator("button", { hasText: "Logo Assets" });
  await logoTab.click();
  await page.waitForTimeout(2000);

  // Screenshot just the first logo card (approved primary)
  const firstCard = page.locator(".glass-panel").first();
  await firstCard.screenshot({ path: `${brainDir}/logo_b_defect_check.png` });
  console.log("Card screenshot saved!");

  // Also take a zoomed-in screenshot of the whole page for context
  await page.screenshot({ path: `${brainDir}/brand_guide_logos_updated.png`, fullPage: true });
  console.log("Full page screenshot saved!");

  await browser.close();
}

run().catch((err) => { console.error(err); process.exit(1); });
