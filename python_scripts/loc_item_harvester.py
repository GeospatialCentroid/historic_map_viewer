"""
Library of Congress (LOC) API Harvester

This script queries a LOC search URL or specific item IDs, extracts parent items 
and their child resources using the LOC JSON API, and flattens the nested 
metadata into a structured CSV file. It ignores items that have already been 
harvested.

Usage:
    python loc_harvester.py <search_url> <output_csv_filename> [--ids ID1,ID2]

Examples:
    python loc_harvester.py "url?id=3?q=fort+collins" output.csv
    python python_scripts/loc_item_harvester.py "https://www.loc.gov/collections/sanborn-maps/?q=fort+collins" data/output.csv --ids "http://www.loc.gov/item/sanborn00996_005/"
"""

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
import csv
import argparse
import sys
import os

# Create a session with a retry strategy
session = requests.Session()
retries = Retry(
    total=5,              # Total number of retries
    backoff_factor=1,     # Wait 1s, 2s, 4s, 8s, 16s between retries
    status_forcelist=[500, 502, 503, 504],
    allowed_methods=["GET"]
)
session.mount("https://", HTTPAdapter(max_retries=retries))

def flatten_dict(d, parent_key='', sep='_'):
    """Flattens nested dictionaries and lists into a single-level dictionary."""
    items = []
    if not isinstance(d, dict):
        return {}
        
    for k, v in d.items():
        new_key = f"{parent_key}{sep}{k}" if parent_key else k
        if isinstance(v, dict):
            items.extend(flatten_dict(v, new_key, sep=sep).items())
        elif isinstance(v, list):
            items.append((new_key, ", ".join([str(i) for i in v])))
        else:
            items.append((new_key, v))
    return dict(items)

