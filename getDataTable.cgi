#!/bin/sh
#
# Produce JSON data used to initialize a DataTable.
# Format defined at
# https://developers.google.com/chart/interactive/docs/reference#DataTable_toJSON#
# Takes 2 parameters on the query string: "start" and "end". "End" is
# optional. Both must be a Unix epoch time value.
#

readonly MPH_KMH=1.609 # convert miles per hour to kilometers per hour
readonly MPH_MS=2.2352 # convert miles per hour to meters per second

readonly WEATHER_DB=/var/weather/weather.db
db="${1:-$WEATHER_DB}"

##############################################################################
ouput_json_rows()
{
	sql="
		SELECT 
			tstamp, 
			strftime('%Y-%m-%d %H:%M', tstamp, 'unixepoch', 'localtime'),
			period,
			direction,
			speed AS speed_mph,
			CAST(ROUND(speed * $MPH_KMH) AS INTEGER) AS speed_kmh,
			CAST(ROUND(speed / $MPH_MS ) AS INTEGER) AS speed_ms
		FROM 
			wind
		WHERE
			tstamp BETWEEN $1 AND $2"

	IFS="|"
	sqlite3 "$db" "$sql" | while read ts dt per dir v_mph v_kmh v_ms
	do
		cat <<-_JSON_
			{ "c": [
				{ "v": "$ts", "f": "$dt" },
				{ "v": "$per", "f": "per $per minutes" },
				{ "v": "$dir", "f": "$dir degrees" },
				{ "v": "$v_mph", "f": "$v_mph mph" },
				{ "v": "$v_kmh", "f": "$v_kmh km/h" },
				{ "v": "$v_ms", "f": "$v_ms m/s" }
			] },
		_JSON_
	done
}

##############################################################################
# main

# output entire document
cat <<_JSON_
Context-type: text/plain

{
	"cols": [ 
		{
			"id": "tstamp",
			"label": "Timestamp",
			"type": "number"
		},
		{
			"id": "period",
			"label": "Aggregation Period",
			"type": "number"
		},
		{
			"id": "direction",
			"label": "Wind Direction (degrees)",
			"type": "number"
		},		
		{
			"id": "speed_mph",
			"label": "Wind Speed (mph)",
			"type": "number"
		},
		{
			"id": "speed_kmh",
			"label": "Wind Speed (km/h)",
			"type": "number"
		},
		{
			"id": "speed_ms",
			"label": "Wind Speed (m/s)",
			"type": "number"
		}
	],
	"rows": [ 
_JSON_

# parse query string to get time boundaries
# e.g. "start=12345&end=60899"
IFS="&="
read start start end end <<< "$QUERY_STRING"
ouput_json_rows ${start:-0} ${end:-$(date +%s)}

# conclude
cat <<_JSON_	
		{} 
	]
}
_JSON_
