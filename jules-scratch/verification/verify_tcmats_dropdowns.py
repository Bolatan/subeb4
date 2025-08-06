from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        page.goto("http://localhost:3000")

        # Login
        page.get_by_label("Username").fill("admin")
        page.get_by_label("Password").fill("password123")
        page.get_by_role("button", name="Login").click()

        # Go to TCMATS survey
        page.locator(".survey-card", has_text="Teachers Classroom Management & Teaching(TCMATS)").click()

        # Expand the section
        page.get_by_role("heading", name="SECTION A: Demographic information of School and Bio Data of Teacher").click()

        # Interact with dropdowns
        lga_dropdown = page.locator("#tcmats_lgea")
        school_dropdown = page.locator("#tcmats_schoolName")

        # Wait for LGEA dropdown to be populated
        expect(lga_dropdown.locator("option")).to_have_count(41, timeout=10000)

        # Select an LGEA
        lga_dropdown.select_option("AGEGE")

        # Wait for school dropdown to be populated
        expect(school_dropdown.locator("option")).to_have_count(51, timeout=10000)

        # Scroll to the LGEA dropdown
        lga_dropdown.scroll_into_view_if_needed()

        # Take a screenshot
        page.screenshot(path="jules-scratch/verification/tcmats_dropdowns.png")

        print("Verification script ran successfully.")

    except Exception as e:
        print(f"An error occurred: {e}")
        page.screenshot(path="jules-scratch/verification/error.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
