import sqlite3
import json
import ijson  # To install: pip install ijson

# Path to the JSON file
json_file_path = 'data.json'

# SQLite database file
db_file = 'vinayak.db'

# Connect to SQLite database
conn = sqlite3.connect(db_file)
cursor = conn.cursor()

# Create table if not exists
cursor.execute('''
CREATE TABLE IF NOT EXISTS vehicles(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dataId TEXT NULL,
    bankName TEXT NULL,
    branch TEXT NULL,
    regNo TEXT NULL,
    loanNo TEXT NULL,
    customerName TEXT NULL,
    model TEXT NULL,
    maker TEXT NULL,
    chasisNo TEXT NULL,
    engineNo TEXT NULL,
    emi TEXT NULL,
    bucket TEXT NULL,
    pos TEXT NULL,
    tos TEXT NULL,
    allocation TEXT NULL,
    callCenterNo1 TEXT NULL,
    callCenterNo1Name TEXT NULL,
    callCenterNo1Email TEXT NULL,
    callCenterNo2 TEXT NULL,
    callCenterNo2Name TEXT NULL,
    callCenterNo2Email TEXT NULL,
    callCenterNo3 TEXT NULL,
    callCenterNo3Name TEXT NULL,
    callCenterNo3Email TEXT NULL,
    address TEXT NULL,
    sec17 TEXT NULL,
    agreementNo TEXT NULL,
    dlCode TEXT NULL,
    color TEXT NULL,
    lastDigit TEXT NULL,
    loadStatus TEXT NULL,
    month TEXT NULL,
    status TEXT NULL,
    fileName TEXT NULL,
    createdAt TEXT NULL,
    updatedAt TEXT NULL
)
''')

# Prepare insert query
insert_query = '''
INSERT INTO vehicles (
    dataId,
    bankName,
    branch,
    regNo,
    loanNo,
    customerName,
    model,
    maker,
    chasisNo,
    engineNo,
    emi,
    bucket,
    pos,
    tos,
    allocation,
    callCenterNo1,
    callCenterNo1Name,
    callCenterNo1Email,
    callCenterNo2,
    callCenterNo2Name,
    callCenterNo2Email,
    callCenterNo3,
    callCenterNo3Name,
    callCenterNo3Email,
    address,
    sec17,
    agreementNo,
    dlCode,
    color,
    lastDigit,
    loadStatus,
    month,
    status,
    fileName,
    createdAt,
    updatedAt
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?,?)
'''

# Batch size for bulk insert
batch_size = 1000
batch_data = []

# Use ijson to stream the JSON file
with open(json_file_path, 'r', encoding='utf-8') as file:
    parser = ijson.items(file, 'item')

    for item in parser:
        created_at = item.get('createdAt', {}).get('$date', None)
        updated_at = item.get('updatedAt', {}).get('$date', None)

        values = (
            item.get('_id', {}).get('$oid', None),
            item.get('bankName', None),
            item.get('branch', None),
            item.get('regNo', None),
            item.get('loanNo', None),
            item.get('customerName', None),
            item.get('model', None),
            item.get('maker', None),
            item.get('chasisNo', None),
            item.get('engineNo', None),
            item.get('emi', None),
            item.get('bucket', None),
            item.get('pos', None),
            item.get('tos', None),
            item.get('allocation', None),
            item.get('callCenterNo1', None),
            item.get('callCenterNo1Name', None),
            item.get('callCenterNo1Email', None),
            item.get('callCenterNo2', None),
            item.get('callCenterNo2Name', None),
            item.get('callCenterNo2Email', None),
            item.get('callCenterNo3', None),
            item.get('callCenterNo3Name', None),
            item.get('callCenterNo3Email', None),
            item.get('address', None),
            item.get('sec17', None),
            item.get('agreementNo', None),
            item.get('dlCode', None),
            item.get('color', None),
            item.get('lastDigit', None),
            item.get('loadStatus', None),
            item.get('month', None),
            item.get('status', None),
            item.get('fileName', None),
            created_at,
            updated_at
        )

        batch_data.append(values)

        if len(batch_data) >= batch_size:
            cursor.executemany(insert_query, batch_data)
            conn.commit()  # Commit the batch
            batch_data.clear()  # Clear the batch

    # Insert remaining data
    if batch_data:
        cursor.executemany(insert_query, batch_data)
        conn.commit()

# Close the connection
conn.close()

print("Data inserted successfully.")
