#!/bin/sh
#
# Every minute, compute time-based aggregates, and write them to database.
# Note we always *overwrite* any existing data. I.e. the input is source of
# truth.
#

WEATHER_DB=/var/weather/weather.db
db=${1:-$WEATHER_DB}

temp_dir=/tmp
test -d "$XDG_RUNTIME_DIR" && temp_dir=$XDG_RUNTIME_DIR
temp_db=$temp_dir/wind.db

sqlite3 $db <<_SQL_
CREATE TABLE IF NOT EXISTS wind(tstamp INTEGER NOT NULL, aggr CHAR(3) NOT NULL, direction INTEGER, speed INTEGER);
CREATE UNIQUE INDEX IF NOT EXISTS tstamp_aggr ON wind(tstamp, aggr);

ATTACH DATABASE "$temp_db" AS t;

BEGIN;

-- compute per-minute averages
INSERT OR REPLACE INTO wind
	SELECT 
		(1 * 60) * (tstamp / (1 * 60)), -- round to the lowest minute
		"1m",
		ROUND(AVG(direction)),
		ROUND(AVG(speed))
	FROM 
		t.wind_log
	WHERE
		tstamp >= (select max(tstamp) from wind where aggr = "1m") - 2 * 60
	GROUP BY 1;
	
COMMIT;
_SQL_
