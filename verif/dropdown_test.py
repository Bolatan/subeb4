import pytest
from playwright.sync_api import sync_playwright, expect
import subprocess
import time
import os
import signal

def test_dropdowns():
    # Start the node server
    server_process = subprocess.Popen(["node", "server.js"])
    time.sleep(5)  # Give the server some time to start

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_page()

            # Go to the page
            page.goto("http://localhost:3000")

            # Login
            page.fill("#username", "assessor")
            page.fill("#password", "AssessorPassword1!")
            page.click('button:has-text("Login")')

            # Wait for landing page
            page.wait_for_selector("#landingPage:not(.hidden)")

            # Click on TCMATS survey
            page.click('div.survey-card:has-text("TCMATS")')

            # Wait for the TCMATS section to be visible
            page.wait_for_selector("#tcmatsSection:not(.hidden)")

            # Wait for a known LGEA to appear in the dropdown
            lga_dropdown = page.locator("#tcmats_lgea")
            # Check for the presence of the option in the DOM, not visibility
            expect(lga_dropdown.locator('option[value="ALIMOSHO"]')).to_have_count(1, timeout=15000)

            # Assert that there is more than one option
            assert lga_dropdown.locator("option").count() > 1, "LGEA dropdown was not populated"

            # Select the LGEA
            lga_dropdown.select_option("ALIMOSHO")

            # Check if the school dropdown is populated
            school_dropdown = page.locator("#tcmats_schoolName")

            # Wait for the school dropdown to contain more than one option.
            # Using a loop is more flexible than a fixed count.
            for _ in range(10): # wait up to 10 seconds
                if school_dropdown.locator("option").count() > 1:
                    break
                time.sleep(1)
            else:
                pytest.fail("School dropdown was not populated in time")

            assert school_dropdown.locator("option").count() > 1, "School dropdown was not populated"

            # Take a screenshot
            page.screenshot(path="verif/dropdown_test_screenshot.png")

            print("Dropdown test passed!")

            browser.close()
    finally:
        # Stop the server
        os.kill(server_process.pid, signal.SIGTERM)
        server_process.wait()
        print("Server stopped.")
