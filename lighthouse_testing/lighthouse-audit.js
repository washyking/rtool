import puppeteer from 'puppeteer';
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';

import fs from 'fs';


(async () => {
  const BASE_URL = 'http://localhost:8080'; // Local host

  // Step 1: Use Puppeteer to crawl all links
  console.log('Crawling website...');
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(BASE_URL);

  // Extract all unique URLs from the page
  const links = await page.evaluate(() =>
    Array.from(document.querySelectorAll('a[href]'), (a) => a.href)
  );

  // Filter for internal links (same origin) and remove duplicates
  const uniqueLinks = Array.from(new Set(links)).filter((url) =>
    url.startsWith(BASE_URL)
  );

  console.log(`Discovered ${uniqueLinks.length} page(s):`, uniqueLinks);
  await browser.close();

  // Step 2: Run Lighthouse Audit for Each Discovered Page
  console.log('Starting Lighthouse audits...');
  const results = {};

  for (const url of uniqueLinks) {
    console.log(`Auditing: ${url}`);
    const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });

    const options = {
      logLevel: 'info',
      output: 'html',
      onlyCategories: ['performance', 'accessibility', 'seo'], // Categories to assess URLs for
      port: chrome.port,
    };

    const runnerResult = await lighthouse(url, options);

    // Save results as HTML for each page
    const reportHtml = runnerResult.report;
    const fileName = `lighthouse-report-${url.replace(BASE_URL, '').replace(/\//g, '_')}.html`;
    fs.writeFileSync(fileName, reportHtml);

    console.log(`Report saved: ${fileName}`);
    results[url] = runnerResult.lhr.categories;

    await chrome.kill();
  }

  // Step 3: Save Summary of Results
  fs.writeFileSync('lighthouse-summary.json', JSON.stringify(results, null, 2));
  console.log('Summary saved: lighthouse-summary.json');
})();
