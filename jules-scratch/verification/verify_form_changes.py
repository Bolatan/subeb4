from playwright.sync_api import sync_playwright, Page, expect

def run(page: Page):
    page.on("console", lambda msg: print(f"PAGE LOG: {msg.text}"))
    # Navigate to the application
    page.goto("http://localhost:3000")

    # Wait for the server to be ready
    page.wait_for_timeout(5000)

    # Login
    page.fill("#username", "admin")
    page.fill("#password", "AdminPassword1!")
    page.click("button:text('Login')")

    # Wait for the landing page to be ready
    page.wait_for_selector("#landingPage", state="visible")

    # Go to the SILNAT 1.2 form
    page.click("div.survey-card:has-text('Infrastructure & Leadership Tools 1.2: SPECIAL SCHOOLS')")

    # --- Verify Fencing Conditional Logic ---

    # Shared Facility - Yes
    page.check('#silat_1\\.2Section input[name="shared_facility"][value="yes"]')
    page.wait_for_timeout(1000)
    expect(page.locator("#silat_1\\.2Section #shared_facility_schools_wrapper")).to_be_visible()
    expect(page.locator("#silat_1\\.2Section #shared_facility_schools")).to_be_editable()

    # Shared Facility - No
    page.check('#silat_1\\.2Section input[name="shared_facility"][value="no"]')
    page.wait_for_timeout(1000)
    expect(page.locator("#silat_1\\.2Section #shared_facility_schools_wrapper")).to_be_hidden()

    # Perimeter Fence - Yes
    page.check('#silat_1\\.2Section input[name="perimeter_fence"][value="yes"]')
    page.wait_for_timeout(1000)
    expect(page.locator("#silat_1\\.2Section #fence_condition_wrapper")).to_be_visible()
    expect(page.locator("#silat_1\\.2Section #fence_repair_wrapper")).to_be_visible()
    expect(page.locator("#silat_1\\.2Section #school_perimeter_wrapper")).to_be_hidden()

    # Perimeter Fence - No
    page.check('#silat_1\\.2Section input[name="perimeter_fence"][value="no"]')
    page.wait_for_timeout(1000)
    expect(page.locator("#silat_1\\.2Section #fence_condition_wrapper")).to_be_hidden()
    expect(page.locator("#silat_1\\.2Section #fence_repair_wrapper")).to_be_hidden()
    expect(page.locator("#silat_1\\.2Section #school_perimeter_wrapper")).to_be_visible()
    expect(page.locator("#silat_1\\.2Section #school_perimeter")).to_be_editable()

    # --- Verify Checkbox Sections ---

    # Check that TOILET FACILITIES has checkboxes
    expect(page.locator('input[name="toilet_type"][type="checkbox"]')).to_have_count(4)

    # Check that SOURCE OF POTABLE WATER has checkboxes
    expect(page.locator('input[name="water_source"][type="checkbox"]')).to_have_count(4)

    # Check that SOURCE OF ELECTRICITY has checkboxes
    expect(page.locator('input[name="electricity_source"][type="checkbox"]')).to_have_count(7)

    # Take a screenshot
    page.screenshot(path="jules-scratch/verification/verification.png", full_page=True)

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        run(page)
        browser.close()

if __name__ == "__main__":
    main()
