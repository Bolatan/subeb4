from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # 1. Login
        page.goto("http://localhost:3000/index.html")
        page.wait_for_timeout(2000) # Wait for server to be ready
        page.fill("#username", "admin")
        page.fill("#password", "AdminPassword1!")
        page.click("button:has-text('Login')")

        # Wait for navigation to complete and landing page to be visible
        expect(page.locator("#landingPage")).to_be_visible(timeout=10000)
        print("Login successful")

        # 2. Navigate to the survey
        page.click("div.survey-card:has-text('Infrastructure & Leadership Tools 1.4')")
        expect(page.locator('[id="silat_1.4Section"]')).to_be_visible(timeout=5000)
        print("Navigated to SILNAT 1.4 survey")

        # 3. Scroll to the fencing section and check initial state
        fencing_header = page.locator("h5:has-text('FENCING')")
        fencing_header.scroll_into_view_if_needed()

        shared_facility_wrapper = page.locator('[id="shared_facility_schools_wrapper_1.4"]')
        expect(shared_facility_wrapper).not_to_be_visible()
        print("Textarea is initially hidden as expected.")

        # 4. Click 'Yes' and verify textarea becomes visible
        page.click('input[name="shared_facility_1.4"][value="yes"]')
        page.wait_for_timeout(500) # Add a small delay
        expect(shared_facility_wrapper).to_be_visible()
        page.screenshot(path="jules-scratch/verification/verification_yes.png")
        print("Clicked 'Yes', textarea is visible. Screenshot taken.")

        # 5. Click 'No' and verify textarea becomes hidden again
        page.click('input[name="shared_facility_1.4"][value="no"]')
        page.wait_for_timeout(500) # Add a small delay
        expect(shared_facility_wrapper).not_to_be_visible()
        page.screenshot(path="jules-scratch/verification/verification_no.png")
        print("Clicked 'No', textarea is hidden. Screenshot taken.")

    except Exception as e:
        print(f"An error occurred: {e}")
        # Take a final screenshot for debugging
        page.screenshot(path="jules-scratch/verification/error_screenshot.png")
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
