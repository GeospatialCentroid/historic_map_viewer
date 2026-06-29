# Historic Map Explorer  
An interactive web viewer for historic maps, developed through a partnership between **CSU Libraries Archives & Special Collections** and the **Geospatial Centroid**.

The **Historic Map Explorer** is a lightweight, browser-based application for discovering and exploring historic map collections through an intuitive web interface. Designed for simplicity and ease of deployment, it can be hosted using standard static web hosting without the need for a database or server-side application.

Map records are stored as rows in one or more CSV files (known as sections), making collections easy to create, maintain, and share. A configuration file (app.csv) defines how these records are presented, including the searchable facets available to users and the metadata displayed on each map's detail page.

This project is made possible by the generous support of John Garing and Janice Hill.

Special thanks to Kasper Evenson, Bronson Griswold, Violet Sparks, and Cy Spears for their care in georeferencing these maps and for their metadata support.


## Table of Contents
1. Overview
2. Project Features
2. Interface Features
3. Getting Started
4. Directory Structure
5. Usage
1. Georeferencing
6. Development
7. Build & Deployment
8. License
9. Acknowledgements & Contacts
10. Future Roadmap

## Overview

The interface design is based on [Scholars GeoPortal](https://geo.scholarsportal.info/) 
and the imagery source is in largely made possible through the [Allmaps](https://allmaps.org/) 
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
- Download Map button
- Analytics

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
1. Place your map record data table into the `data/` folder for organization. Data tables can be stored elsewhere (even in a google drive folder). Data tables must be saved as a CSV file.
1. Amend the map record data table to conform to requirements (see below).
1. Add your map record data table to the Application Configuration file (app.csv) and adjust the required columns as needed

### Application Configuration columns

The following describes the column names available in the app.csv file. The example value is only a suggestion and can be altered to conform with your map record data table.

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
| latest_col        | Date column (mm/dd/YYYY) for when the map record was added to the explorer application. Used to populate the latest record dropdown                                      | Date created|
| disclaimer         | HTML block displayed intro message in the application                                    | <p>Welcome to the Historic Map Viewer!</p> |

### Map Record Data Table Requirements
 Aside from a required unique column *id* for each record, other specific columns enable enhanced functionality within your map record data table. See below for details on these columns:



#### Unique ID Column
It should be noted that a unique **id** column is required for each row. 
Since CONTENTdm IDs are only unique within their collection, a composite key is required when working with mulitple collections from the same CONTENTdm instance. This has been achieved by combining the collection column with a dash ("-"), followed by the CONTENTdm item reference number (e.g p17393coll70-3, where p17393coll70 is the collection id and 3 is the item reference number). 

Note: Do not use underscores ("_") as these are used internally when combining a 'section' id to the beginning of the record id. To find out more about 'sections' see 

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

#### Area
A column containing the area of the map in km². This allows maps to be sorted by size. 


# Georeferencing

Georeferencing is the process of assigning geographic coordinates to an image so that it can be accurately overlaid on a map. The Historic Map Explorer (HME) supports several types of georeferenced imagery, allowing historic maps to be displayed alongside modern basemaps.

The following georeferenced image formats are supported:

* **International Image Interoperability Framework (IIIF)**
* **PNG and JPEG** (using the Leaflet DistortableImage plug-in)
* **Tile Map Service (TMS)**
* **Web Map Service (WMS)**

---

# IIIF Georeferencing

IIIF images are georeferenced using the **AllMaps Editor**.

To enable this workflow, include a **`georeference`** column in your dataset containing a link to the AllMaps Editor. The URL takes the following form:

```text
https://editor.allmaps.org/#/collection?url={IIIF Manifest URL}
```

For example:

```text
https://editor.allmaps.org/#/collection?url=https://archives.mountainscholar.org/iiif/2/p17393coll164:18005/info.json
```

Once this URL is included in the dataset, the Historic Map Explorer automatically displays a **Georeference this Image** link in the lower-right corner of the image viewer.

For detailed instructions on georeferencing within AllMaps, see **[AllMaps Georeferencing Instructions](allmaps-georeferencing-instructions.md)**.

---

# PNG and JPEG Georeferencing

PNG and JPEG images can be georeferenced directly within the Historic Map Explorer using the **Leaflet DistortableImage** plug-in.

## Workflow

1. Open the image by clicking **View** within the Historic Map Explorer.
2. In the image viewer, click **Georeference this Image**.
3. The image will be placed on the map, centered on the current map view.
4. Drag the image corners until recognizable landmarks align with the underlying basemap.
5. Continue adjusting the image until the alignment is satisfactory.
6. Click the **Copy GeoJSON** (clipboard) button.
7. A dialog will display the corresponding **Layer ID**.
8. Open the CSV file containing your dataset.
9. Locate the row matching the displayed Layer ID.
10. Paste the copied GeoJSON into the **`geojson`** column for that record.

The next time the dataset is loaded, the image will automatically be displayed in its saved georeferenced position.

---

# TMS and WMS Layers

TMS (Tile Map Service) and WMS (Web Map Service) layers are typically created outside of the Historic Map Explorer using GIS software.

These services are generally generated from a georeferenced **GeoTIFF**, which is converted into a tiled image pyramid that can be efficiently streamed over the web. This structure is conceptually similar to how IIIF image pyramids are organized.

Once a TMS or WMS service has been created, it can be referenced within the dataset and displayed by the Historic Map Explorer.







## Development
- Contributions welcome! Please reachout with any features you'd like to see prioritized.


## License
MIT License.

## Credits and Acknowledgments
Created by Kevin Worthington, Colorado State University, Geospatial Centroid
Georeferencing and metadata support Kasper Evenson, Bronson Griswold, Violet Sparks, and Cy Spears, Geospatial Centroid Interns
Extra special thanks to Kasper Evenson for developing a [keyword guide](https://github.com/GeospatialCentroid/historic_map_explorer/blob/main/historic-map-keywords.md) 
and for helping improve the metadata.

Enhancements supported by OpenAI. (2025). ChatGPT (Dec 3th version) [Large language model]. https://chat.openai.com/chat

The source code used in this project leverages earlier work from the [Geoportal Manager](https://github.com/GeospatialCentroid/geoportal-manager) 
and the [Crop wild relatives](https://github.com/dcarver1/cwrUSA_maps) data access interface.

## Future Roadmap

- Interface state retention
- Map sharing
- Undo redo functionality


