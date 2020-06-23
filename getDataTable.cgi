#!/bin/sh
#
# Produce JSON data used to initialize a DataTable.
# Format defined at
# https://developers.google.com/chart/interactive/docs/reference#DataTable_toJSON
#
# This program takes 2 parameters on the query string: "start" and "end". 
# "End"is optional. Both must be a Unix epoch time value.
#
# Mapping of an angle to heading (compass point) copied from:
# http://cactus.io/hookups/weather/anemometer/davis/hookup-arduino-to-davis-anemometer
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
			strftime('Date(%Y,%m,%d,%H,%M)', tstamp, 'unixepoch', 'localtime'),
			period,
			direction,
			CASE
				WHEN direction IS NULL THEN NULL
			    WHEN direction < 22  THEN 'N'
			    WHEN direction < 67  THEN 'NE'
			    WHEN direction < 112 THEN 'E'
			    WHEN direction < 157 THEN 'SE'
			    WHEN direction < 212 THEN 'S'
			    WHEN direction < 247 THEN 'SW'
			    WHEN direction < 292 THEN 'W'
			    WHEN direction < 337 THEN 'NW'
			    ELSE 'N'
			END AS heading,
			speed AS speed_mph,
			CAST(ROUND(speed * $MPH_KMH) AS INTEGER) AS speed_kmh,
			CAST(ROUND(speed / $MPH_MS ) AS INTEGER) AS speed_ms
		FROM 
			wind
		WHERE
			tstamp BETWEEN $1 AND $2"

	IFS="|" # SQLite default column separator
	sqlite3 "$db" "$sql" | while read ts dt per d h v_mph v_kmh v_ms
	do
		echo '
			{ "c": [
				{ "v": "'$dt'" },
				{ "v": "'$per'" },
				{ "v": "'$d'",     "f": "'$d' degrees" },
				{ "v": "'$h'" },
				{ "v": "'$v_mph'", "f": "'$v_mph' mph" },
				{ "v": "'$v_kmh'", "f": "'$v_kmh' km/h" },
				{ "v": "'$v_ms'",  "f": "'$v_ms' m/s" }
			] },'
	done
}

##############################################################################
# main

# output entire document
echo 'Context-type: text/plain

{
	"cols": [ 
		{
			"id": "tstamp",
			"label": "Timestamp",
			"type": "date"
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
			"id": "heading",
			"label": "Heading",
			"type": "string"
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
	"rows": [ '

# parse query string to get time boundaries
# e.g. "start=12345&end=60899"
IFS="&="
read start start end end <<< "$QUERY_STRING"

ouput_json_rows ${start:-0} ${end:-$(date +%s)}

# conclude
echo '	
		{} 
	]
}
'
