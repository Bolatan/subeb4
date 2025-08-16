import re
from playwright.sync_api import sync_playwright, Page, expect

def run(page: Page):
    page.on("console", lambda msg: print(f"PAGE LOG: {msg.text}"))
    # Navigate to the application
    page.goto("http://localhost:3000")

    # Wait for the server to be ready
    page.wait_for_timeout(10000)

    # Login
    page.fill("#username", "admin")
    page.fill("#password", "AdminPassword1!")
    page.click("button:text('Login')")

    # Wait for the landing page to be ready
    page.wait_for_selector("#landingPage", state="visible")

    # Go to the SILNAT 1.1 form
    page.click("div.survey-card:has-text('Infrastructure & Leadership Tools 1.1: REGULAR SCHOOLS')")
    page.wait_for_selector("#silnatSection", state="visible")
    page.wait_for_timeout(2000) # Wait for 2 seconds for any animations
    page.screenshot(path="jules-scratch/verification/debug_screenshot.png", full_page=True)

    # --- Verify Fencing Conditional Logic ---
    silnat_form = page.locator("#silnat_1_1_form")

    # Scroll to the fencing section
    fencing_header = silnat_form.locator("#fencing_header_1_1")

    # Print the page content for debugging
    content = page.content()
    print(content)

    fencing_header.scroll_into_view_if_needed()

    # Shared Facility Logic
    shared_facility_yes = silnat_form.locator('input[name="shared_facility_1.1"][value="yes"]')
    shared_facility_no = silnat_form.locator('input[name="shared_facility_1.1"][value="no"]')
    other_schools_wrapper = silnat_form.locator('#shared_facility_schools_wrapper_1_1')
    other_schools_input = silnat_form.locator('#shared_facility_schools_1_1')

    expect(other_schools_wrapper).to_be_hidden()

    shared_facility_yes.click()
    expect(other_schools_wrapper).to_be_visible()
    expect(other_schools_input).to_have_attribute("required", "")

    shared_facility_no.click()
    expect(other_schools_wrapper).to_be_hidden()
    expect(other_schools_input).not_to_have_attribute("required", "")

    # Perimeter Fence Logic
    perimeter_fence_yes = silnat_form.locator('input[name="perimeter_fence_1.1"][value="yes"]')
    perimeter_fence_no = silnat_form.locator('input[name="perimeter_fence_1.1"][value="no"]')
    fence_condition_wrapper = silnat_form.locator('#fence_condition_wrapper_1_1')
    fence_repair_wrapper = silnat_form.locator('#fence_repair_wrapper_1_1')
    school_perimeter_wrapper = silnat_form.locator('#school_perimeter_wrapper_1_1')

    fence_condition_radios = silnat_form.locator('input[name="fence_condition_1.1"]')
    school_perimeter_input = silnat_form.locator('#school_perimeter_1_1')


    expect(fence_condition_wrapper).to_be_hidden()
    expect(fence_repair_wrapper).to_be_hidden()
    expect(school_perimeter_wrapper).to_be_hidden()

    perimeter_fence_yes.click()
    expect(fence_condition_wrapper).to_be_visible()
    expect(school_perimeter_wrapper).to_be_hidden()
    expect(school_perimeter_input).not_to_have_attribute("required", "")
    for i in range(fence_condition_radios.count()):
            expect(fence_condition_radios.nth(i)).to_have_attribute("required", "")

    perimeter_fence_no.click()
    expect(fence_condition_wrapper).to_be_hidden()
    expect(fence_repair_wrapper).to_be_hidden()
    expect(school_perimeter_wrapper).to_be_visible()
    expect(school_perimeter_input).to_have_attribute("required", "")
    for i in range(fence_condition_radios.count()):
            expect(fence_condition_radios.nth(i)).not_to_have_attribute("required", "")

    # Fence Condition Logic
    perimeter_fence_yes.click()

    fence_condition_good = silnat_form.locator('input[name="fence_condition_1.1"][value="good"]')
    fence_condition_minor = silnat_form.locator('input[name="fence_condition_1.1"][value="minor_repair"]')
    fence_condition_major = silnat_form.locator('input[name="fence_condition_1.1"][value="major_repair"]')
    fence_repair_input = silnat_form.locator('#fence_repair_description_1_1')

    expect(fence_repair_wrapper).to_be_hidden()

    fence_condition_good.click()
    expect(fence_repair_wrapper).to_be_hidden()
    expect(fence_repair_input).not_to_have_attribute("required", "")

    fence_condition_minor.click()
    expect(fence_repair_wrapper).to_be_visible()
    expect(fence_repair_input).to_have_attribute("required", "")

    fence_condition_major.click()
    expect(fence_repair_wrapper).to_be_visible()
    expect(fence_repair_input).to_have_attribute("required", "")

    fence_condition_good.click()
    expect(fence_repair_wrapper).to_be_hidden()

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
