from playwright.sync_api import sync_playwright, Page, expect
import time

def run(page: Page):
    page.on("console", lambda msg: print(f"PAGE LOG: {msg.text}"))
    # Navigate to the application
    page.goto("http://localhost:3000")

    # Wait for the server to be ready
    time.sleep(5)

    # Login
    page.fill("#username", "admin")
    page.fill("#password", "AdminPassword1!")
    page.click("button:text('Login')")

    # Wait for the landing page to be ready
    page.wait_for_selector("#landingPage", state="visible")

    # Go to the VOICES form
    page.click("div.survey-card:has-text('Learner Voices/Opinions')")

    # Wait for the VOICES section to be visible
    page.wait_for_selector("#voicesSection", state="visible")

    # --- Verify Fencing Conditional Logic in VOICES survey ---
    wrapper = page.locator("#voices_fence_state_wrapper")

    # Check initial state
    expect(wrapper).to_be_hidden()

    # Click the LABEL for the "Yes" radio button, scoped to the correct section
    yes_label_locator = page.locator('#voicesSection label.radio-inline:has(input[name="perimeter_fence"][value="yes"])')
    yes_label_locator.click()

    expect(wrapper).to_be_visible()

    # Click the LABEL for the "No" radio button, scoped to the correct section
    no_label_locator = page.locator('#voicesSection label.radio-inline:has(input[name="perimeter_fence"][value="no"])')
    no_label_locator.click()

    expect(wrapper).to_be_hidden()

    # Take a screenshot
    page.screenshot(path="jules-scratch/verification/voices_verification.png", full_page=True)
    print("Verification successful, screenshot taken.")

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            run(page)
        finally:
            browser.close()

if __name__ == "__main__":
    main()
