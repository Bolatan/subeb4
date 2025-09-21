import requests
import pymongo
import os
import time
import sys

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

def run_test():
    """
    Tests the SILAT 1.1 report loading functionality.
    """
    print("Starting SILAT 1.1 report loading test...")

    # --- 1. Setup: Define test data and connection details ---
    base_url = "http://localhost:3000"
    admin_username = "admin"
    admin_password = "AdminPassword1!"

    mongo_uri = os.environ.get("MONGO_URI")
    if not mongo_uri:
        raise Exception("MONGO_URI environment variable not set. Please set it to run the test.")
    db_name = "test"
    collection_name = "surveyresponses"

    client = None
    test_id = f"silat_1.1_report_test_{int(time.time())}"
    sample_data = {
        "formData": {
            "schoolName": "Report Test School",
            "localGov": "IKEJA",
            "test_id": test_id
        },
        "surveyType": "silat_1.1"
    }

    try:
        # --- 2. Authentication ---
        print("Getting auth token...")
        token = get_auth_token(base_url, admin_username, admin_password)
        if not token:
            raise Exception("Failed to get authentication token.")
        print("Successfully obtained auth token.")
        headers = {"Authorization": f"Bearer {token}"}

        # --- 3. Create test data ---
        print("Creating test survey data...")
        create_url = f"{base_url}/api/surveys/silat_1.1"
        # The SurveyResponse model expects the data to be in `formData`
        create_response = requests.post(create_url, json=sample_data['formData'], headers=headers)
        create_response.raise_for_status()
        print("Test data created successfully.")

        # --- 4. Fetch report ---
        print("Fetching SILAT 1.1 report...")
        report_url = f"{base_url}/api/reports/silat_1.1"
        report_response = requests.get(report_url, headers=headers)
        report_response.raise_for_status()
        print("Report fetched successfully.")

        # --- 5. Assert response ---
        report_data = report_response.json()
        if not isinstance(report_data.get('responses'), list):
             raise Exception(f"Expected 'responses' to be a list, but got {type(report_data.get('responses'))}")

        reports = report_data['responses']
        test_report_found = False
        for report in reports:
            if report.get("formData", {}).get("test_id") == test_id:
                test_report_found = True
                break

        if not test_report_found:
            raise Exception("Test report not found in the fetched data.")

        print("Successfully found the test report in the response.")

        # --- 6. Clean up ---
        print("Cleaning up test data...")
        client = pymongo.MongoClient(mongo_uri)
        db = client[db_name]
        collection = db[collection_name]
        delete_result = collection.delete_one({"formData.test_id": test_id})
        if delete_result.deleted_count == 1:
            print("Test data successfully deleted.")
        else:
            print("Warning: Test data was not deleted.")

        print("\n✅ SILAT 1.1 report loading test PASSED.")

    except requests.exceptions.RequestException as e:
        print(f"\n❌ Test FAILED: An error occurred during an HTTP request: {e}")
        if e.response:
            print(f"Response body: {e.response.text}")
    except Exception as e:
        print(f"\n❌ Test FAILED: An unexpected error occurred: {e}")
    finally:
        if client:
            client.close()
            print("MongoDB connection closed.")

if __name__ == "__main__":
    print("---------------------------------------------------")
    print("--- Running SILAT 1.1 Report Loading Test ---")
    print("--- Make sure the backend server is running. ---")
    print("---------------------------------------------------")
    run_test()
