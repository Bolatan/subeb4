import json
from playwright.sync_api import sync_playwright, Page, expect

def verify_voices_form_submission(page: Page):
    # Go to the page first
    page.goto("http://localhost:3000")

    # Set local storage to simulate a logged-in user
    user_data = {
        "username": "testuser",
        "role": "admin",
        "token": "fake-token"
    }
    page.evaluate(f"localStorage.setItem('auditAppCurrentUser', '{json.dumps(user_data)}')")

    # Reload the page to apply the logged-in state
    page.reload()

    # Click on the "Learner Voices/Opinions (VOICES)" survey card
    page.get_by_text("Learner Voices/Opinions (VOICES)").click()

    # Wait for the voices section to be visible
    expect(page.locator("#voicesSection")).to_be_visible()

    # Fill out the form
    # Section A
    page.locator('input[name="voices_institution"][value="regular_school"]').check()
    page.locator('#voices_lgea').select_option(label='AGEGE')

    # Wait for schools to load, which depends on an async data load.
    # A short timeout is a pragmatic way to handle this in a verification script.
    page.wait_for_timeout(1000)

    # Check if there are options in the school dropdown before selecting one
    school_options_count = page.locator('#voices_schoolName option').count()
    if school_options_count <= 1:
        print(f"Error: School dropdown not populated. Found only {school_options_count} option(s).")
        page.screenshot(path="jules-scratch/verification/voices_survey_error.png")
        return

    page.locator('#voices_schoolName').select_option(index=1)

    page.locator('#voices_class').select_option(label='Pry One')
    page.locator('input[name="voices_class_description"][value="single_grade"]').check()
    page.locator('input[name="voices_gender"][value="male"]').check()
    page.locator('input[name="voices_distance"][value="1km_3km"]').check()

    # Section B
    page.locator('textarea[name="voices_difficult_topics"]').fill("Mathematics")

    # Section C
    for i in range(1, 16):
        page.locator(f'input[name="participation_{i}"][value="3"]').check()

    # Section D
    page.locator('input[name="school_building"][value="good_condition"]').check()
    page.locator('input[name="furniture"][value="adequate"]').check()
    page.locator('input[name="classroom_condition"][value="beautiful"]').check()
    page.locator('input[name="perimeter_fence"][value="yes"]').check()
    page.locator('input[name="toilet_type"][value="wc"]').check()
    page.locator('input[name="toilet_cubicles_available"]').fill("4")
    page.locator('input[name="toilet_cubicles_minor_repair"]').fill("0")
    page.locator('input[name="toilet_cubicles_major_repair"]').fill("0")
    page.locator('input[name="toilet_cubicles_additional"]').fill("0")
    page.locator('input[name="septic_tank"][value="available"]').check()
    page.locator('input[name="water_source"][value="tap_water"]').check()
    page.locator('input[name="electricity_source"][value="phcn"]').check()
    page.locator('input[name="clubs"][value="boys_scout"]').check()
    page.locator('input[name="clubs_frequency"][value="weekly"]').check()
    page.locator('input[name="sports_equipment"][value="football"]').check()
    page.locator('input[name="waterlogged"][value="no"]').check()
    page.locator('textarea[name="major_requests"]').fill("More books")

    # Submit the form
    page.locator('#voicesForm button[type="submit"]').click()

    # Check for the success message
    feedback_div = page.locator("#voices_feedback")
    expect(feedback_div).to_have_text("VOICES survey submitted successfully!")
    expect(feedback_div).to_have_css("color", "rgb(22, 163, 74)") # var(--lagos-green)

    # Take a screenshot
    page.screenshot(path="jules-scratch/verification/voices_survey_success.png")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    try:
        verify_voices_form_submission(page)
    finally:
        browser.close()
