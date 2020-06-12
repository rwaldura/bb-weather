#!/bin/sh
# Every minute, update aggregates, and insert into db
#

# where the wind data is continuously stored
WIND_LOG=/var/weather/log/wind
source=${1:-$WIND_LOG}

# we generate a sample every 3 seconds, or 20 per minute
# look back 5 minutes, to make sure we don't miss any
NUM_SAMPLES=100

buffer=/tmp/$(basename $0).$$
tail -$NUM_SAMPLES $source > $buffer

sqlite3 <<_SQL_
CREATE TEMP TABLE raw_wind_data (tstamp TIMESTAMP, direction INTEGER, speed INTEGER, revs INTEGER);
.mode tabs
.import $buffer raw_wind_data
INSERT OR REPLACE INTO wind_minute 
	SELECT 
		strftime("%Y-%m-%d %H:%M", tstamp, "unixepoch", "localtime") as minute, 
		AVG(speed) AS speed,
		AVG(direction) AS direction
	FROM raw_wind_data
	GROUP BY minute;
_SQL_
