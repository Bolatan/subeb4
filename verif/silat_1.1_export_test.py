import requests
import os
import time
import sys
import csv

# Add the root directory to the Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

def get_auth_token(base_url, username, password):
    """Logs in a user and returns an authentication token."""
    login_url = f"{base_url}/api/login"
    credentials = {"username": username, "password": password}
    try:
        response = requests.post(login_url, json=credentials)
        response.raise_for_status()
        return response.json().get("token")
    except requests.exceptions.RequestException as e:
        print(f"Error getting auth token: {e}")
        return None

def run_export_test():
    """
    Tests the SILAT 1.1 CSV export functionality.
    """
    print("Starting SILAT 1.1 CSV export test...")

    # --- 1. Setup ---
    base_url = "http://localhost:3000"
    admin_username = "admin"
    admin_password = "AdminPassword1!"
    test_id = f"silat_1.1_export_test_{int(time.time())}"

    try:
        # --- 2. Authentication ---
        print("Getting auth token...")
        token = get_auth_token(base_url, admin_username, admin_password)
        if not token:
            raise Exception("Failed to get authentication token.")
        print("Successfully obtained auth token.")
        headers = {"Authorization": f"Bearer {token}"}

        # --- 3. Create some test data to ensure the export is not empty ---
        print("Creating test survey data...")
        create_url = f"{base_url}/api/surveys/silat_1.1"
        sample_data = {
            "formData": {"schoolName": "Export Test School", "localGov": "Epe", "test_id": test_id},
            "surveyType": "silat_1.1"
        }
        create_response = requests.post(create_url, json=sample_data['formData'], headers=headers)
        create_response.raise_for_status()
        print("Test data created successfully.")

        # --- 4. Call the export endpoint ---
        print("Calling the CSV export endpoint...")
        # The token can also be passed as a query param as designed for browser downloads
        export_url = f"{base_url}/api/export/silat_1.1/csv?token={token}"
        export_response = requests.get(export_url, stream=True)
        export_response.raise_for_status()
        print("Export endpoint returned success status.")

        # --- 5. Assert response headers ---
        content_type = export_response.headers.get('Content-Type')
        if not content_type or 'text/csv' not in content_type:
            raise Exception(f"Expected Content-Type 'text/csv', but got '{content_type}'")
        print("Content-Type header is correct.")

        # --- 6. Assert response content ---
        lines = export_response.text.splitlines()
        if len(lines) < 2:
            raise Exception(f"Expected at least 2 lines in CSV (header + data), but got {len(lines)}")

        reader = csv.reader(lines)
        header = next(reader)
        if 'test_id' not in header:
            raise Exception(f"Expected 'test_id' column in CSV header, got {header}")

        found_in_csv = False
        for row in reader:
            row_dict = dict(zip(header, row))
            if row_dict.get('test_id') == test_id:
                found_in_csv = True
                break

        if not found_in_csv:
            raise Exception("Test data not found in the exported CSV.")

        print("Successfully verified test data in the exported CSV.")

        print("\n✅ SILAT 1.1 CSV export test PASSED.")

    except requests.exceptions.RequestException as e:
        print(f"\n❌ Test FAILED: An error occurred during an HTTP request: {e}")
        if e.response:
            print(f"Response body: {e.response.text}")
    except Exception as e:
        print(f"\n❌ Test FAILED: An unexpected error occurred: {e}")
    finally:
        # Clean up is harder here as we don't have the _id.
        # We can use the test_id, but need a direct DB connection.
        # For this test, we'll skip automatic cleanup, but it should be implemented in a real scenario.
        print("Test finished. Manual cleanup may be required for test data.")


if __name__ == "__main__":
    print("---------------------------------------------------")
    print("--- Running SILAT 1.1 CSV Export Test ---")
    print("--- Make sure the backend server is running. ---")
    print("---------------------------------------------------")
    run_export_test()
