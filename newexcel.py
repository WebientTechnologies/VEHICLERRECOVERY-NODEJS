import pandas as pd
import pymongo
from bson import ObjectId
import time
import argparse

# MongoDB setup (adjust the connection string as needed)
client = pymongo.MongoClient("mongodb://anilvinayak:VinayakAnil%23123321@127.0.0.1:27017/vehicle-recovery??authSource=admin&directConnection=true&serverSelectionTimeoutMS=2000&appName=vehicle-recovery")
db = client["vehicle-recovery"]
vehicle_data_collection = db["vehicledatas"]

def upload_file(file_path):
    try:
        # Read all sheets from the Excel file
        print("Reading the Excel file...")
        start_time = time.time()
        excel_data = pd.read_excel(file_path, sheet_name=None)  # Reads all sheets as a dictionary
        print(f"File read successfully with {len(excel_data)} sheets.")

        for sheet_name, sheet_data in excel_data.items():
            print(f"\nProcessing sheet: {sheet_name} with {len(sheet_data)} rows.")
            process_sheet_data(sheet_data.fillna(''), file_path, sheet_name)  # Fill empty cells with empty string
        
        end_time = time.time()
        print(f"File uploaded and data inserted successfully from {file_path} in {end_time - start_time:.2f} seconds.")
    
    except Exception as e:
        print(f"An error occurred: {e}")

def process_sheet_data(sheet_data, file_path, sheet_name):
    total_rows = len(sheet_data)
    batch_size = 1000
    records_to_insert = []
    inserted_records = 0

    # Process each row and create records for MongoDB
    for index, row in sheet_data.iterrows():
        last_digit = row.get("LastDigit") or (str(row.get("RegistrationNumber", ""))[-4:] if isinstance(row.get("RegistrationNumber"), str) else '')

        vehicle_data = {
            "bankName": str(row.get("BANKNAME")),
            "branch": str(row.get("Branch")),
            "regNo": str(row.get("RegistrationNumber")),  # Convert to string
            "loanNo": str(row.get("LoanNumber")),  # Convert to string
            "customerName": str(row.get("CustomerName")),
            "model": str(row.get("Model")),
            "maker": str(row.get("Make")),
            "chasisNo": str(row.get("ChasisNumber")),  # Convert to string
            "engineNo": str(row.get("EngineNumber")),  # Convert to string
            "emi": str(row.get("EMI")),
            "bucket": str(row.get("Bucket")),
            "pos": str(row.get("POS")),
            "tos": str(row.get("TOS")),
            "allocation": str(row.get("Allocation")),
            "callCenterNo1Name": str(row.get("ConfirmerName1")),
            "callCenterNo1": str(row.get("ConfirmerNo1")),  # Convert to string
            "callCenterNo1Email": str(row.get("ConfirmerEmail1")),
            "callCenterNo2Name": str(row.get("ConfirmerName2")),
            "callCenterNo2": str(row.get("ConfirmerNo2")),  # Convert to string
            "callCenterNo2Email": str(row.get("ConfirmerEmail2")),
            "callCenterNo3Name": str(row.get("ConfirmerName3")),
            "callCenterNo3": str(row.get("ConfirmerNo3")),  # Convert to string
            "callCenterNo3Email": str(row.get("ConfirmerEmail3")),
            "status": " ",
            "lastDigit": str(last_digit),  # Ensure lastDigit is a string
            "loadStatus":"",  # Adding empty load status
            "address": str(row.get("Address")),
            "sec17": str(row.get("Sec17")),
            "fileName": str(file_path),
            "month": "July"
        }

        records_to_insert.append(vehicle_data)

        # Insert in batches
        if len(records_to_insert) >= batch_size:
            vehicle_data_collection.insert_many(records_to_insert)
            inserted_records += len(records_to_insert)
            records_to_insert = []  # Clear the batch

            # Progress update
            percent_done = (inserted_records / total_rows) * 100
            print(f"Inserted {inserted_records}/{total_rows} records from sheet '{sheet_name}' ({percent_done:.2f}% complete)")

    # Insert any remaining records
    if records_to_insert:
        vehicle_data_collection.insert_many(records_to_insert)
        inserted_records += len(records_to_insert)
        percent_done = (inserted_records / total_rows) * 100
        print(f"Inserted {inserted_records}/{total_rows} records from sheet '{sheet_name}' ({percent_done:.2f}% complete)")

# Main script to handle command-line arguments
if __name__ == "__main__":
    # Argument parser to accept --filePath argument from command-line
    parser = argparse.ArgumentParser(description="Upload Excel file to MongoDB")
    parser.add_argument('--filePath', required=True, help="Path to the Excel file to be uploaded")
    args = parser.parse_args()

    # Call the upload function with the file path from arguments
    upload_file(args.filePath)
