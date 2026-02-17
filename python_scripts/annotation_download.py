'''
The following file:
- opens a csv file
- loops over a specific column
- uses the values to download remote files and place them in a folder

python3 annotation_download.py -source_file "data/Groundwater map urls.csv" -column_name Annotation -output_folder "annotations"

#note be sure to add a 'local_annotation' column to the spreadsheet and use the following formula for the value =CONCATENATE("annotations/",RIGHT(J2, 16),".json")
'''

import argparse
import csv
import urllib.request
import os
from urllib.parse import urlparse

parser = argparse.ArgumentParser()
parser.add_argument("-source_file", required=True)
parser.add_argument("-column_name", required=True)
parser.add_argument("-output_folder", required=True)

args = parser.parse_args()

# Ensure output folder exists
os.makedirs(args.output_folder, exist_ok=True)

with open(args.source_file, 'r', newline='', encoding='utf-8') as input_file:
    csv_reader = csv.DictReader(input_file)

    print("CSV columns:", csv_reader.fieldnames)

    for row in csv_reader:
        try:
            url = row[args.column_name].strip()
            if not url:
                continue

            print(f"Downloading: {url}")

            filename = os.path.basename(urlparse(url).path)
            if not filename.endswith(".json"):
                filename += ".json"

            output_path = os.path.join(args.output_folder, filename)

            urllib.request.urlretrieve(url, output_path)

        except Exception as e:
            print(f"Error downloading {row.get(args.column_name)}: {e}")