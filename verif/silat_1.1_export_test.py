import requests
import os
import time
import sys
import pandas as pd
import io

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
    Tests the SILAT 1.1 Excel export functionality.
    """
    print("Starting SILAT 1.1 Excel export test...")

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
        print("Calling the Excel export endpoint...")
        export_url = f"{base_url}/api/export/silat_1.1/excel?token={token}"
        export_response = requests.get(export_url)
        export_response.raise_for_status()
        print("Export endpoint returned success status.")

        # --- 5. Assert response headers ---
        content_type = export_response.headers.get('Content-Type')
        expected_content_type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        if not content_type or expected_content_type not in content_type:
            raise Exception(f"Expected Content-Type '{expected_content_type}', but got '{content_type}'")
        print("Content-Type header is correct.")

        # --- 6. Assert response content ---
        df = pd.read_excel(io.BytesIO(export_response.content))

        if df.empty:
            raise Exception("Exported Excel file is empty.")

        # Check for a label that should exist.
        # Note: The test_id field is not in the label map, so it will be exported with its raw key.
        if 'test_id' not in df.columns:
             raise Exception(f"Expected 'test_id' column in Excel header, got {df.columns}")

        if 'Name of School/Institution' not in df.columns:
            raise Exception(f"Expected 'Name of School/Institution' column in Excel header, got {df.columns}")

        # Find the row with our test_id
        test_row = df[df['test_id'] == test_id]
        if test_row.empty:
            raise Exception("Test data not found in the exported Excel file.")

        print("Successfully verified test data in the exported Excel file.")

        print("\n✅ SILAT 1.1 Excel export test PASSED.")

    except requests.exceptions.RequestException as e:
        print(f"\n❌ Test FAILED: An error occurred during an HTTP request: {e}")
        if e.response:
            print(f"Response body: {e.response.text}")
    except Exception as e:
        print(f"\n❌ Test FAILED: An unexpected error occurred: {e}")
    finally:
        # Clean up would ideally happen here.
        print("Test finished. Manual cleanup may be required for test data.")


if __name__ == "__main__":
    print("---------------------------------------------------")
    print("--- Running SILAT 1.1 Excel Export Test ---")
    print("--- Make sure the backend server is running. ---")
    print("---------------------------------------------------")
    run_export_test()
