"""

This will:

Open data.csv

For each row where filename ends with .cpd

Request https://example.com/{api_collection}/{id}

Extract each child id from parent.children

Write them into the children column (creating it if needed)

Ref: https://chatgpt.com/share/68e805e0-e720-8004-af97-c3a7bff11434

e.g python fetch_children.py data.csv https://example.com api_collection id filename children




"""


#!/usr/bin/env python3
import csv
import sys
import os
import requests
import json

def main():
    if len(sys.argv) != 7:
        print("Usage: python script.py <csv_path> <root_url> <collection_col> <id_col> <file_col> <children_col>")
        sys.exit(1)

    csv_path, root_url, collection_col, id_col, file_col, children_col = sys.argv[1:]

    if not os.path.exists(csv_path):
        print(f"Error: CSV file '{csv_path}' not found.")
        sys.exit(1)

    # Read CSV
    with open(csv_path, newline='', encoding='utf-8') as f:
        reader = list(csv.DictReader(f))
        fieldnames = reader[0].keys()

    # Add children column if missing
    if children_col not in fieldnames:
        fieldnames = list(fieldnames) + [children_col]

    updated_rows = []

    for row in reader:
        filename = row.get(file_col, "")
        if not filename or not filename.endswith(".cpd"):
            # Skip rows that don't have a .cpd filename
            updated_rows.append(row)
            continue

        collection = row.get(collection_col, "").strip()
        record_id = row.get(id_col, "").strip()

        if not collection or not record_id:
            updated_rows.append(row)
            continue
        # example - https://archives.mountainscholar.org/digital/api/collections/p17393coll70/items/16/false
        url = f"{root_url.rstrip('/')}/{collection}/items/{record_id}/false"
        try:
            response = requests.get(url)
            response.raise_for_status()
            data = response.json()

            children = data.get("parent", {}).get("children", [])
            child_ids = [str(child.get("id")) for child in children if "id" in child]
            row[children_col] = ",".join(child_ids) if child_ids else ""

        except requests.RequestException as e:
            print(f"Request failed for {url}: {e}")
            row[children_col] = ""
        except json.JSONDecodeError:
            print(f"Invalid JSON returned from {url}")
            row[children_col] = ""

        updated_rows.append(row)

    # Write updated CSV
    with open(csv_path, "w", newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(updated_rows)

    print(f"Updated CSV saved: {csv_path}")

if __name__ == "__main__":
    main()
