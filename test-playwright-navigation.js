const { chromium } = require('playwright');

(async () => {
  console.log('🚀 Starting Playwright browser automation...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500 // Slow down for visibility
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();
  const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGU3ZjEwNWVjM2I0YmNhZGRmOTcyZjciLCJpYXQiOjE3NjQ4Nzg1MjMsImV4cCI6MTc2NTQ4MzMyM30.AH3dO8IPGYd_T3wce9o0CVmWrVeDnuMiJzbFct8mOOM';

  // Navigate to home first
  console.log('📍 Navigating to home page...');
  await page.goto('http://localhost:3000');

  // Set token in localStorage
  await page.evaluate((token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('authToken', token);
  }, TOKEN);

  console.log('✅ Authentication token set\n');

  const pages = [
    { name: 'Restaurant Dashboard', url: 'http://localhost:3000/restaurant', file: 'dashboard' },
    { name: 'Menu', url: 'http://localhost:3000/restaurant/menu', file: 'menu' },
    { name: 'Orders', url: 'http://localhost:3000/restaurant/orders', file: 'orders' },
    { name: 'Staff', url: 'http://localhost:3000/restaurant/staff', file: 'staff' },
    { name: 'Settings', url: 'http://localhost:3000/restaurant/settings', file: 'settings' },
    { name: 'Analytics', url: 'http://localhost:3000/restaurant/analytics', file: 'analytics' },
    { name: 'Delivery', url: 'http://localhost:3000/restaurant/delivery', file: 'delivery' }
  ];

  for (const pageInfo of pages) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📄 Page: ${pageInfo.name}`);
    console.log(`🔗 URL: ${pageInfo.url}`);

    try {
      await page.goto(pageInfo.url, { waitUntil: 'domcontentloaded', timeout: 10000 });
      console.log('   ⏳ Waiting for page to load...');

      await page.waitForTimeout(3000);

      // Get page title
      const title = await page.title();
      console.log(`   📌 Page Title: ${title}`);

      // Check if there are any error messages
      const errorElement = await page.$('[class*="error"], [class*="Error"]');
      if (errorElement) {
        const errorText = await errorElement.textContent();
        console.log(`   ⚠️  Error on page: ${errorText}`);
      }

      // Take screenshot
      const screenshotPath = `/tmp/screenshot-${pageInfo.file}.png`;
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`   📸 Screenshot saved: ${screenshotPath}`);

      // Get some basic page info
      const h1 = await page.$('h1');
      if (h1) {
        const h1Text = await h1.textContent();
        console.log(`   📝 Main Heading: ${h1Text}`);
      }

      // Count navigation links
      const navLinks = await page.$$('nav a, [role="navigation"] a');
      console.log(`   🔗 Navigation links found: ${navLinks.length}`);

      console.log('   ✅ Page tested successfully');

    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✨ All pages have been tested!');
  console.log('📁 Screenshots saved in /tmp/ directory');
  console.log('🌐 Browser will remain open for 30 seconds for manual inspection...\n');

  await page.waitForTimeout(30000);

  await browser.close();
  console.log('👋 Browser closed. Test complete!');
})();
