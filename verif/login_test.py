from playwright.sync_api import sync_playwright, TimeoutError

def run_test():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        page.on("console", lambda msg: print(f"BROWSER CONSOLE: {msg.type}: {msg.text}"))

        try:
            print("Navigating to http://localhost:3000...")
            page.goto("http://localhost:3000", timeout=10000)
            print("Navigation successful.")

            print("Filling in credentials...")
            page.fill("#username", "admin")
            page.fill("#password", "password123")
            print("Credentials filled.")

            print("Clicking login button with specific selector...")
            # Using a more specific selector to ensure we click the button, not the h3
            page.click('button:has-text("Login")')
            print("Login button clicked.")

            print("Waiting for landing page to be visible...")
            page.wait_for_selector("#landingPage:not(.hidden)", timeout=5000)
            print("Landing page is visible. Login successful!")

        except TimeoutError as e:
            print(f"TimeoutError: {e}")
            print("Login failed. The landing page did not appear in time.")
        except Exception as e:
            print(f"An unexpected error occurred: {e}")
        finally:
            page.screenshot(path="screenshot_final_attempt.png")
            print("Screenshot taken.")
            browser.close()

if __name__ == "__main__":
    run_test()
