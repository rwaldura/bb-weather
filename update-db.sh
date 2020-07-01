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
CREATE TABLE IF NOT EXISTS wind(tstamp TIMESTAMP NOT NULL, period INTEGER NOT NULL, direction INTEGER, revolutions INTEGER);
CREATE UNIQUE INDEX IF NOT EXISTS wind_tstamp_period ON wind(tstamp, period);

ATTACH DATABASE "$temp_db" AS tmp;

BEGIN;

-- compute per-minute averages
INSERT OR REPLACE INTO wind
	SELECT 
		(1 * 60) * (tstamp / (1 * 60)), -- round to the lowest minute
		1,
		ROUND(AVG(direction)),
		SUM(revolutions)
	FROM 
		tmp.wind_log
	WHERE
		true
	GROUP BY 1;

-- only keep last 2 minutes in the log
-- DELETE FROM t.wind_log 
--	WHERE tstamp < (SELECT MAX(tstamp) FROM wind WHERE period = 1) - 1 * 2 * 60;
	
COMMIT;
_SQL_
