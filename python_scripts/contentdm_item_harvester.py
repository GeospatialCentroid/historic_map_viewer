#!/usr/bin/env python3
"""
contentdm_item_harvester.py

Harvest ContentDM item metadata into a CSV.

Features
--------
- Reads itemIds from a ContentDM search endpoint (Standard Mode)
- Extracts unique missing parent records from an existing CSV (Parent-Only Mode)
- Extracts unique missing child records from an existing CSV (Child-Only Mode)
- Retrieves each item record individually
- Expands metadata fields into columns using LABEL as the column name
- Dynamically adds new columns when new labels appear
- Appends only records whose unique ID is not already present
- Supports harvesting only selected IDs
- Safely inherits parent metadata to fill blank/missing child fields


Examples
--------

Harvest all search results (Standard Mode):

python python_scripts/contentdm_item_harvester.py \
  --search-url "https://fchc.contentdm.oclc.org/digital/api/search/collection/hm/searchterm/scanned+maps/maxRecords/200" \
  --item-base-url "https://fchc.contentdm.oclc.org/digital/api/collections/hm/items/" \
  --output data/fcmod_scanned_maps.csv

Run in Parent-Only Mode:

python python_scripts/contentdm_item_harvester.py \
  --parent-mode \
  --parent-id "parentId" \
  --item-id "id" \
  --child-ids "children" \
  --item-base-url "https://fchc.contentdm.oclc.org/digital/api/collections/hm/items/" \
  --output data/fcmod_scanned_maps.csv

Run in Child-Only Mode:

python python_scripts/contentdm_item_harvester.py \
  --child-mode \
  --item-id "id" \
  --child-ids "children" \
  --item-base-url "https://fchc.contentdm.oclc.org/digital/api/collections/hm/items/" \
  --output data/fcmod_scanned_maps.csv
"""


import argparse
import sys
import time
from pathlib import Path

import pandas as pd
import requests


def get_json(url):
    """
    Download JSON from a URL.
    """
    response = requests.get(url, timeout=60)
    response.raise_for_status()
    return response.json()


def get_item_ids(search_url):
    """
    Extract itemId values from a ContentDM search response.
    """
    if not search_url:
        raise ValueError("Search URL is required when not running in parent or child mode.")

    data = get_json(search_url)

    if "items" not in data:
        raise ValueError(
            "Search response does not contain an 'items' key."
        )

    item_ids = []

    for item in data["items"]:
        item_id = item.get("itemId")
        if item_id is not None:
            item_ids.append(str(item_id))

    return item_ids


def flatten_item(item, id_field="id"):
    """
    Convert an item JSON document into a flat row.
    Preserves top-level properties.
    Uses metadata LABEL values as column names for fields.
    Inherits parent metadata to fill in any blank or missing fields in the primary object.
    """
    row = {}

    # Preserve top-level attributes (ignoring the raw 'fields' array)
    for key, value in item.items():
        if key == "fields":
            continue
        row[key] = value

    # Ensure requested ID field exists
    if id_field not in row:
        if id_field == "itemId":
            if "id" in row:
                row["itemId"] = row["id"]
            elif "requestedId" in row:
                row["itemId"] = row["requestedId"]

    requested_id = item.get("requestedId")
    actual_id = item.get("id")
    
    child_fields = item.get("fields", [])
    parent_fields = []
    if isinstance(item.get("parent"), dict) and "fields" in item["parent"]:
        parent_fields = item["parent"]["fields"]

    # CONTENTdm Compound Object Quirk Priority Setup:
    # If requestedId != id, we asked for a parent wrapper but got a child. 
    # Therefore, the Parent metadata takes precedence. Otherwise, Child takes precedence.
    if requested_id is not None and actual_id is not None and str(requested_id) != str(actual_id):
        primary_fields = parent_fields
        secondary_fields = child_fields
    else:
        primary_fields = child_fields
        secondary_fields = parent_fields

    # 1. Map primary fields directly to their label columns
    for field in primary_fields:
        label = field.get("label")
        value = field.get("value")
        if label and label.strip():
            row[label.strip()] = value

    # 2. Map secondary fields ONLY if the column is missing or blank
    for field in secondary_fields:
        label = field.get("label")
        value = field.get("value")
        
        if label and label.strip():
            label_clean = label.strip()
            
            # Check if the row lacks this label, or if the current value is None/Empty String
            if label_clean not in row or row[label_clean] is None or str(row[label_clean]).strip() == "":
                row[label_clean] = value

    return row


