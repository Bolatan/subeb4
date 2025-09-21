import asyncio
from playwright.async_api import async_playwright, expect
import os

async def run_pdf_export_test():
    """
    Tests the SILAT 1.1 PDF export functionality.
    """
    print("Starting SILAT 1.1 PDF export test...")

    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        try:
            # Navigate to the reports page
            await page.goto("http://localhost:3000/reports/silat_1.1.html")

            # Click the "Export to PDF" button and wait for the download
            async with page.expect_download() as download_info:
                await page.click('button:has-text("Export to PDF")')

            download = await download_info.value

            # Check if the download was successful
            if not download:
                raise Exception("PDF download failed.")

            # Check the downloaded file name
            if "silat_1.1_reports.pdf" not in download.suggested_filename:
                raise Exception(f"Expected file name 'silat_1.1_reports.pdf', but got '{download.suggested_filename}'")

            # Save the downloaded file
            download_path = os.path.join("/tmp", download.suggested_filename)
            await download.save_as(download_path)

            if not os.path.exists(download_path):
                raise Exception(f"File was not saved to {download_path}")

            print(f"Successfully downloaded {download.suggested_filename} to {download_path}")
            print("\n✅ SILAT 1.1 PDF export test PASSED.")

        except Exception as e:
            print(f"\n❌ Test FAILED: {e}")
        finally:
            await browser.close()

if __name__ == "__main__":
    print("---------------------------------------------------")
    print("--- Running SILAT 1.1 PDF Export Test ---")
    print("--- Make sure the backend server is running. ---")
    print("---------------------------------------------------")
    asyncio.run(run_pdf_export_test())
