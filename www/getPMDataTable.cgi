#!/bin/sh
#
# Produce JSON data used to initialize a DataTable.
# Format defined at
# https://developers.google.com/chart/interactive/docs/reference#DataTable_toJSON
#
#

readonly WEATHER_DB=/var/weather/weather.db
db="${1:-$WEATHER_DB}"

##############################################################################
ouput_json_rows()
{
	now=$( date +%s )
	
	sql="
		-- particle matter for the last week
		SELECT 
			tstamp,
			period,
			pm05_mc,
			pm1_mc, 
			pm25_mc,
			pm4_mc,
			pm10_mc,		
			pm05_nc,	
			pm1_nc,	
			pm25_nc,		
			pm4_nc,	
			pm10_nc,		
			tps	
		FROM 
			particles
		WHERE
			period = 2
			AND tstamp >= ($now - 8 * 24 * 60 * 60) -- 1 week ago
	"

	IFS="|" # SQLite column separator
	sqlite3 "$db" "$sql" | while read ts period pm05_mc pm1_mc pm25_mc pm4_mc pm10_mc pm05_nc pm1_nc pm25_nc pm4_nc pm10_nc tps
	do
		echo '
			{ "c": [
				{ "v": '$ts' },
				{ "v": '$period' },
				{ "v": "'$pm05_mc'" },
				{ "v": '$pm1_mc' },
				{ "v": '$pm25_mc' },
				{ "v": '$pm4_mc' },
				{ "v": '$pm10_mc' },
				{ "v": '$pm05_nc' },
				{ "v": '$pm1_nc' },
				{ "v": '$pm25_nc' },
				{ "v": '$pm4_nc' },
				{ "v": '$pm10_nc' },
				{ "v": '$tps' }
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
			"id": "pm05_mc",
			"label": "PM0.5 mass concentration (µg/㎥)",
			"type": "number"
		},
		{
			"id": "pm1_mc",
			"label": "PM1.0 mass concentration (µg/㎥)",
			"type": "number"
		},
		{
			"id": "pm25_mc",
			"label": "PM2.5 mass concentration (µg/㎥)",
			"type": "number"
		},
		{
			"id": "pm4_mc",
			"label": "PM4.0 mass concentration (µg/㎥)",
			"type": "number"
		},
		{
			"id": "pm10_mc",
			"label": "PM10 mass concentration (µg/㎥)",
			"type": "number"
		},
		{
			"id": "pm05_nc",
			"label": "PM0.5 number concentration (#/c㎥)",
			"type": "number"
		},
		{
			"id": "pm1_nc",
			"label": "PM1.0 number concentration (#/c㎥)",
			"type": "number"
		},
		{
			"id": "pm25_nc",
			"label": "PM2.5 number concentration (#/c㎥)",
			"type": "number"
		},
		{
			"id": "pm4_nc",
			"label": "PM4.0 number concentration (#/c㎥)",
			"type": "number"
		},
		{
			"id": "pm10_nc",
			"label": "PM10 number concentration (#/c㎥)",
			"type": "number"
		},		
		{
			"id": "tps",
			"label": "Typical particle size (nm)",
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
