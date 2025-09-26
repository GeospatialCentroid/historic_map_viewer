'''
The following file:
- opens a csv file
- loops over a specific column, adding a new extension
- opens the geojson, and injects it into a new column

python3 bounds_inject.py -source_file "data/Groundwater map urls.csv" -column_name Annotation -column_extension "geojson" -new_column "geojson"


'''

import argparse
import csv
import urllib.request,json


parser = argparse.ArgumentParser()
parser.add_argument("-source_file", help="")
parser.add_argument("-column_name", help="")
parser.add_argument("-column_extension", help="")
parser.add_argument("-new_column", help="")

args = parser.parse_args()

# create file with heading - Alias,CDM_page_id,CDM_field,Value
#Input
input_file=open( args.source_file, 'r')
csv_reader = csv.reader(input_file)
data = list(csv_reader)
input_file.close()

# only add the column if it doesn't exist

if(args.new_column not in data[0]):
        data[0].append(args.new_column)
in_col_num=data[0].index(args.column_name)
out_col_num=data[0].index(args.new_column)


for i in range(1, len(data)):
        if not 0 <= out_col_num < len(data[i]):
                with urllib.request.urlopen(data[i][in_col_num]+"."+args.column_extension) as url:
                        data[i].append( str(json.load(url)).replace("'", '"'))
#
#
#

with open(args.source_file, 'w', newline='') as file:
    writer = csv.writer(file)
    writer.writerows(data)