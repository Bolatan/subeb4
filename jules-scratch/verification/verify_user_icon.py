from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # Listen for console events and print them
    page.on("console", lambda msg: print(f"Browser console: {msg.text}"))

    try:
        page.goto("http://localhost:3000/")

        # Login
        page.locator("#username").fill("admin")
        page.locator("#password").fill("password123")
        page.get_by_role("button", name="Login").click()

        # Wait for navigation to the landing page to be visible
        expect(page.locator("#landingPage")).to_be_visible(timeout=10000)

        # Explicitly wait for the username to appear
        user_info_span = page.locator("#loggedInUsername")
        expect(user_info_span).to_have_text("Admin", timeout=5000)

        # Take a screenshot of the header
        header = page.locator(".landing-header")
        header.screenshot(path="jules-scratch/verification/user_icon_verification.png")

        print("Screenshot taken successfully after verifying user name.")

    except Exception as e:
        print(f"An error occurred during verification: {e}")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
