#!/bin/sh
# Every minute, update aggregates, and insert into db
#

WEATHER_DB=/var/weather/weather.db
db=${1:-$WEATHER_DB}

# where the wind data is continuously stored
WIND_LOG=/var/weather/log/wind
source=${2:-$WIND_LOG}

# a sample is collected every 3 seconds, or 20 per minute
# look back the last 5 minutes, to make sure we don't miss any
NUM_SAMPLES=100

buffer=/tmp/$(basename $0).$$
tail -$NUM_SAMPLES $source > $buffer

sqlite3 $db <<_SQL_
CREATE TABLE IF NOT EXISTS wind_1min  (tstamp INTEGER UNIQUE, direction INTEGER, speed INTEGER);
CREATE TABLE IF NOT EXISTS wind_10min (tstamp INTEGER UNIQUE, direction INTEGER, speed INTEGER);
CREATE TABLE IF NOT EXISTS wind_1hr   (tstamp INTEGER UNIQUE, direction INTEGER, speed INTEGER);

CREATE TEMP TABLE raw_wind_data (tstamp TIMESTAMP, direction INTEGER, speed INTEGER, revs INTEGER);
.mode tabs
.import $buffer raw_wind_data

BEGIN;

-- compute per-minute averages
INSERT OR REPLACE INTO wind_1min 
	SELECT 
		60 * (tstamp / 60), -- round to the lowest minute
		ROUND(AVG(direction)),
		AVG(speed)
	FROM raw_wind_data
	GROUP BY 1;
	
-- compute per-10 minute averages
INSERT OR REPLACE INTO wind_10min 
	SELECT 
		60 * 10 * (tstamp / (60 * 10)), -- round to the lowest 10 minutes
		ROUND(AVG(direction)),
		AVG(speed)
	FROM raw_wind_data
	GROUP BY 1;
	
COMMIT;
_SQL_

# 	ON CONFLICT(tstamp) DO UPDATE SET direction = EXCLUDED.direction, speed = EXCLUDED.speed;
