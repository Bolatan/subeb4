from playwright.sync_api import sync_playwright, expect
import time

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # Navigate to the login page
    page.goto("http://localhost:3000/index1.html")

    # The login form is initially hidden, we need to find a way to make it appear.
    page.evaluate("document.getElementById('authScreen').classList.remove('hidden')")

    # Use the correct credentials from the frontend code
    page.fill("#username", "admin")
    page.fill("#password", "password123")

    # Click the login button
    page.click("button.btn[onclick='login()']")

    # Wait for the landing page to be visible
    landing_page = page.locator("#landingPage")
    expect(landing_page).to_be_visible(timeout=5000)

    # Navigate to the admin page
    page.goto("http://localhost:3000/admin.html")

    # Verify the "Export to Excel" button is visible
    export_button = page.get_by_role("button", name="Export to Excel")
    expect(export_button).to_be_visible()

    # Take a screenshot
    page.screenshot(path="jules-scratch/verification/verification.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
