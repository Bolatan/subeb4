from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        page.goto("http://localhost:3000")

        # Login
        page.fill("#username", "admin")
        page.fill("#password", "AdminPassword1!")
        page.click("button[onclick='login()']")

        # Wait for navigation to the landing page
        expect(page.locator("#landingPage:not(.hidden)")).to_be_visible(timeout=10000)

        # Click on the SILNAT 1.1 survey
        page.click("div.survey-card[onclick*='silnat']")

        # Wait for the survey to be visible
        expect(page.locator("#silnatSection:not(.hidden)")).to_be_visible(timeout=10000)

        # Take a screenshot of the form
        page.screenshot(path="jules-scratch/verification/fencing_logic_verification.png")

        print("Verification script executed successfully.")

    except Exception as e:
        print(f"An error occurred: {e}")
        page.screenshot(path="jules-scratch/verification/error_screenshot.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
