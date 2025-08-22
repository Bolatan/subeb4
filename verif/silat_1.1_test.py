import requests
import pymongo
import os
import time
import sys

# Add the root directory to the Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

def run_test():
    """
    Tests the SILNAT 1.1 form submission functionality.
    """
    print("Starting SILNAT 1.1 submission test...")

    # --- 1. Setup: Define test data and connection details ---
    base_url = "http://localhost:3000"
    endpoint = "/api/surveys/silat_1.1"
    url = base_url + endpoint

    sample_data = {
        "silnat_a_ht_name": "Test Head Teacher",
        "silnat_a_ht_contact": "1234567890",
        "silnat_a_ht_gender": "male",
        "silnat_a_ht_marital_status": "married",
        "silnat_a_ht_highest_qualification": "b_ed",
        "silnat_a_ht_years_experience": "6_10",
        "silnat_a_institution_type": "regular_school",
        "localGov": "IKEJA",
        "schoolName": "Test School",
        "schoolAddress": "123 Test Street",
        "silnat_b_location_common": "urban",
        "latitude": "6.6",
        "longitude": "3.35",
        "silnat_assemblyDevotion_startTime": "08:00",
        "silnat_assemblyDevotion_endTime": "08:30",
        "silnat_teachers_male": "10",
        "silnat_teachers_female": "20",
        "silnat_teachers_total": "30",
        "silnat_non_teaching_male": "5",
        "silnat_non_teaching_female": "5",
        "silnat_non_teaching_total": "10",
        "silnat_pupils_eccde_male": "50",
        "silnat_pupils_eccde_female": "50",
        "silnat_pupils_eccde_total": "100",
        "silnat_pupils_primary_male": "200",
        "silnat_pupils_primary_female": "200",
        "silnat_pupils_primary_total": "400",
        "silnat_pupils_special_male": "1",
        "silnat_pupils_special_female": "1",
        "silnat_pupils_special_total": "2",
        "silnat_pupils_male": "251",
        "silnat_pupils_female": "251",
        "silnat_pupils_total": "502",
        "silnat_teacher_pupil_ratio": "1 : 16.7",
        "silnat_additional_staff_required": "2",
        "silnat_multigrade_classes": "0",
        "discipline_a_1.1": "no",
        "discipline_b_1.1": "no",
        "discipline_c_1.1": "no",
        "discipline_d_1.1": "no",
        "discipline_e_1.1": "no",
        "cooperation_a_1.1": "no",
        "cooperation_b_1.1": "no",
        "cooperation_c_1.1": "no",
        "cooperation_d_1.1": "no",
        "communication_a_1.1": "no",
        "communication_b_1.1": "no",
        "communication_c_1.1": "no",
        "community_a_1.1": "no",
        "community_b_1.1": "no",
        "community_c_1.1": "no",
        "community_d_1.1": "no",
        "community_e_1.1": "no",
        "supervision_a_1.1": "no",
        "supervision_b_1.1": "no",
        "supervision_c_1.1": "yes",
        "supervision_d_1.1": "yes",
        "supervision_e_1.1": "no",
        "records_a_1.1": "no",
        "records_b_1.1": "no",
        "records_c_1.1": "no",
        "records_d_1.1": "no",
        "records_e_1.1": "no",
        "records_f_1.1": "no",
        "records_g_1.1": "no",
        "records_h_1.1": "no",
        "records_i_1.1": "no",
        "health_a_1.1": "no",
        "health_b_1.1": "no",
        "health_c_1.1": "no",
        "health_d_1.1": "no",
        "health_e_1.1": "no",
        "signboard_1_1": "available_good",
        "teachers_furniture_available": "30",
        "teachers_furniture_good": "25",
        "teachers_furniture_required": "5",
        "eccde_furniture_available": "20",
        "eccde_furniture_good": "15",
        "eccde_furniture_required": "5",
        "primary_furniture_available": "100",
        "primary_furniture_good": "90",
        "primary_furniture_required": "10",
        "classroom_available": "15",
        "classroom_good": "12",
        "classroom_minor_repair": "3",
        "classroom_major_repair": "0",
        "classroom_required": "0",
        "classroom_repair_description": "None",
        "shared_facility": "no",
        "shared_facility_schools": "",
        "perimeter_fence": "yes",
        "fence_condition": "good",
        "fence_repair_description": "None",
        "school_perimeter": "",
        "toilet_type": "wc",
        "toilet_cubicle_available": "8",
        "toilet_minor_repair": "1",
        "toilet_major_repair": "0",
        "toilet_renovation_required": "0",
        "toilet_additional_required": "2",
        "toilet_repair_description": "None",
        "septic_tank": "available",
        "water_source": "borehole",
        "water_recommendations": "None",
        "electricity_source": "phcn",
        "electricity_additional_info": "None",
        "waterlogged": "no",
        "test_id": f"silnat_1.1_{int(time.time())}"
    }

    mongo_uri = "mongodb+srv://bolatan:Ogbogbo123@cluster0.vzjwn4g.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
    db_name = "test"
    collection_name = "surveyresponses"

    client = None

    try:
        print(f"Sending POST request to {url}...")
        response = requests.post(url, json=sample_data)
        response.raise_for_status()
        print("POST request successful.")

        print("Connecting to MongoDB to verify data...")
        client = pymongo.MongoClient(mongo_uri)
        db = client[db_name]
        collection = db[collection_name]

        query = {"formData.test_id": sample_data["test_id"]}
        retrieved_doc = collection.find_one(query)

        if not retrieved_doc:
            raise Exception("Test data not found in the database.")

        print("Successfully retrieved document from the database.")

        assert retrieved_doc["surveyType"] == "silat_1.1", f"Expected surveyType to be 'silat_1.1', but got {retrieved_doc['surveyType']}"
        assert retrieved_doc["formData"]["supervision_c_1.1"] == "yes", "supervision_c_1.1 should be 'yes'"
        assert retrieved_doc["formData"]["supervision_d_1.1"] == "yes", "supervision_d_1.1 should be 'yes'"

        print("Data verification successful.")

        print("Cleaning up test data from the database...")
        delete_result = collection.delete_one(query)
        if delete_result.deleted_count == 1:
            print("Test data successfully deleted.")
        else:
            print("Warning: Test data was not deleted.")

        print("\n✅ SILNAT 1.1 submission test PASSED.")

    except requests.exceptions.RequestException as e:
        print(f"\n❌ Test FAILED: An error occurred during the POST request: {e}")
    except pymongo.errors.ConnectionFailure as e:
        print(f"\n❌ Test FAILED: Could not connect to MongoDB: {e}")
    except Exception as e:
        print(f"\n❌ Test FAILED: An unexpected error occurred: {e}")
    finally:
        if client:
            client.close()
            print("MongoDB connection closed.")

if __name__ == "__main__":
    print("---------------------------------------------------")
    print("--- Running SILNAT 1.1 Form Submission Test ---")
    print("--- Make sure the backend server is running. ---")
    print("---------------------------------------------------")
    run_test()
