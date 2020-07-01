#!/bin/sh
#
# Produce JSON data used to initialize a DataTable.
# Format defined at
# https://developers.google.com/chart/interactive/docs/reference#DataTable_toJSON
#
# This program takes 2 parameters on the query string: "start" and "end". 
# "End" is optional. Both must be a Unix epoch time value.
# 
# As an optimization, we return all aggregates: by minute, by hour, etc. 
# Up to the client to split out by aggregate. 
#

readonly WEATHER_DB=/var/weather/weather.db
db="${1:-$WEATHER_DB}"

##############################################################################
ouput_json_rows()
{
	sql="
		SELECT 
			tstamp, 
			strftime('new Date(%Y,%m,%d,%H,%M)', tstamp, 'unixepoch', 'localtime'),
			period,
			direction,
			revolutions
		FROM 
			wind
		WHERE
			tstamp BETWEEN $1 AND $2"

	IFS="|" # SQLite default column separator
	sqlite3 "$db" "$sql" | while read ts dt per dir rpp
	do
		echo '
			{ "c": [
				{ "v": "'$ts'" },
				{ "v": '$dt' },
				{ "v": "'$per'" },
				{ "v": "'$dir'" },
				{ "v": "'$rpp'" }
			] },'
	done
}

##############################################################################
# main

# output entire document
echo 'Context-type: text/plain

{
	"cols": [ 
		{	// column 0
			"id": "tstamp",
			"type": "number"
		},
		{	// column 1
			"id": "datim",
			"type": "date"
		},
		{	// column 2
			"id": "period",
			"type": "number"
		},
		{	// column 3
			"id": "direction",
			"label": "Wind Direction (degrees)",
			"type": "number"
		},		
		{	// column 4
			"id": "revs",
			"label": "Wind Speed (revolutions per period)",
			"type": "number"
		}
	],
	"rows": [ '

# parse query string to get time boundaries
# e.g. "start=12345&end=60899"
IFS="&="
read start start end end <<< "$QUERY_STRING"

ouput_json_rows ${start:-0} ${end:-$(date +%s)}

# conclude
echo '	
	]
}
'
