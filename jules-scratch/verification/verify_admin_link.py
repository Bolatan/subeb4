import re
from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # Go to the login page
    page.goto("http://localhost:3000")

    # Log in as admin
    page.fill("#username", "admin")
    page.fill("#password", "password123")
    page.click("button[onclick='login()']")

    # Wait for the landing page to be visible
    expect(page.locator("#landingPage")).to_be_visible()

    # Check that the admin link is enabled
    admin_link = page.locator("#admin-link")
    expect(admin_link).not_to_have_class(re.compile(r"\bdisabled-card\b"))

    # Take a screenshot of the admin view
    page.screenshot(path="jules-scratch/verification/admin_view.png")

    # Log out
    page.click("button[onclick='logout()']")

    # Wait for the auth screen to reappear
    expect(page.locator("#authScreen")).to_be_visible()

    # Log in as assessor
    page.fill("#username", "assessor")
    page.fill("#password", "password2025")
    page.click("button[onclick='login()']")

    # Wait for landing page
    expect(page.locator("#landingPage")).to_be_visible()

    # Check that the admin link is disabled
    admin_link = page.locator("#admin-link")
    expect(admin_link).to_have_class(re.compile(r"\bdisabled-card\b"))

    # Take a screenshot of the assessor view
    page.screenshot(path="jules-scratch/verification/assessor_view.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
