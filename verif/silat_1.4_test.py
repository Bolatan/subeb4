import requests
import pymongo
import os
import time
import sys

# Add the root directory to the Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

def run_test():
    """
    Tests the SILNAT 1.4 form submission functionality.
    """
    print("Starting SILNAT 1.4 submission test...")

    # --- 1. Setup: Define test data and connection details ---
    base_url = "http://localhost:3000"
    endpoint = "/api/surveys/silat_1.4"
    url = base_url + endpoint

    # This is sample data mimicking a submission from the SILNAT 1.4 form.
    # The fields are based on the form elements found in the 'silat_1.4Section' of index.html.
    sample_data = {
        "gender_1.4": "female",
        "marital_status_1.4": "married",
        "highest_qualification_1.4": "m_ed",
        "highest_qualification_other_1.4": "",
        "leadership_experience_1.4": "11_15",
        "silat_1_4_localGov": "Ikeja",
        "silat_1_4_schoolName": "LGEA Secretariat, Ikeja",
        "lgea_address_1.4": "Some Address in Ikeja",
        "location_1.4": "urban",
        "staff_male_1.4": "10",
        "staff_female_1.4": "15",
        "staff_total_1.4": "25",
        "teachers_male_1.4": "5",
        "teachers_female_1.4": "10",
        "teachers_total_1.4": "15",
        "non_teaching_male_1.4": "5",
        "non_teaching_female_1.4": "5",
        "non_teaching_total_1.4": "10",
        "discipline_a_1.4": "no",
        "discipline_b_1.4": "no",
        "discipline_c_1.4": "yes",
        "discipline_d_1.4": "no",
        "discipline_e_1.4": "yes",
        "cooperation_a_1.4": "no",
        "cooperation_b_1.4": "no",
        "cooperation_c_1.4": "no",
        "cooperation_d_1.4": "no",
        "communication_a_1.4": "no",
        "communication_b_1.4": "no",
        "communication_c_1.4": "no",
        "community_a_1.4": "no",
        "community_b_1.4": "no",
        "community_c_1.4": "no",
        "community_d_1.4": "no",
        "community_e_1.4": "no",
        "supervision_a_1.4": "no",
        "supervision_b_1.4": "no",
        "supervision_c_1.4": "no",
        "supervision_d_1.4": "no",
        "records_a_1.4": "no",
        "records_b_1.4": "no",
        "records_c_1.4": "no",
        "records_d_1.4": "no",
        "records_e_1.4": "no",
        "health_a_1.4": "no",
        "health_b_1.4": "no",
        "health_c_1.4": "no",
        "health_d_1.4": "no",
        "health_e_1.4": "no",
        "signboard_1.4": "available_good",
        "structure_condition_1.4": "good",
        "offices_good_condition_1.4": "10",
        "offices_minor_repairs_1.4": "2",
        "offices_major_repairs_1.4": "1",
        "offices_renovation_required_1.4": "0",
        "offices_additional_required_1.4": "0",
        "repair_description_1.4": "Minor repairs on 2 offices",
        "staff_furniture_available_1.4": "25",
        "staff_furniture_good_condition_1.4": "20",
        "staff_furniture_required_1.4": "5",
        "offices_available_1.4": "10",
        "offices_good_condition_2_1.4": "8",
        "offices_minor_repair_1.4": "2",
        "offices_major_repair_1.4": "0",
        "offices_additional_required_2_1.4": "0",
        "repair_description_2_1.4": "No major repairs needed",
        "shared_facility_1.4": "no",
        "shared_facility_schools_1.4": "",
        "perimeter_fence_1.4": "yes",
        "fence_condition_1.4": "good",
        "fence_repair_description_1.4": "",
        "lgea_perimeter_1.4": "",
        "toilet_type_1.4": "wc",
        "toilet_cubicle_available_1.4": "4",
        "toilet_minor_repair_1.4": "1",
        "toilet_major_repair_1.4": "0",
        "toilet_renovation_required_1.4": "0",
        "toilet_additional_required_1.4": "0",
        "toilet_repair_description_1.4": "One toilet needs minor repair",
        "septic_tank_1.4": "available",
        "water_source_1.4": "borehole",
        "water_recommendations_1.4": "None",
        "electricity_source_1.4": "phcn",
        "electricity_additional_info_1.4": "None",
        "monitoring_vehicles_1.4": "available",
        "monitoring_vehicles_needed_1.4": "0",
        "waterlogged_1.4": "no",
        # Adding a unique identifier to easily find this test entry
        "test_id": f"silat_1.4_{int(time.time())}"
    }

    # MongoDB connection details (extracted from server.js)
    mongo_uri = "mongodb+srv://bolatan:Ogbogbo123@cluster0.vzjwn4g.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
    db_name = "test" # The default database for this connection string
    collection_name = "surveyresponses"

    client = None  # Initialize client to None

    try:
        # --- 2. Simulate form submission ---
        print(f"Sending POST request to {url}...")
        response = requests.post(url, json=sample_data)
        response.raise_for_status()  # Raise an exception for bad status codes (4xx or 5xx)
        print("POST request successful.")

        # --- 3. Verify data in the database ---
        print("Connecting to MongoDB to verify data...")
        client = pymongo.MongoClient(mongo_uri)
        db = client[db_name]
        collection = db[collection_name]

        # Find the document that was just inserted
        query = {"formData.test_id": sample_data["test_id"]}
        retrieved_doc = collection.find_one(query)

        if not retrieved_doc:
            raise Exception("Test data not found in the database.")

        print("Successfully retrieved document from the database.")

        # --- Verification checks ---
        assert retrieved_doc["surveyType"] == "silat_1.4", f"Expected surveyType to be 'silat_1.4', but got {retrieved_doc['surveyType']}"
        assert retrieved_doc["formData"]["gender_1.4"] == sample_data["gender_1.4"], "Mismatch in form data (gender_1.4)"
        assert retrieved_doc["formData"]["silat_1_4_localGov"] == sample_data["silat_1_4_localGov"], "Mismatch in form data (localGov)"

        print("Data verification successful. The submitted data matches the sent data.")

        # --- 4. Clean up test data ---
        print("Cleaning up test data from the database...")
        delete_result = collection.delete_one(query)
        if delete_result.deleted_count == 1:
            print("Test data successfully deleted.")
        else:
            print("Warning: Test data was not deleted.")

        # --- 5. Report results ---
        print("\n✅ SILNAT 1.4 submission test PASSED.")

    except requests.exceptions.RequestException as e:
        print(f"\n❌ Test FAILED: An error occurred during the POST request: {e}")
    except pymongo.errors.ConnectionFailure as e:
        print(f"\n❌ Test FAILED: Could not connect to MongoDB: {e}")
    except Exception as e:
        print(f"\n❌ Test FAILED: An unexpected error occurred: {e}")
    finally:
        # Ensure the MongoDB connection is closed
        if client:
            client.close()
            print("MongoDB connection closed.")

if __name__ == "__main__":
    # Ensure the server is running before executing this test
    print("--------------------------------------------------")
    print("--- Running SILNAT 1.4 Form Submission Test ---")
    print("--- Make sure the backend server is running. ---")
    print("--------------------------------------------------")
    run_test()