def load_existing_ids(output_file, id_field):
    """
    Load existing IDs from CSV.
    """
    output_path = Path(output_file)

    if not output_path.exists():
        return set()

    df = pd.read_csv(
        output_file,
        dtype=str,
        low_memory=False
    )

    if id_field not in df.columns:
        return set()

    return set(
        df[id_field]
        .dropna()
        .astype(str)
    )


def save_rows(rows, output_file, id_field):
    """
    Append only rows whose id_field is not already present.
    """
    new_df = pd.DataFrame(rows)

    if id_field not in new_df.columns:
        raise ValueError(
            f"'{id_field}' not found in harvested data."
        )

    output_path = Path(output_file)

    # First run
    if not output_path.exists():
        new_df.to_csv(
            output_file,
            index=False
        )
        print(
            f"Created {output_file} "
            f"with {len(new_df):,} records."
        )
        return

    existing_df = pd.read_csv(
        output_file,
        dtype=str,
        low_memory=False
    )

    existing_ids = set(
        existing_df[id_field]
        .dropna()
        .astype(str)
    )

    new_df[id_field] = (
        new_df[id_field]
        .astype(str)
    )

    rows_to_add = new_df[
        ~new_df[id_field].isin(existing_ids)
    ]

    if rows_to_add.empty:
        print("No new records found.")
        return

    combined = pd.concat(
        [existing_df, rows_to_add],
        ignore_index=True,
        sort=False
    )

    combined.to_csv(
        output_file,
        index=False
    )

    print(
        f"Added {len(rows_to_add):,} new records.\n"
        f"Total records: {len(combined):,}"
    )


