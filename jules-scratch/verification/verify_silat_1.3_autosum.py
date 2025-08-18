from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        page.goto("http://localhost:3000")

        # Login
        page.fill("#username", "admin")
        page.fill("#password", "password")
        page.click("button:has-text('Login')")

        # Check for login error
        try:
            error_message = page.locator("#loginErrorMsg").text_content(timeout=2000)
            if error_message:
                print(f"Login error: {error_message}")
        except:
            pass # no error message found

        # Wait for navigation to the landing page
        page.wait_for_selector("text=Welcome to LASUBEB/PIMU Needs Assessment Portal", timeout=10000)

        # Click on the SILAT 1.3 survey card
        page.click("text=Infrastructure & Leadership Tools 1.3: VOCATIONAL CENTERS")

        # Wait for the survey to load
        page.wait_for_selector("text=SILNAT 1.3")

        # Fill in the instructor numbers
        page.fill("#silat13_instructors_male", "3")
        page.fill("#silat13_instructors_female", "3")

        # Check the total
        total_instructors = page.input_value("#silat13_instructors_total")
        assert total_instructors == "6"

        # Fill in the qualified teacher numbers
        page.fill("#silat13_qualified_teachers_male", "4")
        page.fill("#silat13_qualified_teachers_female", "3")

        # Check the total
        total_qualified_teachers = page.input_value("#silat13_qualified_teachers_total")
        assert total_qualified_teachers == "7"

        # Fill in the non-teaching staff numbers
        page.fill("#silat13_non_teaching_male", "5")
        page.fill("#silat13_non_teaching_female", "3")

        # Check the total
        total_non_teaching = page.input_value("#silat13_non_teaching_total")
        assert total_non_teaching == "8"

        print("Autosum functionality works as expected.")

        # Take a screenshot
        page.screenshot(path="jules-scratch/verification/verification.png")

    except Exception as e:
        print(f"An error occurred: {e}")
        print(page.content())
        page.screenshot(path="jules-scratch/verification/error.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
