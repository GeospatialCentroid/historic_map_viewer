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

***What it does***

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
Adds a new geojson column to the CSV by retrieving or generating GeoJSON annotation data from the specified source column.

**What it does**

* Reads the source CSV file

* Processes the Georeference Annotation column

* Creates a new column named geojson

* Stores GeoJSON content for downstream spatial processing

**Command**

```
python python_scripts/bounds_inject.py \
  -source_file "data/Historic Maps.csv" \
  -column_name "Georeference Annotation" \
  -column_extension "geojson" \
  -new_column "geojson"
```

### Extract Latitude, Longitude, and Area (extract_lat_lng.py)

**Purpose**
Parses the geojson column and calculates spatial attributes.

**What it does**

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