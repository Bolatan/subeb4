from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context(viewport={'width': 1280, 'height': 1024})
    page = context.new_page()

    try:
        # Go to the login page
        page.goto("http://localhost:3000/index.html", wait_until="networkidle")

        # Wait for the auth screen to be visible
        expect(page.locator("#authScreen")).to_be_visible(timeout=10000)

        # Fill in the credentials
        page.fill("#username", "admin")
        page.fill("#password", "AdminPassword1!")

        # Click the login button
        page.click("button[onclick='login()']")

        # Wait for navigation to the landing page to complete
        page.wait_for_url("http://localhost:3000/index.html")

        # Wait for the landing page to be visible
        expect(page.locator("#landingPage")).to_be_visible(timeout=10000)

        # Go to the admin page
        page.goto("http://localhost:3000/admin.html", wait_until="networkidle")

        # Wait for the user list to be populated
        # There are 2 seeded users, so we expect at least 2 rows.
        expect(page.locator("#user-list tr:nth-child(2)")).to_be_visible(timeout=20000)

        # Wait for the pagination controls to be visible
        expect(page.locator("#pagination-controls")).to_be_visible(timeout=10000)

        # Take a screenshot
        page.screenshot(path="jules-scratch/verification/pagination_screenshot.png")

        print("Screenshot taken successfully.")

    except Exception as e:
        print(f"An error occurred: {e}")
        page.screenshot(path="jules-scratch/verification/error_screenshot.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
