const { test, expect } = require('@playwright/test');

test('should submit survey and display data in reports', async ({ page }) => {
  await page.goto('http://localhost:3000');

  // Login
  await page.fill('#username', 'admin');
  await page.fill('#password', 'AdminPassword1!');
  await page.click('button[onclick="login()"]');

  // Wait for auth screen to be hidden, indicating successful login
  await expect(page.locator('#authScreen')).toBeHidden();

  // Wait for landing page to be visible
  await expect(page.locator('#landingPage')).toBeVisible();

  // Click on the SILNAT survey card
  await page.click('.survey-card[onclick="showSurvey(\'silnat\')"]');

  // Wait for the survey section to be visible
  await expect(page.locator('#silnatSection')).toBeVisible();

  // Fill out the survey form with some test data
  await page.fill('#silnat_1\\.1_form input[name="silnat_a_ht_name"]', 'Test User');
  await page.fill('#silnat_1\\.1_form input[name="silnat_a_ht_contact"]', '1234567890');
  await page.check('#silnat_1\\.1_form input[name="silnat_a_ht_gender"][value="male"]');
  await page.check('#silnat_1\\.1_form input[name="silnat_a_ht_marital_status"][value="single"]');
  await page.selectOption('#silnat_1\\.1_form select[name="silnat_a_ht_highest_qualification"]', 'b_ed');
  await page.selectOption('#silnat_1\\.1_form select[name="silnat_a_ht_years_experience"]', '6_10');

  await page.selectOption('#silnat_1\\.1_form select[id="localGov"]', 'AGEGE');

  // Wait for the school dropdown to be populated
  await page.waitForSelector('#silnat_1\\.1_form select[id="schoolName"] option[value="AARUUN-RASHEED PRY. SCHOOL"]');

  await page.selectOption('#silnat_1\\.1_form select[id="schoolName"]', 'AARUUN-RASHEED PRY. SCHOOL');

  await page.fill('#silnat_1\\.1_form textarea[id="schoolAddress"]', '123 Test Street');
  await page.selectOption('#silnat_1\\.1_form select[name="silnat_b_location_common"]', 'urban');

  await page.fill('#silnat_1\\.1_form input[name="silnat_assemblyDevotion_startTime"]', '08:00');
  await page.fill('#silnat_1\\.1_form input[name="silnat_assemblyDevotion_endTime"]', '08:30');

  await page.fill('#silnat_1\\.1_form input[name="silnat_teachers_male"]', '5');
  await page.fill('#silnat_1\\.1_form input[name="silnat_teachers_female"]', '10');
  await page.fill('#silnat_1\\.1_form input[name="silnat_non_teaching_male"]', '2');
  await page.fill('#silnat_1\\.1_form input[name="silnat_non_teaching_female"]', '3');

  await page.fill('#silnat_1\\.1_form input[name="silnat_pupils_eccde_male"]', '20');
  await page.fill('#silnat_1\\.1_form input[name="silnat_pupils_eccde_female"]', '25');
  await page.fill('#silnat_1\\.1_form input[name="silnat_pupils_primary_male"]', '50');
  await page.fill('#silnat_1\\.1_form input[name="silnat_pupils_primary_female"]', '55');
  await page.fill('#silnat_1\\.1_form input[name="silnat_pupils_special_male"]', '1');
  await page.fill('#silnat_1\\.1_form input[name="silnat_pupils_special_female"]', '2');

  await page.fill('#silnat_1\\.1_form input[name="silnat_additional_staff_required"]', '3');
  await page.fill('#silnat_1\\.1_form input[name="silnat_multigrade_classes"]', '0');

  // Click a radio button in each of the "Needs Assessment" tables to satisfy validation
  await page.check('#silnat_1\\.1_form input[name="discipline_a_1.2"][value="no"]');
  await page.check('#silnat_1\\.1_form input[name="cooperation_a_1.2"][value="no"]');
  await page.check('#silnat_1\\.1_form input[name="communication_a_1.2"][value="no"]');
  await page.check('#silnat_1\\.1_form input[name="community_a_1.2"][value="no"]');
  await page.check('#silnat_1\\.1_form input[name="supervision_a_1.2"][value="no"]');
  await page.check('#silnat_1\\.1_form input[name="records_a_1.2"][value="no"]');
  await page.check('#silnat_1\\.1_form input[name="health_a_1.2"][value="no"]');

  // Fill out some infrastructure fields
  await page.check('#silnat_1\\.1_form input[name="signboard"][value="available_good"]');
  await page.fill('#silnat_1\\.1_form input[name="teachers_furniture_available"]', '15');
  await page.fill('#silnat_1\\.1_form input[name="teachers_furniture_good"]', '15');
  await page.fill('#silnat_1\\.1_form input[name="teachers_furniture_required"]', '0');

  // Submit the survey
  await page.click('#silnat_1\\.1_form button[type="submit"]');

  // Wait for submission feedback
  await expect(page.locator('#silnat_feedback')).toContainText('submitted successfully');

  // Go back to the landing page
  await page.click('button[onclick="backToLanding()"]');
  await expect(page.locator('#landingPage')).toBeVisible();

  // Navigate to the reports page
  await page.click('.survey-card[onclick="window.location.href=\'reports.html\'"]');

  // Wait for the reports page to load and check for the submitted data
  await page.waitForURL('**/reports.html');

  // Check that the table contains the submitted school name
  await expect(page.locator('table')).toContainText('AARUUN-RASHEED PRY. SCHOOL');

  // Take a screenshot for verification
  await page.screenshot({ path: 'jules-scratch/verification/reports_page.png' });
});
