#!/usr/bin/env python3

"""
extract_lat_lng_featurecollection.py

Extract latitude, longitude, and area (km²) from a GeoJSON FeatureCollection
stored in a CSV column.

- Uses first feature in the FeatureCollection
- Returns centroid for non-point geometries
- Preserves existing values if lat/lng/area already exist

Usage:
python extract_lat_lng_featurecollection.py CSV_FILE GEOJSON_COL LAT_COL LNG_COL AREA_COL [--inplace]

Example:
python python_scripts/extract_lat_lng.py "data/Historic Maps.csv" geojson latitude longitude area --inplace
"""

import argparse
import json
import pandas as pd
from shapely.geometry import shape
from shapely.ops import transform
from pyproj import Transformer


transformer = Transformer.from_crs("EPSG:4326", "EPSG:3857", always_xy=True)


def extract_geometry_info(geojson_str):
    print("Extracting geometry info from GeoJSON:", geojson_str[:100], "...")
    """Return (lat, lng, area_km2) from GeoJSON FeatureCollection."""
    try:
        geojson_obj = json.loads(geojson_str)

        if geojson_obj.get("type") != "FeatureCollection":
            return None, None, None

        features = geojson_obj.get("features", [])
        if not features:
            return None, None, None

        geom = shape(features[0]["geometry"])
        if geom.is_empty:
            return None, None, None

        if geom.geom_type == "Point":
            return geom.y, geom.x, 0.0

        centroid = geom.centroid
        projected = transform(transformer.transform, geom)
        area_km2 = projected.area / 1_000_000

        return centroid.y, centroid.x, area_km2

    except Exception as e:
        print(f"Error processing row: {e} , {geojson_col}: {geojson_str}")
        return None, None, None


def process_row(row, geojson_col, lat_col, lng_col, area_col):
    """Only compute values if they are missing."""
    if pd.notna(row[lat_col]) and pd.notna(row[lng_col]) and pd.notna(row[area_col]):
        return row[[lat_col, lng_col, area_col]]

    lat, lng, area = extract_geometry_info(row[geojson_col])
    return pd.Series([lat, lng, area], index=[lat_col, lng_col, area_col])


def main():
    parser = argparse.ArgumentParser(
        description="Extract lat/lng and area (km²) from GeoJSON FeatureCollection column in a CSV."
    )

    parser.add_argument("csv_file")
    parser.add_argument("geojson_col")
    parser.add_argument("lat_col")
    parser.add_argument("lng_col")
    parser.add_argument("area_col")

    parser.add_argument("--inplace", action="store_true")
    parser.add_argument("--start_row", type=int, default=0)

    args = parser.parse_args()

    df = pd.read_csv(args.csv_file)

    # Create columns if missing
    # for col in [args.lat_col, args.lng_col, args.area_col]:
    #     if col not in df.columns:
    #         df[col] = None

    # Process only rows after start_row
    subset = df.iloc[args.start_row:]
    print( f"Processing {len(subset)} rows starting from index {args.start_row}...")
    results = subset.apply(
        process_row,
        axis=1,
        geojson_col=args.geojson_col,
        lat_col=args.lat_col,
        lng_col=args.lng_col,
        area_col=args.area_col,
    )

    df.loc[subset.index, [args.lat_col, args.lng_col, args.area_col]] = results

    output_file = args.csv_file if args.inplace else f"{args.csv_file}_processed.csv"
    df.to_csv(output_file, index=False)

    print(f"CSV saved as: {output_file}")


if __name__ == "__main__":
    main()