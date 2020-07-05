#!/bin/sh
#
# Produce Javascript data used to initialize a DataTable.
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

### BUG
### For JSON, must use:
### "Date(Year, Month, Day, Hours, Minutes, Seconds, Milliseconds)"
### When using this Date String Representation, months are indexed 
### starting at zero (January is month 0, December is month 11). 

##############################################################################
ouput_json_rows()
{
	sql="
		SELECT 
			tstamp, 
			'new Date(' || (tstamp * 1000) || ')',
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
				{ "v": '$ts' },
				{ "v": '$dt' },
				{ "v": '$per' },
				{ "v": '$dir' },
				{ "v": '$rpp' }
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
echo 'Context-type: text/javascript

DATA_TABLE =
{
	"cols": [ 
		{	// column 0
			"id": "tstamp",
			"type": "number"
		},
		{	// column 1
			"id": "datim",
			"type": "datetime"
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
# SECURITY BUG ALERT: I'm interpolating unsafe data, off the network
output_datatable $QUERY_STRING
# better (but unsupported, alas)
#read start start end end <<< "$QUERY_STRING"

# conclude
echo '	
	]
}
'

exit 0