def load_existing_records(filename):
    """Loads existing CSV records to avoid duplicate harvesting."""
    existing_records = []
    seen_ids = set()
    if os.path.exists(filename):
        try:
            with open(filename, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    existing_records.append(row)
                    if 'id' in row and row['id']:
                        seen_ids.add(row['id'])
            print(f"Loaded {len(existing_records)} existing records. Resuming harvest...")
        except Exception as e:
            print(f"Warning: Could not read existing file {filename}: {e}")
    return existing_records, seen_ids

def harvest_loc_data(search_url, output_filename, target_ids_str):
    existing_records, seen_ids = load_existing_records(output_filename)
    new_records = []
    
    # Determine the items to process
    if target_ids_str:
        # Create a mock list of items based solely on the requested IDs
        target_ids = [t.strip() for t in target_ids_str.split(',') if t.strip()]
        items_to_process = [{'id': t_id} for t_id in target_ids]
        print(f"Targeting {len(items_to_process)} specific ID(s) exclusively.")
    else:
        # Fetch from the main search URL
        if 'fo=json' not in search_url:
            search_url += '&fo=json' if '?' in search_url else '?fo=json'
        print(f"Fetching search results from: {search_url}")
        try:
            response = requests.get(search_url)
            response.raise_for_status()
            data = response.json()
            items_to_process = data.get('results', [])
        except requests.exceptions.RequestException as e:
            print(f"Error fetching the search URL: {e}")
            sys.exit(1)

    # Process items
    for item in items_to_process:
        parent_id = item.get('id')
        if not parent_id or 'collection' in item.get('original_format', []):
            continue
            
        if parent_id in seen_ids:
            print(f"Skipping parent {parent_id} - already exists in CSV.")
            continue
            
        print(f"Processing parent: {parent_id}")
        
        # Fetch detailed parent JSON to get resources block
        item_detail_url = f"{parent_id}?fo=json" if 'fo=json' not in parent_id else parent_id
        try:
            detail_response = requests.get(item_detail_url)
            detail_response.raise_for_status()
            detail_data = detail_response.json()
        except requests.exceptions.RequestException as e:
            print(f"  Error fetching details for {parent_id}: {e}")
            continue

        item_data = detail_data.get('item', {})
        resources = item_data.get('resources', [])
        if not resources:
            resources = detail_data.get('resources', [])
            
        child_ids = []
        child_records = []
        
       # Extract children
        for resource_group in resources:
            if not isinstance(resource_group, dict):
                continue
                
            # use of the 'url' endpoint for children if it exists
            # This is much more reliable than parsing the 'files' key
            search_url = resource_group.get('url')
            
            if search_url:
                # Add format parameter if missing
                if 'fo=json' not in search_url:
                    search_url += '&fo=json' if '?' in search_url else '?fo=json'
                search_url +='&c=1000' # to get all the children in one request.
                print("Requesting URL",search_url)
                try:
                    # Use session.get instead of requests.get
                    child_res = session.get(search_url, timeout=30) 
                    child_res.raise_for_status()
                    child_data = child_res.json()
                    
                    # Loop over the children
                    for child_item in child_data.get('segments', []):
                        child_id = child_item.get('id')
                        if child_id and child_id not in seen_ids:
                            child_ids.append(child_id)
                            
                            flat_child = flatten_dict(child_item)
                            flat_child['record_type'] = 'Child'
                            flat_child['parent_id'] = parent_id
                            flat_child['id'] = child_id
                            
                            child_records.append(flat_child)
                            seen_ids.add(child_id)
                            print(f"    Added child: {child_id}")
                except Exception as e:
                    print(f"    Failed to harvest child search: {e}")
            else:
                print("    No 'search' URL found in resources, skipping children for this item.")
        # Fallback logic if 'url' exists but doesn't return child search results
        if not child_records and 'files' in resource_group:
                # Logic for handling direct file lists if the 'url' endpoint 
                # points to a single file instead of a set of children
                pass
        # Flatten parent metadata using the rich detail data, not the search data
        parent_metadata = detail_data.get('item', item)
        flat_parent = flatten_dict(parent_metadata)
        flat_parent['record_type'] = 'Parent'
        flat_parent['parent_id'] = ''
        flat_parent['id'] = parent_id
        flat_parent['children'] = ", ".join(child_ids) 
        
        new_records.append(flat_parent)
        new_records.extend(child_records)
        seen_ids.add(parent_id)

    # Combine existing and new records
    all_records = existing_records + new_records

    if not all_records:
        print("No records found or added.")
        sys.exit(0)

    # Collect all unique column headers across ALL records (old + new)
    fieldnames = set()
    for record in all_records:
        fieldnames.update(record.keys())
        
    core_fields = ['record_type', 'parent_id', 'children', 'title', 'id']
    sorted_fieldnames = core_fields + [f for f in sorted(list(fieldnames)) if f not in core_fields]

    # Write back to CSV
    try:
        with open(output_filename, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=sorted_fieldnames)
            writer.writeheader()
            for record in all_records:
                writer.writerow(record)
        print(f"\nSuccess! Exported/Updated CSV. Total records: {len(all_records)} (New: {len(new_records)})")
    except IOError as e:
        print(f"Error writing to file {output_filename}: {e}")

def main():
    parser = argparse.ArgumentParser(
        description="Harvest metadata and child items from LOC and export to CSV."
    )
    
    parser.add_argument(
        "search_url", 
        type=str, 
        help="The LOC search URL (e.g., https://www.loc.gov/collections/sanborn-maps/?q=fort+collins). Can be a dummy URL if using --ids."
    )
    parser.add_argument(
        "output_csv", 
        type=str, 
        help="The desired filename for the output CSV."
    )
    parser.add_argument(
        "--ids", 
        type=str, 
        default="", 
        help="Comma-separated list of specific item IDs (URLs) to harvest exclusively. Overrides search URL."
    )
    
    args = parser.parse_args()
    
    harvest_loc_data(args.search_url, args.output_csv, args.ids)

if __name__ == "__main__":
    main()