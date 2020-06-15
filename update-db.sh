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
CREATE TABLE IF NOT EXISTS wind(tstamp INTEGER NOT NULL, period INTEGER NOT NULL, direction INTEGER, speed INTEGER);
CREATE UNIQUE INDEX IF NOT EXISTS wind_tstamp_period ON wind(tstamp, period);

ATTACH DATABASE "$temp_db" AS t;

BEGIN;

-- compute per-minute averages
INSERT OR REPLACE INTO wind
	SELECT 
		(1 * 60) * (tstamp / (1 * 60)), -- round to the lowest minute
		1,
		ROUND(AVG(direction)),
		ROUND(AVG(speed))
	FROM 
		t.wind_log
	WHERE
		tstamp >= (SELECT MAX(tstamp) FROM wind WHERE period = 1) - 1 * 2 * 60
	GROUP BY 1;

-- only keep last 2 minutes in the log
DELETE FROM t.wind_log 
	WHERE tstamp < (SELECT MAX(tstamp) FROM wind WHERE period = 1) - 1 * 2 * 60;
	
-- compute per-3 minute averages
INSERT OR REPLACE INTO wind
	SELECT 
		(3 * 60) * (tstamp / (3 * 60)), -- round to the lowest minute
		3,
		ROUND(AVG(direction)),
		ROUND(AVG(speed))
	FROM 
		wind
	WHERE
		period = 1
		AND tstamp >= (SELECT MAX(tstamp) FROM wind WHERE period = 3) - 3 * 2 * 60
	GROUP BY 1;
	
COMMIT;
_SQL_
