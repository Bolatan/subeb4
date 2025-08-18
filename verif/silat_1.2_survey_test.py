import requests
import pymongo
import os
import time
import sys

# Add the root directory to the Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

def run_test():
    """
    Tests the SILNAT 1.2 survey form submission functionality.
    """
    print("Starting SILNAT 1.2 survey submission test...")

    # --- 1. Setup: Define test data and connection details ---
    base_url = "http://localhost:3000"
    endpoint = "/api/surveys/silat_1.2"
    url = base_url + endpoint

    # Sample data mimicking a SILNAT 1.2 (Special Schools) survey submission.
    sample_data = {
        "silnat_a_ht_name": "Test Headteacher",
        "silnat_a_ht_contact": "1234567890",
        "gender_1.2": "male",
        "marital_status_1.2": "single",
        "highest_qualification_1.2": "b_ed",
        "leadership_experience_1.2": "6_10",
        "silnat_a_institution_type": "special_school",
        "silat_1_2_localGov": "Lagos Mainland",
        "silat_1_2_schoolName": "Test Special School",
        "silat_1_2_address": "123 Test Address, Yaba",
        "silat_1_2_location": "urban",
        "silat_1_2_assembly_start": "08:00",
        "silat_1_2_assembly_end": "08:30",
        "silat_1_2_teachers_male": "5",
        "silat_1_2_teachers_female": "10",
        "silat_1_2_teachers_total": "15",
        "silat_1_2_spec_ed_teachers_male": "2",
        "silat_1_2_spec_ed_teachers_female": "5",
        "silat_1_2_spec_ed_teachers_total": "7",
        "silat_1_2_non_teaching_male": "3",
        "silat_1_2_non_teaching_female": "4",
        "silat_1_2_non_teaching_total": "7",
        "silat_1_2_learners_male": "20",
        "silat_1_2_learners_female": "15",
        "silat_1_2_learners_total": "35",
        "silat_1_2_special_learners": ["asd", "down_syndrome"],
        "silat_1_2_teacher_pupil_ratio": "1:5",
        "silat_1_2_additional_staff_required": "3",
        "silat_1_2_multigrade_classes": "0",
        "silat_1_2_multigrade_reasons": [],
        "discipline_a_1.1": "no",
        "cooperation_a_1.1": "no",
        "communication_a_1.1": "no",
        "community_a_1.1": "yes",
        "supervision_a_1.1": "no",
        "records_a_1.1": "no",
        "health_a_1.1": "no",
        "signboard": "available_good",
        "waterlogged": "no",
        # Adding a unique identifier to easily find this test entry
        "test_id": f"silat_1.2_{int(time.time())}"
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

        assert retrieved_doc["surveyType"] == "silat_1.2", f"Expected surveyType to be 'silat_1.2', but got {retrieved_doc['surveyType']}"
        assert retrieved_doc["formData"]["silnat_a_ht_name"] == sample_data["silnat_a_ht_name"], "Mismatch in form data (Headteacher Name)"
        assert retrieved_doc["formData"]["silat_1_2_schoolName"] == sample_data["silat_1_2_schoolName"], "Mismatch in form data (School Name)"

        print("Data verification successful.")

        # --- 4. Clean up test data ---
        print("Cleaning up test data...")
        delete_result = collection.delete_one(query)
        if delete_result.deleted_count == 1:
            print("Test data successfully deleted.")
        else:
            print("Warning: Test data was not deleted.")

        # --- 5. Report results ---
        print("\n✅ SILNAT 1.2 survey submission test PASSED.")

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
    print("----------------------------------------------------")
    print("--- Running SILNAT 1.2 Survey Submission Test ---")
    print("--- Make sure the backend server is running. ---")
    print("----------------------------------------------------")
    run_test()
