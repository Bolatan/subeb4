import asyncio
from playwright.async_api import async_playwright, expect

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)  # Set to False to watch execution
        page = await browser.new_page()

        try:
            # Navigate to the login page
            await page.goto("http://localhost:3000")

            # Fill in login credentials and click login
            await page.fill("#username", "admin")
            await page.fill("#password", "AdminPassword1!")
            await page.click("button[onclick='login()']")

            # Wait for the main content to load after login
            await page.wait_for_selector("#landingPage:not(.hidden)", timeout=10000)
            print("Login successful.")

            # Navigate to the SILAT 1.3 form
            await page.click("div.survey-card[onclick*='silat_1.3']")
            await page.wait_for_selector("#silat_1\\.3Section:not(.hidden)")
            print("Navigated to SILAT 1.3 form.")

            # --- Test Case 1: Number of Instructors ---
            await page.fill("#silat13_instructors_male", "5")
            await page.fill("#silat13_instructors_female", "10")
            # Check if the total is calculated correctly
            await expect(page.locator("#silat13_instructors_total")).to_have_value("15")
            print("Test Case 1 (Instructors) PASSED.")

            # --- Test Case 2: Number of Professionally Qualified Vocational Teachers ---
            await page.fill("#silat13_qualified_teachers_male", "3")
            await page.fill("#silat13_qualified_teachers_female", "7")
            await expect(page.locator("#silat13_qualified_teachers_total")).to_have_value("10")
            print("Test Case 2 (Qualified Teachers) PASSED.")

            # --- Test Case 3: Number of Non-Teaching Staff ---
            await page.fill("#silat13_non_teaching_male", "2")
            await page.fill("#silat13_non_teaching_female", "4")
            await expect(page.locator("#silat13_non_teaching_total")).to_have_value("6")
            print("Test Case 3 (Non-Teaching Staff) PASSED.")

            # Take a screenshot of the form with the calculated totals
            screenshot_path = "frontend_verification.png"
            await page.screenshot(path=screenshot_path)
            print(f"Screenshot saved to {screenshot_path}")

        except Exception as e:
            print(f"An error occurred: {e}")
            # Try to get more specific error info if it's a Playwright timeout
            try:
                # Capture the state of the page when an error occurs
                error_screenshot_path = "error_screenshot.png"
                await page.screenshot(path=error_screenshot_path)
                print(f"Error screenshot saved to {error_screenshot_path}")

                login_error_locator = page.locator("#loginErrorMsg")
                if await login_error_locator.is_visible():
                    error_message = await login_error_locator.inner_text()
                    print(f"Login error: {error_message}")
                else:
                    # If no specific login error, print the page's HTML for context
                    print("Page content at time of error:")
                    print(await page.content())

            except Exception as inner_e:
                print(f"Could not get additional error details: {inner_e}")


        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
