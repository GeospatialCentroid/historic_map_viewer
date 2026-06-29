# Data Processing Scripts

This repository contains several Python scripts designed to automate data processing tasks. 
Each script is run from the command line to perform specific functions such as data enrichment, API lookups, and file updates.


## Installation

1. Clone or download this repository:
   ```bash
   git clone https://github.com/GeospatialCentroid/historic_map_viewer/
   cd your-repo
   ```

2. Ensure you have Python 3 installed:
   ```bash
   python3 --version
   ```

3. (Recommended) Create a virtual environment:

   ```bash
   python3 -m venv .venv
   ```

4. Activate the virtual environment:

   **On macOS/Linux:**
   ```bash
   source .venv/bin/activate
   ```

   **On Windows (PowerShell):**
   ```bash
   .\.venv\Scripts\Activate.ps1
   ```

5. Install dependencies:
   ```bash
   pip install -r python_scripts/requirements.txt
   ```


## Overview

Each script in this repository serves a distinct purpose. Please execute each one to:

### Fetch Child Records (fetch_children.py)

**Purpose**
Retrieves child records from a CONTENTdm collection API and appends them to the source CSV.

**What it Does**

* Reads the source CSV (Historic Maps.csv)

* Uses the provided collection API endpoint

* Matches records using the CONTENTdm number field

* Extracts child item metadata (e.g., CONTENTdm file name)

* Writes child record data to a new column (children)

**Command**
```
python python_scripts/fetch_children.py \
  "data/Historic Maps.csv" \
  https://archives.mountainscholar.org/digital/api/collections/ \
  collection \
  "CONTENTdm number" \
  "CONTENTdm file name" \
  children
```


### Inject GeoJSON Annotation Column (bounds_inject.py)

**Purpose**
Adds a new geojson column to the CSV populated with the GeoJSON annotation data from the specified source column. 
Each JSON annotation also has a GeoJSON equivalent which contains the boundary of the georeferenced image. The following script appends .geojson to the end of the annotation URL, downloads geojson, and stores it.

**What it Does**

* Reads the source CSV file

* Processes the Georeference Annotation column

* Creates a new column named geojson

* Stores GeoJSON content for downstream spatial processing

**Command**

```
python python_scripts/bounds_inject.py \
  -source_file "data/Historic Maps.csv" \
  -column_name "Georeference Annotation" \
  -column_extension ".geojson" \
  -new_column "geojson"
```

### Extract Latitude, Longitude, and Area (extract_lat_lng.py)

**Purpose**
Parses the geojson column and calculates spatial attributes.

**What it Does**

* Reads GeoJSON geometry

* Computes centroid latitude and longitude

* Calculates area

* Updates the original CSV file in place (--inplace)

**Command**
```
python python_scripts/extract_lat_lng.py \
  "data/Historic Maps.csv" \
  geojson latitude longitude area \
  --inplace
```
### Download Annotation Files (annotation_download.py)

**Purpose**
Downloads annotation files referenced in the CSV.

**What it does**

* Reads the Annotation column

* Downloads associated annotation files

* Saves them to a specified output directory

**Command**

```
python python_scripts/annotation_download.py \
  -source_file "data/Historic Maps.csv" \
  -column_name "Georeference Annotation" \
  -output_folder "annotations"
```

## Harvesting from The Archive at Fort Collins Museaum of Discovery
The `contentdm_item_harvester.py` script is designed to harvest an entire map collection from the **Archive at the Fort Collins Museum of Discovery** (or any similarly organized CONTENTdm collection).

The script is executed **three times**, with each pass retrieving records at a different level of the collection hierarchy to ensure that all parent and child records are captured.

### Harvest Process

**Level 1 – Harvest primary records**

Search for all records matching the initial query (e.g., `scanned+maps`).

**Level 2 – Harvest parent records**

Retrieve the parent records for every item returned in the initial search.

**Level 3 – Harvest missing child records**

Inspect each parent record and retrieve any child records that were not discovered during the initial search.

After the three passes are complete, all harvested records are written to a CSV file. The resulting spreadsheet can then be loaded into the Historic Map Explorer and merged with the main collection.

To make the new dataset available within the application, add a new row to `app.csv` referencing the generated CSV file.

Note: The metadata structure will likely be different from other datasets, be sure to update the referenced column names accordingly!

```bash
python python_scripts/contentdm_item_harvester.py \
    --search-url "https://fchc.contentdm.oclc.org/digital/api/search/collection/hm/searchterm/scanned+maps/maxRecords/1000" \
    --item-base-url "https://fchc.contentdm.oclc.org/digital/api/collections/hm/items/" \
    --output data/fcmod_scanned_maps.csv && \
python python_scripts/contentdm_item_harvester.py \
    --parent-mode \
    --parent-id "parentId" \
    --item-id "id" \
    --child-ids "children" \
    --item-base-url "https://fchc.contentdm.oclc.org/digital/api/collections/hm/items/" \
    --output data/fcmod_scanned_maps.csv && \
python python_scripts/contentdm_item_harvester.py \
    --child-mode \
    --item-id "id" \
    --child-ids "children" \
    --item-base-url "https://fchc.contentdm.oclc.org/digital/api/collections/hm/items/" \
    --output data/fcmod_scanned_maps.csv
```
