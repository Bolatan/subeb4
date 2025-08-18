import requests
import pymongo
import os
import time
import sys

# Add the root directory to the Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

def run_test():
    """
    Tests the SILNAT 1.3 survey form submission functionality for Vocational Centers.
    """
    print("Starting SILNAT 1.3 survey submission test...")

    # --- 1. Setup: Define test data and connection details ---
    base_url = "http://localhost:3000"
    endpoint = "/api/surveys/silat_1.3"
    url = base_url + endpoint

    # Sample data mimicking a SILNAT 1.3 (Vocational Centers) survey submission.
    sample_data = {
        "silnat_a_ht_name": "Test Manager",
        "silnat_a_ht_contact": "0987654321",
        "gender_1.3": "female",
        "marital_status_1.3": "married",
        "highest_qualification_1.3": "hnd",
        "leadership_experience_1.3": "11_15",
        "silat13_lgea": "Apapa",
        "silat13_school_name": "Test Vocational Center",
        "silat13_address": "456 Test Road, Apapa",
        "silat13_location": "urban",
        "silat13_vocation_type": "Catering, Fashion Design",
        "silat13_instructors_male": "3",
        "silat13_instructors_female": "7",
        "silat13_instructors_total": "10",
        "silat13_qualified_teachers_male": "2",
        "silat13_qualified_teachers_female": "5",
        "silat13_qualified_teachers_total": "7",
        "silat13_non_teaching_male": "1",
        "silat13_non_teaching_female": "2",
        "silat13_non_teaching_total": "3",
        "silat13_schools_supported": "5",
        "silat13_avg_distance": "10",
        "silat13_learners_male": "25",
        "silat13_learners_female": "75",
        "silat13_learners_total": "100",
        "silat13_instructor_pupil_ratio": "1:10",
        "silat13_additional_staff": "2",
        "discipline_a_1.2": "no",
        "cooperation_a_1.2": "no",
        "communication_a_1.2": "no",
        "community_a_1.2": "no",
        "supervision_a_1.2": "no",
        "records_a_1.2": "no",
        "health_a_1.2": "no",
        "signboard": "available_not_good",
        "waterlogged": "yes",
        # Adding a unique identifier to easily find this test entry
        "test_id": f"silat_1.3_{int(time.time())}"
    }

    # MongoDB connection details
    mongo_uri = "mongodb+srv://bolatan:Ogbogbo123@cluster0.vzjwn4g.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
    db_name = "test"
    collection_name = "surveyresponses"

    client = None

    try:
        # --- 2. Simulate form submission ---
        print(f"Sending POST request to {url}...")
        response = requests.post(url, json=sample_data)
        response.raise_for_status()
        print("POST request successful.")

        # --- 3. Verify data in the database ---
        print("Connecting to MongoDB to verify data...")
        client = pymongo.MongoClient(mongo_uri)
        db = client[db_name]
        collection = db[collection_name]

        query = {"formData.test_id": sample_data["test_id"]}
        retrieved_doc = collection.find_one(query)

        if not retrieved_doc:
            raise Exception("Test data not found in the database.")

        print("Successfully retrieved document from the database.")

        assert retrieved_doc["surveyType"] == "silat_1.3", f"Expected surveyType to be 'silat_1.3', but got {retrieved_doc['surveyType']}"
        assert retrieved_doc["formData"]["silat13_school_name"] == sample_data["silat13_school_name"], "Mismatch in form data (School Name)"
        assert retrieved_doc["formData"]["silat13_vocation_type"] == sample_data["silat13_vocation_type"], "Mismatch in form data (Vocation Type)"

        print("Data verification successful.")

        # --- 4. Clean up test data ---
        print("Cleaning up test data...")
        delete_result = collection.delete_one(query)
        if delete_result.deleted_count == 1:
            print("Test data successfully deleted.")
        else:
            print("Warning: Test data was not deleted.")

        # --- 5. Report results ---
        print("\n✅ SILNAT 1.3 survey submission test PASSED.")

    except requests.exceptions.RequestException as e:
        print(f"\n❌ Test FAILED: POST request error: {e}")
    except pymongo.errors.ConnectionFailure as e:
        print(f"\n❌ Test FAILED: MongoDB connection error: {e}")
    except Exception as e:
        print(f"\n❌ Test FAILED: An unexpected error occurred: {e}")
    finally:
        if client:
            client.close()
            print("MongoDB connection closed.")

if __name__ == "__main__":
    print("-------------------------------------------------------")
    print("--- Running SILNAT 1.3 Survey (Vocational) Test ---")
    print("--- Make sure the backend server is running. ---")
    print("-------------------------------------------------------")
    run_test()
