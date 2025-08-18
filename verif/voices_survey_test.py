import requests
import pymongo
import os
import time
import sys

# Add the root directory to the Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

def run_test():
    """
    Tests the VOICES survey form submission functionality.
    """
    print("Starting VOICES survey submission test...")

    # --- 1. Setup: Define test data and connection details ---
    base_url = "http://localhost:3000"
    endpoint = "/api/surveys/voices"
    url = base_url + endpoint

    # Sample data mimicking a VOICES survey submission.
    sample_data = {
        "voices_institution": "regular_school",
        "voices_lgea": "Surulere",
        "voices_schoolName": "A Test School in Surulere",
        "voices_learnerName": "Test Learner",
        "tcmats_location": "urban", # Note: form uses tcmats_location name
        "voices_class": "pry_5",
        "voices_class_description": "single_grade",
        "voices_gender": "male",
        "voices_distance": "1km_3km",
        "voices_difficult_topics": "Advanced algebra, Shakespearean English",
        "participation_1": "3",
        "participation_2": "4",
        "participation_3": "2",
        "participation_4": "1",
        "participation_5": "3",
        "participation_6": "4",
        "participation_7": "3",
        "participation_8": "4",
        "participation_9": "2",
        "participation_10": "5",
        "participation_11": "3",
        "participation_12": "4",
        "participation_13": "5",
        "participation_14": "4",
        "participation_15": "5",
        "school_building": "good_condition",
        "furniture": "adequate",
        "classroom_condition": ["beautiful", "overcrowded"],
        "perimeter_fence": "yes",
        "fence_state": "good_with_gate",
        "toilet_type": "wc",
        "toilet_cubicles_available": "4",
        "toilet_cubicles_minor_repair": "0",
        "toilet_cubicles_major_repair": "0",
        "toilet_cubicles_additional": "0",
        "septic_tank": "available",
        "water_source": "borehole",
        "electricity_source": ["phcn", "generator"],
        "clubs": ["boys_scout", "red_cross"],
        "clubs_frequency": "weekly",
        "sports_equipment": ["football_field", "football"],
        "waterlogged": "no",
        "major_requests": "More library books, A dedicated science lab",
        # Adding a unique identifier to easily find this test entry
        "test_id": f"voices_{int(time.time())}"
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

        assert retrieved_doc["surveyType"] == "voices", f"Expected surveyType to be 'voices', but got {retrieved_doc['surveyType']}"
        assert retrieved_doc["formData"]["voices_schoolName"] == sample_data["voices_schoolName"], "Mismatch in form data (voices_schoolName)"
        assert retrieved_doc["formData"]["voices_difficult_topics"] == sample_data["voices_difficult_topics"], "Mismatch in form data (voices_difficult_topics)"

        print("Data verification successful.")

        # --- 4. Clean up test data ---
        print("Cleaning up test data...")
        delete_result = collection.delete_one(query)
        if delete_result.deleted_count == 1:
            print("Test data successfully deleted.")
        else:
            print("Warning: Test data was not deleted.")

        # --- 5. Report results ---
        print("\n✅ VOICES survey submission test PASSED.")

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
    print("--- Running VOICES Survey Form Submission Test ---")
    print("--- Make sure the backend server is running. ---")
    print("--------------------------------------------------")
    run_test()
