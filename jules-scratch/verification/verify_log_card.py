import asyncio
from playwright.async_api import async_playwright, expect

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        await page.goto("http://localhost:3000")

        # Log in as admin
        await page.fill("#username", "admin")
        await page.fill("#password", "AdminPassword1!")
        await page.click("button.btn")

        # Wait for the landing page to be visible
        await expect(page.locator("#landingPage")).to_be_visible()

        # Check that the log card is visible
        log_card = page.locator("#log-card")
        await expect(log_card).to_be_visible()

        # Click the log card
        await log_card.click()

        # Wait for navigation to the reports page
        await page.wait_for_url("**/reports.html?view=logs")

        # Check that the login logs tab is visible
        await expect(page.locator("#loginLogs.tabcontent")).to_be_visible()

        # Take a screenshot
        await page.screenshot(path="jules-scratch/verification/verification.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
