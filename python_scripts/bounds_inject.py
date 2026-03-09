#!/usr/bin/env python3

"""
bounds_inject.py

This script:
- Opens a CSV file
- Reads a column containing a base URL
- Appends a file extension (e.g., .geojson)
- Downloads the GeoJSON
- Injects it into a new column

Features:
- Optional start row
- Does not overwrite existing values in the output column

Example:

python3 python_scripts/bounds_inject.py \
-source_file "data/Historic Maps.csv" \
-column_name "Georeference Annotation" \
-column_extension ".geojson" \
-new_column "geojson" \
"""

import argparse
import csv
import urllib.request
import json


parser = argparse.ArgumentParser()

parser.add_argument("-source_file", required=True)
parser.add_argument("-column_name", required=True)
parser.add_argument("-column_extension", required=True)
parser.add_argument("-new_column", required=True)
parser.add_argument("-start_row", type=int, default=1, help="Row index to begin processing (default=1, skips header)")

args = parser.parse_args()


# Load CSV
with open(args.source_file, "r", newline="", encoding="utf-8") as f:
    reader = csv.reader(f)
    data = list(reader)


header = data[0]

# Add output column if missing
if args.new_column not in header:
    header.append(args.new_column)

in_col_num = header.index(args.column_name)
out_col_num = header.index(args.new_column)

print("Input column index:", in_col_num)
print("Output column index:", out_col_num)


for i in range(args.start_row, len(data)):

    row = data[i]

    # Ensure row has enough columns
    while len(row) <= out_col_num:
        row.append("")

    source_value = row[in_col_num]
    existing_value = row[out_col_num]

    # Skip if output already exists
    if existing_value.strip() != "":
        print("Output already exists for row", i, "- skipping.",out_col_num, "is not empty.")   
        continue

    # Skip if input is empty
    if source_value.strip() == "":
        print("No source value for row", i, "- skipping.",in_col_num, "is empty.")
        continue

    url = f"{source_value}{args.column_extension}"

    print("Accessing URL:", url)

    try:
        if url.startswith(("http://", "https://")):
           with urllib.request.urlopen(url) as response:
                geojson_data = json.load(response)
        else:
           with open(url, "r", encoding="utf-8") as f:
                geojson_data = json.load(f)

        row[out_col_num] = json.dumps(geojson_data)

    except Exception as e:
        print("Failed:", url, "|", e)
        row[out_col_num] = ""


# Save CSV
with open(args.source_file, "w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerows(data)

print("CSV updated:", args.source_file)