#!/bin/sh
#
# Produce JSON data used to initialize a DataTable.
# Format defined at
# https://developers.google.com/chart/interactive/docs/reference#DataTable_toJSON
#
# This program takes no parameters; we always return the last day's worth of 
# wind data, aggregated by minute, AND the last month's, by hour. 
#

readonly WEATHER_DB=/var/weather/weather.db
db="${1:-$WEATHER_DB}"

##############################################################################
ouput_json_rows()
{
	now=$( date +%s )
	
	sql="
		SELECT 
			tstamp, 
			period,
			direction,
			revolutions
		FROM 
			wind
		WHERE
			period = 1
			AND tstamp >= ($now - 25 * 60 * 60) -- 1 day ago
		UNION ALL
		SELECT 
			tstamp, 
			period,
			direction,
			revolutions
		FROM 
			wind
		WHERE
			period = 60
			AND tstamp >= ($now - 31 * 24 * 60 * 60) -- 1 month ago
	"

	IFS="|" # SQLite column separator
	sqlite3 "$db" "$sql" | while read ts per dir revs
	do
		echo '
			{ "c": [
				{ "v": '$ts' },
				{ "v": '$per' },
				{ "v": '$dir' },
				{ "v": '$revs' }
			] },'
	done
}

##############################################################################
output_datatable()
{
	start=$2
	end=$4
	now=$( date +%s )

	ouput_json_rows ${start:-0} ${end:-$now}
}

##############################################################################
# main

# output entire document
echo 'Content-type: application/json

{
	"cols": [ 
		{
			"id": "tstamp",
			"type": "number"
		},
		{
			"id": "period",
			"type": "number"
		},
		{
			"id": "direction",
			"label": "Wind Direction (degrees)",
			"type": "number"
		},
		{
			"id": "revs",
			"label": "Wind Speed (revolutions per period)",
			"type": "number"
		}
	],
	"rows": [ '

# parse query string to get time boundaries
# e.g. "start=12345&end=60899"
#IFS="&="
# SECURITY BUG ALERT: I'm interpolating unsafe data, that's come off the network
#output_datatable $QUERY_STRING
# better (but unsupported, alas) would be:
#read start start end end <<< "$QUERY_STRING"

ouput_json_rows

# conclude with an empty cell to avoid a dangling comma
echo '
		{ "c": [] }
	]
}
'

exit 0
