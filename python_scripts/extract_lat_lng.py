#!/usr/bin/env python3

"""
extract_lat_lng_featurecollection.py

A command-line utility to extract latitude and longitude from a GeoJSON column in a CSV.
Supports GeoJSON FeatureCollections with one or more Features. For Point geometries,
returns the point coordinates; for other geometries, returns the centroid coordinates.

Usage:
    python extract_lat_lng_featurecollection.py CSV_FILE GEOJSON_COL LAT_COL LNG_COL [--inplace]

Positional arguments:
    CSV_FILE      Path to the CSV file
    GEOJSON_COL   Name of the column containing GeoJSON FeatureCollection
    LAT_COL       Name of the latitude column to create
    LNG_COL       Name of the longitude column to create

Optional arguments:
    --inplace     Update the source CSV file instead of creating a new one

Dependencies:
    pandas, shapely

Example call
python python_scripts/extract_lat_lng.py "data/Historic Maps.csv" geojson latitude longitude --inplace

"""

import argparse
import pandas as pd
import json
from shapely.geometry import shape

def extract_lat_lng_from_featurecollection(geojson_str):
    """
    Extract latitude and longitude from a GeoJSON FeatureCollection string.
    - Takes the first feature's geometry.
    - Returns centroid for non-point geometries.
    """
    try:
        geojson_obj = json.loads(geojson_str)
        if geojson_obj.get("type") != "FeatureCollection":
            raise ValueError("Expected a FeatureCollection")

        features = geojson_obj.get("features", [])
        if not features:
            return None, None

        # Take the first feature's geometry
        geom = shape(features[0]["geometry"])
        if geom.is_empty:
            return None, None

        if geom.geom_type == 'Point':
            return geom.y, geom.x
        else:
            centroid = geom.centroid
            return centroid.y, centroid.x

    except Exception as e:
        print(f"Warning: failed to parse GeoJSON '{geojson_str}': {e}")
        return None, None

def main():
    parser = argparse.ArgumentParser(description="Extract lat/lng from GeoJSON FeatureCollection column in a CSV.")
    parser.add_argument("csv_file", help="Path to the CSV file")
    parser.add_argument("geojson_col", help="Name of the column containing GeoJSON")
    parser.add_argument("lat_col", help="Name of the latitude column to create")
    parser.add_argument("lng_col", help="Name of the longitude column to create")
    parser.add_argument("--inplace", action="store_true",
                        help="If set, updates the source CSV file instead of creating a new one")
    args = parser.parse_args()

    # Read CSV
    df = pd.read_csv(args.csv_file)

    # Extract lat/lng
    latitudes = []
    longitudes = []
    for geojson_str in df[args.geojson_col]:
        lat, lng = extract_lat_lng_from_featurecollection(geojson_str)
        latitudes.append(lat)
        longitudes.append(lng)

    # Add new columns
    df[args.lat_col] = latitudes
    df[args.lng_col] = longitudes

    # Save CSV
    output_file = args.csv_file if args.inplace else f"processed_{args.csv_file}"
    df.to_csv(output_file, index=False)
    print(f"CSV saved as: {output_file}")

if __name__ == "__main__":
    main()
