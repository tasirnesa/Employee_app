const { execSync } = require('child_process');
const fs = require('fs');

console.log('Installing puppeteer...');
try {
  execSync('npm install --no-save puppeteer', { stdio: 'inherit' });
} catch (e) {
  console.log('Puppeteer install failed, trying playwright...');
  execSync('npm install --no-save playwright', { stdio: 'inherit' });
}

// Fallback logic
(async () => {
  try {
    const puppeteer = require('puppeteer');
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
    page.on('pageerror', err => console.error('BROWSER ERROR:', err.toString()));
    
    console.log('Navigating to http://localhost:5173/login ...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0', timeout: 15000 });
    
    console.log('Navigation complete. Closing.');
    await browser.close();
  } catch (err) {
    console.error('Script failed:', err);
  }
})();
