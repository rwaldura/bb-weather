#!/bin/sh
#
# Produce JSON data used to initialize a DataTable.
# Format defined at
# https://developers.google.com/chart/interactive/docs/reference#dataparam
#
# Takes 2 parameters on the query string: "start" and "end". "End" is
# optional, and must be the second parameter.
#

WEATHER_DB=/var/weather/weather.db
db=${1:-$WEATHER_DB}

parse_qs()
{
	start=${2:-0}
	end=${4:-$( date +%s )}
}

# parse query string to get time boundaries
# e.g. "start=12345&end=60899"
IFS="&="
parse_qs $QUERY_STRING

# output preamble
cat <<_HTML_
Context-type: text/plain

{"cols":[{"id":"Col1","label":"","type":"date"}],
 "rows":[
_HTML_

# output JSON objects as rows
sqlite3 $db <<_SQL_
SELECT 
	json_object(
		'ts', tstamp,
		'dt', strftime('%Y-%m-%d %H:%M:%S', tstamp, 'unixepoch', 'localtime'), 
		'p', period, 
		'd', direction, 
		'v', speed)
	|| ","
FROM 
	wind
WHERE
	tstamp BETWEEN $start AND $end
_SQL_

# output colophon
cat <<_HTML_
{}
 ]
}
_HTML_