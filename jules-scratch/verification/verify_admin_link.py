import re
from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # Go to the login page
    page.goto("http://localhost:3000")

    # --- Admin Test ---
    page.fill("#username", "admin")
    page.fill("#password", "password123")
    page.click("button[onclick='login()']")

    # Wait for landing page to be visible
    expect(page.locator("#landingPage")).to_be_visible()

    # Find the card by its text content, then check its class
    admin_card = page.locator(".survey-card", has_text="User Administration")
    expect(admin_card).not_to_have_class(re.compile(r"\bdisabled-card\b"))
    page.screenshot(path="jules-scratch/verification/admin_view.png")

    # --- Assessor Test ---
    page.click("button[onclick='logout()']")
    expect(page.locator("#authScreen")).to_be_visible()

    page.fill("#username", "assessor")
    page.fill("#password", "password2025")
    page.click("button[onclick='login()']")

    expect(page.locator("#landingPage")).to_be_visible()

    assessor_card = page.locator(".survey-card", has_text="User Administration")
    expect(assessor_card).to_have_class(re.compile(r"\bdisabled-card\b"))
    page.screenshot(path="jules-scratch/verification/assessor_view.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
