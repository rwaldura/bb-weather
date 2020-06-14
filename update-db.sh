#!/bin/sh
#
# Every minute, compute time-based aggregates, and write them to database.
# Note we always *overwrite* any existing data. I.e. the input is source of
# truth.
#

WEATHER_DB=/var/weather/weather.db
db=${1:-$WEATHER_DB}

WIND_LOG=/var/weather/log/wind
log=${2:-$WIND_LOG}

# a sample is collected every 3 seconds, or 20 per minute
# look back the last 10 minutes, to make sure we don't miss any
NUM_SAMPLES=222
n=${3:-$NUM_SAMPLES}

# on Debian, XDG_RUNTIME_DIR is a memory filesystem 
# use it if possible -- it's much faster
temp_dir=/tmp
test -d "$XDG_RUNTIME_DIR" && temp_dir=$XDG_RUNTIME_DIR
temp_log=$temp_dir/$(basename $0).$$

tail -$n $log > $temp_log

sqlite3 $db <<_SQL_
CREATE TABLE IF NOT EXISTS wind_1m  (tstamp INTEGER NOT NULL UNIQUE, direction INTEGER, speed INTEGER);
CREATE TABLE IF NOT EXISTS wind_3m  (tstamp INTEGER NOT NULL UNIQUE, direction INTEGER, speed INTEGER);
CREATE TABLE IF NOT EXISTS wind_10m (tstamp INTEGER NOT NULL UNIQUE, direction INTEGER, speed INTEGER);
CREATE TABLE IF NOT EXISTS wind_1h  (tstamp INTEGER NOT NULL UNIQUE, direction INTEGER, speed INTEGER);
-- CREATE UNIQUE INDEX IF NOT EXISTS tstamp_aggr ON wind(tstamp, aggr);

CREATE TEMPORARY TABLE wind_log (tstamp INTEGER, direction INTEGER, speed INTEGER, revs INTEGER);
.mode tabs
.import $temp_log wind_log

BEGIN;

-- compute per-minute averages
INSERT OR REPLACE INTO wind_1m
	SELECT 
		(1 * 60) * (tstamp / (1 * 60)), -- round to the lowest minute
		ROUND(AVG(direction)),
		ROUND(AVG(speed))
	FROM wind_log
	GROUP BY 1;

-- compute per-3 minute averages
INSERT OR REPLACE INTO wind_3m 
	SELECT 
		(3 * 60) * (tstamp / (3 * 60)), -- round to the lowest 3 minutes
		ROUND(AVG(direction)),
		ROUND(AVG(speed))
	FROM wind_1m
	WHERE tstamp > (SELECT MIN(tstamp) FROM wind_log)
	GROUP BY 1;
	
-- compute per-10 minute averages
INSERT OR REPLACE INTO wind_10m 
	SELECT 
		(10 * 60) * (tstamp / (10 * 60)), -- round to the lowest 10 minutes
		ROUND(AVG(direction)),
		ROUND(AVG(speed))
	FROM wind_1m
	WHERE tstamp > (SELECT MIN(tstamp) FROM wind_log)
	GROUP BY 1;

-- compute per-hour averages
INSERT OR REPLACE INTO wind_1h
	SELECT 
		(60 * 60) * (tstamp / (60 * 60)), -- round to the lowest hour
		ROUND(AVG(direction)),
		ROUND(AVG(speed))
	FROM wind_1m
	WHERE tstamp > (SELECT MIN(tstamp) FROM wind_log)
	GROUP BY 1;
	
COMMIT;
_SQL_

rm $temp_log
