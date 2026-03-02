import { chromium } from 'playwright';
import path from 'path';

async function verifyFeatures() {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    const outDir = process.env.OUT_DIR || 'C:\\Users\\Stefan\\.gemini\\antigravity\\brain\\89f50846-19d0-42b6-8749-4aac5342cf09';

    console.log("Navigating to app...");
    await page.goto('http://localhost:5173');

    // Verify Checklists
    console.log("Verifying Checklists...");
    await page.click('text="Checklists"');
    await page.waitForTimeout(2000);

    const checklistPath = path.join(outDir, 'verify_checklists_nav_success.png');
    await page.screenshot({ path: checklistPath });
    console.log("Saved Checklists screenshot to", checklistPath);

    await browser.close();
}

verifyFeatures().catch(console.error);
