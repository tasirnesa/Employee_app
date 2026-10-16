const { execSync } = require('child_process');

console.log('Fetching browser logs...');
try {
  execSync('cmd.exe /c npm install --no-save puppeteer', { stdio: 'inherit' });
} catch (e) {
  console.log('Puppeteer install failed!');
}

(async () => {
  try {
    const puppeteer = require('puppeteer');
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('BROWSER_CONSOLE:', msg.text()));
    page.on('pageerror', err => console.error('BROWSER_ERROR:', err.toString()));
    
    console.log('Navigating to http://localhost:5173/login ...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2', timeout: 20000 });
    
    console.log('Navigation complete. Closing.');
    await browser.close();
  } catch (err) {
    console.error('Script failed:', err);
  }
})();
