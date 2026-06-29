# Georeferencing Instructions

## 1. Select a Map

1. Navigate to the shared spreadsheet:
   https://docs.google.com/spreadsheets/d/1xuOTfghp35hpGhtawuzFbDTBjoO7W4xhG3eyUoRQIvA/edit?usp=sharing

2. Open the **Special Collections Maps** tab.

3. Select a map to georeference.

### Important: Avoid Duplicate Records

Some maps appear more than once because CONTENTdm stores them as **composite records**.

* **Only georeference the image that contains the metadata** (i.e., the row with information populated in the metadata columns).
* This is typically **the second occurrence** of a duplicated item.
* Once all maps in the current tab have been completed, continue to the next tab.

---

## 2. Claim the Map

Before beginning:

1. Enter your name in the **By** column.
2. Change the **Status** column to **`in process`**.
3. Click the link in the **Georeference** column to open the map in the AllMaps Editor.

---

# 3. Georeference the Map in AllMaps

## Draw the Mask

1. Click **Draw Mask**.
2. Trace the mappable portion of the scanned map.

While tracing:

* Use the mouse scroll wheel to zoom in and out.
* Click and drag to pan around the image.
* Double-click to close the polygon when finished.

---

## Add Control Points

1. Click **Georeference**.
2. Navigate the slippy map to the correct geographic location.
3. Add **at least three well-distributed control points**.

Control points should identify locations that exist in both:

* the scanned historic map
* the modern basemap

Good control points include:

* Railroad crossings
* Road intersections
* Building corners
* Stream confluences
* Other clearly identifiable landmarks

### Helpful References

Google Maps is useful because it provides:

* Multiple basemap options
* A search feature
* Current aerial imagery

The **Colorado State Land Board** map is also a helpful reference, particularly the:

* Township/Range layer
* Section layer

---

## Review the Results

1. Open the **Results** tab.
2. Click the button in the lower-right corner to generate the transformation.
3. Click **View in AllMaps Viewer** to evaluate the georeferencing.

If the alignment is not satisfactory:

* Return to the **Georeference** step.
* Add additional control points.
* Re-evaluate the results.

---

# 4. Update the Spreadsheet

After the georeferencing is complete:

1. Copy the **Georeference Annotation URL** and paste it into the **Georeference Annotation** column.
2. Copy the **XYZ Map Tiles URL** and paste it into the **XYZ Map Tiles** column.
3. Change the **Status** column from **`in process`** to **`complete`**.

---

## Workflow Summary

1. Select an available map.
2. Claim the map in the spreadsheet.
3. Open the AllMaps Editor.
4. Draw the mask.
5. Add at least three well-spaced control points.
6. Review and refine the georeferencing if necessary.
7. Copy the generated URLs back into the spreadsheet.
8. Mark the map as **complete**.
