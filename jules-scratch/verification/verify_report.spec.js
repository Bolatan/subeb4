const { test, expect } = require('@playwright/test');

test('should display submitted survey data in reports', async ({ page }) => {
  // First, run the submission script
  const { execSync } = require('child_process');
  execSync('node jules-scratch/verification/submit_survey.js');

  // Now, verify the report
  await page.goto('http://localhost:3000/reports.html');

  // Wait for the reports page to load and check for the submitted data
  await page.waitForURL('**/reports.html');

  // Check that the table contains the submitted school name
  await expect(page.locator('table')).toContainText('AARUUN-RASHEED PRY. SCHOOL');

  // Take a screenshot for verification
  await page.screenshot({ path: 'jules-scratch/verification/final_report_page.png' });
});
