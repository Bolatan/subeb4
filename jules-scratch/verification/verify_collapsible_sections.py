import os
from playwright.sync_api import sync_playwright, expect

def run_verification(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # Listen for console events
    page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))

    # Navigate to the local server
    page.goto('http://localhost:8000/index.html')

    # Log in
    page.fill('#username', 'admin')
    page.fill('#password', 'password123')
    page.click('button:text("Login")')

    # Wait for the landing page to be visible
    expect(page.locator('#landingPage')).to_be_visible()

    # Click on the survey card for SILNAT 1.2
    page.click('div.survey-card:has-text("Infrastructure & Leadership Tools 1.2: SPECIAL SCHOOLS")')

    # Wait for the survey section to be visible
    expect(page.locator('[id="silat_1.2Section"]')).to_be_visible()

    # Section A should be expanded by default, take a screenshot
    page.screenshot(path='jules-scratch/verification/01_section_a_expanded.png')

    # Click the header to collapse the section
    header = page.locator('[id="sectionAHeader_1.2"]')
    header.click()

    # Wait for the header text to change
    expect(header).to_contain_text('▶️')

    # Take a screenshot to verify that the section is collapsed
    page.screenshot(path='jules-scratch/verification/02_section_a_collapsed.png')

    browser.close()

with sync_playwright() as playwright:
    run_verification(playwright)