def main():
    parser = argparse.ArgumentParser(
        description="Harvest ContentDM item metadata."
    )

    parser.add_argument(
        "--search-url",
        help="ContentDM search API URL (Required unless running in a local processing mode)"
    )

    parser.add_argument(
        "--item-base-url",
        required=True,
        help="Base URL for item requests"
    )

    parser.add_argument(
        "-o",
        "--output",
        default="contentdm_items.csv",
        help="Output CSV filename"
    )

    parser.add_argument(
        "--id-field",
        default="itemId",
        help="Field used for uniqueness checking (Overridden by --item-id in local tracking modes)"
    )

    parser.add_argument(
        "--ids",
        help=(
            "Optional comma-separated list of item IDs "
            "to harvest. Example: 788,789,790"
        )
    )

    parser.add_argument(
        "--sleep",
        type=float,
        default=0,
        help="Sleep between requests"
    )

    # Operational Mode Selection flags
    parser.add_argument(
        "--parent-mode",
        action="store_true",
        help="Extract parent records missing from the current dataset directly from the output CSV."
    )

    parser.add_argument(
        "--child-mode",
        action="store_true",
        help="Extract child records missing from the current dataset directly from the output CSV."
    )

    parser.add_argument(
        "--parent-id",
        help="Column name for tracking parent IDs (Used in parent-mode)."
    )

    parser.add_argument(
        "--item-id",
        help="Column name for tracking unique record item IDs (Used in parent-mode and child-mode)."
    )

    parser.add_argument(
        "--child-ids",
        help="Column name where comma-separated child IDs are stored or will be saved."
    )

    args = parser.parse_args()

    try:
        # Determine target item IDs based on runtime mode selection
        if args.parent_mode:
            if not args.parent_id or not args.item_id or not args.child_ids:
                raise ValueError("Parent mode requires explicit --parent-id, --item-id, and --child-ids column headers.")
            
            output_path = Path(args.output)
            if not output_path.exists():
                raise FileNotFoundError(f"Target dataset file '{args.output}' must exist to map dependencies in parent-mode.")
            
            args.id_field = args.item_id

            print(f"Running in Parent-Only Mode. Analyzing {args.output}...")
            df = pd.read_csv(args.output, dtype=str, low_memory=False)

            if args.parent_id not in df.columns or args.item_id not in df.columns:
                raise ValueError(f"Required tracking columns missing from target file columns.")

            unique_parents = set(df[args.parent_id].dropna().astype(str).unique())
            unique_items = set(df[args.item_id].dropna().astype(str).unique())
            item_ids = list(unique_parents - unique_items)
            print(f"Discovered {len(unique_parents):,} parent references. {len(item_ids):,} lack parent records and will be built.")

        elif args.child_mode:
            if not args.item_id or not args.child_ids:
                raise ValueError("Child mode requires explicit --item-id and --child-ids column headers.")
            
            output_path = Path(args.output)
            if not output_path.exists():
                raise FileNotFoundError(f"Target dataset file '{args.output}' must exist to extract children in child-mode.")
            
            args.id_field = args.item_id

            print(f"Running in Child-Only Mode. Analyzing {args.output}...")
            df = pd.read_csv(args.output, dtype=str, low_memory=False)

            if args.item_id not in df.columns or args.child_ids not in df.columns:
                raise ValueError(f"Required tracking columns missing from target file columns.")

            unique_items = set(df[args.item_id].dropna().astype(str).unique())
            
            # Unpack comma-separated strings into a unified set of child IDs
            unique_children = set()
            for children_str in df[args.child_ids].dropna().astype(str):
                for cid in children_str.split(","):
                    cid_clean = cid.strip().lstrip("'")# remove any "'" which was added to prevent excel from munging number
                    if cid_clean:
                        unique_children.add(cid_clean)

            item_ids = list(unique_children - unique_items)
            print(f"Discovered {len(unique_children):,} child references. {len(item_ids):,} lack dedicated records and will be built.")

        else:
            if not args.search_url:
                raise ValueError("--search-url is mandatory when operating outside local data alignment modes.")
            item_ids = get_item_ids(args.search_url)

        # Restrict execution targeting explicit ID overrides
        if args.ids:
            requested_ids = {
                x.strip()
                for x in args.ids.split(",")
                if x.strip()
            }
            item_ids = [x for x in item_ids if x in requested_ids]
            print(f"Filtered target runtime execution to {len(item_ids):,} explicitly requested overrides.")

        # Strip duplicates already parsed down locally
        existing_ids = load_existing_ids(args.output, args.id_field)
        rows = []
        total = len(item_ids)

        for count, item_id in enumerate(item_ids, start=1):
            if item_id in existing_ids:
                print(f"[{count}/{total}] Skipping established tracking ID: {item_id}")
                continue

            item_url = (
                args.item_base_url.rstrip("/")
                + "/"
                + item_id + "/false"
            )

            print(f"[{count}/{total}] Fetching object metadata: {item_id} at {item_url}")

            try:
                item_json = get_json(item_url)
                row = flatten_item(item_json, args.id_field)

                # Guarantee uniqueness column parameters match layout identities
                row[args.id_field] = item_id

                # Parse children payload definitions if tracking targets are requested
                if args.child_ids:
                    children_nodes = []
                    if isinstance(item_json.get("parent"), dict):
                        children_nodes = item_json["parent"].get("children", [])
                    
                    if not children_nodes:
                        children_nodes = item_json.get("children", [])
                    
                    extracted_children = []
                    if isinstance(children_nodes, list):
                        for node in children_nodes:
                            if isinstance(node, dict):
                                cid = node.get("id") or node.get("itemId")
                                if cid is not None:
                                    extracted_children.append(str(cid))
                            else:
                                extracted_children.append(str(node))
                    
                    row[args.child_ids] = "'"+",".join(extracted_children)# prevent excel from treating number list as number

                rows.append(row)

            except Exception as exc:
                print(f"Failed to cleanly process item record {item_id}: {exc}", file=sys.stderr)

            if args.sleep:
                time.sleep(args.sleep)

        if not rows:
            print("Processing complete. No new objects encountered.")
            return

        save_rows(rows, args.output, args.id_field)

    except Exception as exc:
        print(f"CRITICAL FAULT: {exc}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()