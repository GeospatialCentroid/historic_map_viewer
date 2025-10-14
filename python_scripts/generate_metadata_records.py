'''
The following file:
- opens two csv files
- the first contains metadata exported from CONTENTdm joined with georeferenced annotation information
- the second contains a metadata cross-walk with columns
    - contentdm
    - aardvark
    - default
    - type

- outputs individual metadata records, single json structure, all values in quotes, with special attention to the ones that include the a type of 'array'
Start by looping over the aardvark column values
    for each check if there is an equivalent contentdm field

python3 generate_metadata_records.py -metadata "data/output.csv"  -cross_walk "data/contentdm_aardvark_cross-walk.csv" -file_name_col id -geojson_col geojson -output_folder "output"

'''

import argparse
import pandas as pd
import json
import os
import re
from shapely.geometry.polygon import Polygon
from shapely.geometry import shape

parser = argparse.ArgumentParser()
parser.add_argument("-metadata", help="")
parser.add_argument("-cross_walk", help="")
parser.add_argument("-output_folder", help="")
parser.add_argument("-file_name_col", help="")
parser.add_argument("-geojson_col", help="")

args = parser.parse_args()

#create output folder if not exists
if not os.path.exists( args.output_folder):
    os.makedirs( args.output_folder)

metadata=pd.read_csv(args.metadata, sep=',', encoding = "ISO-8859-1", dtype=str)
cross_walk=pd.read_csv(args.cross_walk, dtype=str)
filtered_cross_walk=cross_walk[cross_walk["aardvark"] !=""]

#there maybe a pattern in the string which is a composite value, i.e edu_colostate_{dct_identifier_sm}
pattern = re.compile(r'\{.+(\})')

# temp filter the metadata
metadata=metadata[0:1]
for m_i,m_r in metadata.iterrows():
    temp_metadata={}
    for c_i,c_r in filtered_cross_walk.iterrows():
        value=""
        if not pd.isnull(c_r["contentdm"]) :
            # if there is a metadata equivalent
            if not pd.isnull(m_r[c_r["contentdm"]]):
                value=m_r[c_r["contentdm"]]
        # you the default value if there isn't a value set
        if value=="" and not pd.isnull(c_r["default"]):
            # use the default value
            value = c_r["default"]
            # check for pattern
            result = pattern.search(value)
            if result:
                composite_value=m_r[result.group()[1:-1]]
                value=value.replace(result.group(),composite_value)

        # Extract the coordinates to create a boundary box
        if args.geojson_col and c_r["contentdm"]==args.geojson_col:
            print(c_r["contentdm"],args.geojson_col,c_r["aardvark"])
            json_obj = json.loads(m_r[args.geojson_col])
            geojson: dict = json_obj["features"][0]["geometry"]
            geom: Polygon = shape(geojson)
            #store the boundary box
            temp_metadata["dcat_bbox"] = "ENVELOPE" + str(geom.bounds)

        # if the value should be an array
        if c_r['type']=='array':
            value=[value]
        elif c_r['type'] == 'dict':
            value = json.loads("{"+value+"}")
        # finally set the attribute value
        if not pd.isnull(c_r["aardvark"]):
            temp_metadata[c_r['aardvark']]=value




    file_path = args.output_folder+"/"+temp_metadata[args.file_name_col]
    json.dump(temp_metadata, open(file_path, 'w'))


