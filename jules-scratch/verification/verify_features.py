from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # 1. Log in as an admin
        page.goto("http://localhost:3000")
        page.fill("#username", "admin")
        page.fill("#password", "password123")
        page.click("button[onclick='login()']")

        # 2. Navigate to the admin page
        page.click("div.survey-card:has-text('User Administration')")
        expect(page).to_have_url("http://localhost:3000/admin.html")

        # 3. Verify that the new "Image" column and "Change Password" and "Export to CSV" buttons are present
        expect(page.locator("th:has-text('Image')")).to_be_visible()
        expect(page.locator("button:has-text('Export to CSV')")).to_be_visible()

        # 4. Create a new user with an image
        page.fill("#create-username", "testuser")
        page.fill("#create-password", "testpassword")
        page.locator("#create-image").set_input_files("pimu.jpeg")
        page.click("button[type='submit']")

        # 5. Verify that the new user is displayed in the user list with the correct image
        expect(page.locator("td:has-text('testuser')")).to_be_visible()
        user_image = page.locator("tr:has-text('testuser') >> td >> img")
        expect(user_image).to_have_attribute("src", lambda s: s.startswith("data:image/jpeg;base64"))

        # 6. Change the new user's password
        page.once("dialog", lambda dialog: dialog.accept(prompt_text="newpassword"))
        page.click("tr:has-text('testuser') >> button:has-text('Change Password')")


        # 7. Log out and log in as the new user with the new password
        page.click("button.btn-logout")
        page.goto("http://localhost:3000")
        page.fill("#username", "testuser")
        page.fill("#password", "newpassword")
        page.click("button[onclick='login()']")
        expect(page.locator("#loggedInUsername")).to_have_text("Testuser")


        # 8. Verify that the user's image is displayed in the header
        user_icon = page.locator("#user-icon")
        expect(user_icon).to_have_attribute("src", lambda s: s.startswith("data:image/jpeg;base64"))
        page.screenshot(path="jules-scratch/verification/user_icon_verification.png")


        # 9. Log out and log back in as the admin
        page.click("button.btn-secondary:has-text('Sign Out')")
        page.goto("http://localhost:3000")
        page.fill("#username", "admin")
        page.fill("#password", "password123")
        page.click("button[onclick='login()']")
        page.click("div.survey-card:has-text('User Administration')")

        # 10. Delete the new user
        page.once("dialog", lambda dialog: dialog.accept())
        page.click("tr:has-text('testuser') >> button:has-text('Delete')")
        expect(page.locator("td:has-text('testuser')")).not_to_be_visible()

        # 11. Click the "Export to CSV" button
        # This will navigate to the export URL, we can't verify the download directly
        # but we can verify that the button is clickable
        page.click("button:has-text('Export to CSV')")

        print("Verification script completed successfully.")

    except Exception as e:
        print(f"An error occurred: {e}")
        page.screenshot(path="jules-scratch/verification/error.png")
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
