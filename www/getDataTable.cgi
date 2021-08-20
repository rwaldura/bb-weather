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
output_json_rows()
{
	start="$1" # unused
	end="$2"
	
	# per-minute wind data, for the prior day
	day_sql="
		SELECT 
			tstamp, 
			period,
			direction,
			revolutions
		FROM 
			wind
		WHERE
			period = 1
			AND tstamp >= ($end - 25 * 60 * 60)"

	# per-hour aggregated wind data, for the prior month
	month_sql="
		SELECT 
			tstamp, 
			period,
			direction,
			revolutions
		FROM 
			wind
		WHERE
			period = 60
			AND tstamp >= ($end - 32 * 24 * 60 * 60)"

	IFS="|" # SQLite column separator
	sqlite3 "$db" "$day_sql UNION ALL $month_sql" | while read ts per dir revs
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
	start="$2"
	end="$4"
	now=$( date +%s )

	output_json_rows "${start:-0}" "${end:-$now}"
}

##############################################################################
# main

# output entire document
echo 'Content-type: application/json; charset=UTF-8

{
	"cols": [ 
		{
			"id": "tstamp",
			"label": "Timestamp (seconds)",
			"type": "number"
		},
		{
			"id": "period",
			"label": "Period (minutes)",
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

# value of the last parameter on the query string
end="${QUERY_STRING##*=}"

output_datatable start "" end "$end"

# conclude with an empty cell to avoid a dangling comma
echo '
		{ "c": [] }
	]
}
'

exit 0
