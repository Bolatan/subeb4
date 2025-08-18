import requests
import pymongo
import os
import time
import sys

# Add the root directory to the Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

def run_test():
    """
    Tests the LORI survey form submission functionality.
    """
    print("Starting LORI survey submission test...")

    # --- 1. Setup: Define test data and connection details ---
    base_url = "http://localhost:3000"
    endpoint = "/api/surveys/lori"
    url = base_url + endpoint

    # Sample data mimicking a LORI survey submission.
    # The fields are based on the form elements in loriSection of index.html.
    sample_data = {
        "lori_lgea": "Ikeja",
        "lori_school_name": "Some School in Ikeja",
        "lori_location": "urban",
        "lori_school_code": "SC12345",
        "lori_teacher_name": "Test Teacher",
        "lori_trcn_no": "TRCN98765",
        "lori_teacher_gender": "female",
        "lori_teacher_phone": "1234567890",
        "lori_pupils_female": "15",
        "lori_pupils_male": "10",
        "lori_pupils_total": "25",
        "lori_teacher_class_observed": "Primary 5",
        "lori_lesson_start_time": "09:00",
        "lori_lesson_end_time": "09:45",
        "lori_subject_observed": "Mathematics",
        "lori_years_experience": "8",
        "lori_observation_date": "2025-08-17",
        "lori_term": "First",
        "lori_age": "35-44",
        "lori_qualification": "b.ed",
        "lori_b_1_a": "4",
        "lori_b_1_b": "4",
        "lori_c_went_well_1": "The class was engaged.",
        "lori_c_went_well_2": "The instructional materials were effective.",
        "lori_c_could_be_different_1": "More time for practical activities.",
        "lori_c_could_be_different_2": "Better classroom lighting.",
        "lori_c_support_needed": "Need more modern instructional materials.",
        "lori_c_teacher_name": "Test Teacher",
        "lori_c_teacher_signature": "1234567890", # Using phone as signature
        "lori_c_teacher_date": "2025-08-17",
        "lori_c_observer_name_2": "Test Observer",
        "lori_c_observer_designation": "Head Teacher",
        "lori_c_observer_phone": "0987654321",
        "lori_c_observer_date": "2025-08-17",
        # Adding a unique identifier to easily find this test entry
        "test_id": f"lori_{int(time.time())}"
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

        assert retrieved_doc["surveyType"] == "lori", f"Expected surveyType to be 'lori', but got {retrieved_doc['surveyType']}"
        assert retrieved_doc["formData"]["lori_teacher_name"] == sample_data["lori_teacher_name"], "Mismatch in form data (lori_teacher_name)"
        assert retrieved_doc["formData"]["lori_school_name"] == sample_data["lori_school_name"], "Mismatch in form data (lori_school_name)"

        print("Data verification successful.")

        # --- 4. Clean up test data ---
        print("Cleaning up test data...")
        delete_result = collection.delete_one(query)
        if delete_result.deleted_count == 1:
            print("Test data successfully deleted.")
        else:
            print("Warning: Test data was not deleted.")

        # --- 5. Report results ---
        print("\n✅ LORI survey submission test PASSED.")

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
    print("--------------------------------------------------")
    print("--- Running LORI Survey Form Submission Test ---")
    print("--- Make sure the backend server is running. ---")
    print("--------------------------------------------------")
    run_test()
