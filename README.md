# Historic Map Viewer  
An interactive web‐viewer for historic maps, created through a partnership between CSU Libraries Archives & Special Collections and the Geospatial Centroid. This project is made possible by the generous support of John Garing and Janice Hill.

Special thanks to Kasper Evenson, Bronson Griswold, Violet Sparks, and Cy Spears for their care in georeferencing these maps and for their metadata support.

## Table of Contents
1. Overview
2. Project Features
2. Interface Features
3. Getting Started
4. Directory Structure
5. Usage
6. Development
7. Build & Deployment
8. License
9. Acknowledgements & Contacts
10. Future Roadmap

## Overview
The Historic Map Viewer is a lightweight, browser‑based map viewer for exploring historic map imagery via a simple web interface. 
The interface design is based on [Scholars GeoPortal](https://geo.scholarsportal.info/) 
and the imagery source is made possible through the [Allmaps](https://allmaps.org/) 
[IIIF georeferencing extension](https://iiif.io/api/extension/georef/), [Allmaps Editor](https://editor.allmaps.org/), and the [Leaflet WarpedMapLayer library](https://allmaps.org/docs/packages/leaflet/).
This application relies on an IIIF Image Server, which in this case, uses a CONTENTdm instance [archives.mountainscholar.org](https://archives.mountainscholar.org/).


## Project Features
- Static HTML application, enables free hosting via [GitHub Pages](https://docs.github.com/en/pages) 
- CSV data source, offers a human-readable, easy to update, and host database solution.
- Configuration via app.csv, controls how the data source is represented (i.e. field to display, filter, etc)
- Python scripts for data prep, see associated [README.md](https://github.com/GeospatialCentroid/historic_map_viewer/tree/main/python_scripts)
- Build with internationalization in mind using i18n
- MIT licensed

## Interface Feature
- Data filtering via:
  - Year search
  - Map bounds
  - Any other metadata field, determined within app.csv
- Layer display, both on the map, and via a separate display area
- Layer adjustments includes
  - Transparency
  - Color Keying (based on dominant image color)
  - Reordering
  - Side by Side image masking
- Metadata Access
- Child record nesting, allowing a parent record to group child
- Geolocation

## Getting Started
```
git clone https://github.com/GeospatialCentroid/historic_map_viewer.git
cd historic_map_viewer
python -m http.server 8000
```

## Directory Structure
```
css/ - styles sheets
js/ - javascript libraries
data/ - data source folder
i18n/ - internationalization
python_scripts/ -- python scripts for populating data source columns
index.html - main entry point to the program
```

## Usage
1. Place map data table into `data/`
1. Amend data file to conform to requirements
1. Update app.csv


### Data Source Requirements
The web interface has been built to support a tabular data source with any columns. 
Aside from a required unique column id for each record, there are specific columns that enable enhanced functionality.

#### Unique ID Column
It should be noted that a unique id column is required for each row. 
Since CONTENTdm IDs are only unique within their collection, a composite key is required. This has been achieved by combining the collection column, plus a "-", followed by the CONTENTdm number (e.g p17393coll70-3). 

#### Children Column
To support parent child relationships, commonly referred to as composite records in CONTENTdm, a comma separated self-referencing column is needed.
To populate this column via automation, use the python_scripts/fetch_children.py script.

#### GeoJSON
A column containing GeoJSON allows filtering a map using its footprint. 
To populate this column via automation, use the python_scripts/bounds_inject.py script.

#### Latitude and longitude
A column containing latitude and longitude values enables the web map to show the location of scanned maps. 
To populate this column via automation, use the python_scripts/extract_lat_lng.py script. 
Note that you'll first need to have the geojson values populated.


### Application Configuration
| Column             | Description                                                                               | Example |
|--------------------|-------------------------------------------------------------------------------------------|---------|
| name               | Display name of the application or dataset configuration                                 | Colorado State University Libraries Historic Map Viewer |
| type               | Type/category of dataset being described                                                 | section |
| data               | Path to the source data file and its format                                              | "data/Historic Maps.csv,csv" |
| id_col             | Column in the data file used as the primary identifier                                   | CONTENTdm number |
| unique_id_col      | A guaranteed-unique identifier column in the dataset                                     | id |
| title_col          | Column containing the title to display for each item                                     | Title |
| separated_cols     | Comma-separated list of columns whose values contain multiple delimited items            | Date Search,Category,Keywords |
| filter_cols        | Columns available as filters in the UI                                                   | Category,Keywords,Scale,Creator |
| annotation_col     | Column containing georeferencing or annotation text                                      | Georeference Annotation |
| image_col          | Column used to get thumbnail image or primary image reference                            | thumbnail |
| show_cols          | Columns shown in a details view                                                          | Creator,Date,Description,Abstract,Respository, Rights,Rights DPLA,Permanent Identifier,Related Resource,Date created,Date modified,By,georeference,Category |
| year_start_col     | Column used to derive the start year for temporal filtering                              | Date Search |
| date_col           | Column containing the human-readable date                                                | Date |
| creator_col        | Column containing creator/author information                                             | Creator |
| base_url           | Base URL for CONTENTdm API single-item requests                                          | https://archives.mountainscholar.org/digital/api/singleitem/collection/ |
| iiif_base_url      | Base URL used for constructing IIIF image references                                     | IIIF |
| ref_url            | Column containing the reference URL to the digital item                                  | "Reference URL" |
| include_col        | Columns whose content determines whether item(s) should be included                      | "Georeference Annotation,children" |
| geojson_col        | Column containing GeoJSON for use in filtering via map footprints                        | geojson |
| lat_lng_col        | Column containing the Latitude and longitude values                                      | latitude,longitude |
| disclaimer         | HTML block displayed intro message in the application                                    | <p>Welcome to the Historic Map Viewer!</p> |


## Development
- Organized static web app
- Contributions welcome

## Build & Deployment
Deploy to GitHub Pages, Netlify, or any static host.

## License
MIT License.

## Credits and Acknowledgments
Created by Kevin Worthington, Colorado State University, Geospatial Centroid
Georeferencing and metadata support Kasper Evenson, Bronson Griswold, Violet Sparks, and Cy Spears, Geospatial Centroid Interns

Enhancements supported by OpenAI. (2025). ChatGPT (Dec 3th version) [Large language model]. https://chat.openai.com/chat

The source code used in this project leverages earlier work from the [Geoportal Manager](https://github.com/GeospatialCentroid/geoportal-manager) 
and the [Crop wild relatives](https://github.com/dcarver1/cwrUSA_maps) data access interface.

## Future Roadmap
- Download Map button
- Interface state retention
- Map sharing
- Undo redo functionality
- Analytics

