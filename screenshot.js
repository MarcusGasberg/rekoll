import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 }
  });
  
  // Navigate to the website
  await page.goto('http://localhost:4173', { waitUntil: 'networkidle' });
  
  // Wait a moment for any animations to settle
  await page.waitForTimeout(2000);
  
  // Take screenshot of the hero section (top part of page)
  await page.screenshot({ 
    path: '/data/workspace/rekoll/before-screenshot.png',
    fullPage: false
  });
  
  console.log('Screenshot saved: before-screenshot.png');
  await browser.close();
})();