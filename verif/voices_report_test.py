import re
from playwright.sync_api import Page, expect

def test_voices_report_page(page: Page):
    # Log in
    page.goto("http://localhost:3000")
    page.fill("#username", "admin")
    page.fill("#password", "AdminPassword1!")
    page.click('button:has-text("Login")')
    page.wait_for_selector("#landingPage:not(.hidden)", timeout=5000)

    # Go to the report page
    page.goto("http://localhost:3000/reports/voices.html")

    # Expect a title "to contain" a substring.
    expect(page).to_have_title(re.compile("VOICES Survey Reports"))

    # Expect the table to be visible
    expect(page.locator("#reportsTable")).to_be_visible()

    # Expect the export buttons to be visible
    expect(page.locator("text=Export to PDF")).to_be_visible()
    expect(page.locator("text=Export to Excel")).to_be_visible()

    # Wait for the reports to load
    page.wait_for_selector("#reportsTable tbody tr")

    # Click the first "View Details" button
    page.locator("text=View Details").first.click()

    # Expect the modal to be visible
    expect(page.locator("#detailsModal")).to_be_visible()

    # Expect the modal to contain some survey data
    expect(page.locator("#modal-data")).to_contain_text("surveyType")

    # Close the modal
    page.locator(".close-button").click()

    # Expect the modal to be hidden
    expect(page.locator("#detailsModal")).to_be_hidden()
