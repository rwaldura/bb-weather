#!/bin/sh
#
# Produce JSON data used to initialize a DataTable.
# Format defined at
# https://developers.google.com/chart/interactive/docs/reference#DataTable_toJSON#
# Takes 2 parameters on the query string: "start" and "end". "End" is
# optional. Both must be a Unix epoch time value.
#

WEATHER_DB=/var/weather/weather.db
db=${1:-$WEATHER_DB}

# parse query string to get time boundaries
# e.g. "start=12345&end=60899"
IFS="&="
set -- $QUERY_STRING
start=${2:-0} ; end=${4:-$( date +%s )}

sql="
SELECT 
	tstamp, 
	strftime('%Y-%m-%d %H:%M:%S', tstamp, 'unixepoch', 'localtime'),
	period,
	direction,
	speed
FROM 
	wind
WHERE
	tstamp BETWEEN $start AND $end"

json_row()
{
	echo '
{ "c": [
	{ "v": "$1", "f": "$2" },
	{ "v": "$3" },
	{ "v": "$4" },
	{ "v": "$5" }
] },'
}

# output rows as JSON objects
IFS="|"
json_rows=$( sqlite3 $db "$sql" | while read row
do
	json_row $row
done )

# output entire document
cat <<_JSON_
Context-type: text/plain

{
	"cols": [ 
		{
			"id": "col1",
			"label": "Timestamp",
			"type": "number"
		},
		{
			"id": "col2",
			"label": "Aggregation Period",
			"type": "number"
		},
		{
			"id": "col3",
			"label": "Wind Direction in Degrees",
			"type": "number"
		},		
		{
			"id": "col4",
			"label": "Wind Speed in MPH",
			"type": "number"
		}
	],
	"rows": [ $json_rows {} ]
}
_JSON_
