from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # 1. Log in as an admin
        page.goto("http://localhost:3000")
        page.fill("#username", "admin")
        page.fill("#password", "password123")
        page.click("button[onclick='login()']")

        # 2. Take a screenshot of the landing page
        page.screenshot(path="jules-scratch/verification/simple_verification.png")

        print("Simple verification script completed successfully.")

    except Exception as e:
        print(f"An error occurred: {e}")
        page.screenshot(path="jules-scratch/verification/error.png")
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
