import pymongo
import os

def cleanup():
    mongo_uri = "mongodb+srv://bolatan:Ogbogbo123@cluster0.vzjwn4g.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
    db_name = "test"
    collection_name = "surveyresponses"
    report_id = "68a4804dc205dc208e8ae0b8" # The ID from the test

    client = None
    try:
        client = pymongo.MongoClient(mongo_uri)
        db = client[db_name]
        collection = db[collection_name]

        # In Python, we need to import ObjectId to query by _id
        from bson.objectid import ObjectId
        query = {"_id": ObjectId(report_id)}

        print(f"Attempting to delete document with ID: {report_id}")
        delete_result = collection.delete_one(query)

        if delete_result.deleted_count == 1:
            print("Cleanup successful: Test document deleted.")
        else:
            print("Warning: Test document not found or not deleted.")

    except Exception as e:
        print(f"An error occurred during cleanup: {e}")
    finally:
        if client:
            client.close()

if __name__ == "__main__":
    cleanup()
