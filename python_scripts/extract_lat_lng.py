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
python python_scripts/extract_lat_lng.py "data/Historic Maps.csv" geojson latitude longitude  area --inplace

"""

#!/usr/bin/env python3

import argparse
import pandas as pd
import json
from shapely.geometry import shape
from shapely.ops import transform
from pyproj import Transformer


def extract_geometry_info(geojson_str):
    """
    Extract latitude, longitude, and area (km²) from a GeoJSON FeatureCollection string.
    - Uses first feature.
    - Returns centroid for non-point geometries.
    - Area returned in square kilometers.
    """
    try:
        geojson_obj = json.loads(geojson_str)
        if geojson_obj.get("type") != "FeatureCollection":
            raise ValueError("Expected a FeatureCollection")

        features = geojson_obj.get("features", [])
        if not features:
            return None, None, None

        geom = shape(features[0]["geometry"])
        if geom.is_empty:
            return None, None, None

        # Extract centroid or point coords
        if geom.geom_type == "Point":
            lat, lng = geom.y, geom.x
            area_km2 = 0.0
        else:
            centroid = geom.centroid
            lat, lng = centroid.y, centroid.x

            # Reproject to Web Mercator (meters)
            transformer = Transformer.from_crs(
                "EPSG:4326", "EPSG:3857", always_xy=True
            )
            projected_geom = transform(transformer.transform, geom)

            area_m2 = projected_geom.area
            area_km2 = area_m2 / 1_000_000

        return lat, lng, area_km2

    except Exception as e:
        print(f"Warning: failed to parse GeoJSON: {e}")
        return None, None, None


def main():
    parser = argparse.ArgumentParser(
        description="Extract lat/lng and area (km²) from GeoJSON FeatureCollection column in a CSV."
    )
    parser.add_argument("csv_file", help="Path to the CSV file")
    parser.add_argument("geojson_col", help="Name of the column containing GeoJSON")
    parser.add_argument("lat_col", help="Name of the latitude column to create")
    parser.add_argument("lng_col", help="Name of the longitude column to create")
    parser.add_argument("area_col", help="Name of the area (km²) column to create")
    parser.add_argument(
        "--inplace",
        action="store_true",
        help="If set, updates the source CSV file instead of creating a new one",
    )
    parser.add_argument(
        "--start-row",
        type=int,
        default=0,
        help="Row index to start processing from (0-based index). Default is 0."
    )

    args = parser.parse_args()

    df = pd.read_csv(args.csv_file)

    latitudes = []
    longitudes = []
    areas = []

    for i, geojson_str in enumerate(df[args.geojson_col]):
        if i < args.start_row:
            latitudes.append(None)
            longitudes.append(None)
            areas.append(None)
            continue

        lat, lng, area = extract_geometry_info(geojson_str)
        latitudes.append(lat)
        longitudes.append(lng)
        areas.append(area)

    df[args.lat_col] = latitudes
    df[args.lng_col] = longitudes
    df[args.area_col] = areas

    output_file = args.csv_file if args.inplace else f"processed_{args.csv_file}"
    df.to_csv(output_file, index=False)

    print(f"CSV saved as: {output_file}")


if __name__ == "__main__":
    main()

