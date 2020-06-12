#!/bin/sh
# Every minute, update aggregates, and insert into db
#

# where the wind data is continuously stored
WIND_LOG=/var/weather/log/wind

# we generate a sample every 3 seconds, or 20 per minute
# look back ~3 minutes, to make sure we don't miss any
NUM_SAMPLES=200

buffer=/tmp/$(basename $0).$$
tail -$NUM_SAMPLES $WIND_LOG > $buffer

sqllite3 <<_SQL_
CREATE TEMP TABLE raw_wind_data (tstamp TIMESTAMP, direction INTEGER, speed INTEGER, revs INTEGER);
.mode tabs
.import $buffer raw_wind_data

INSERT OR UPDATE INTO wind_minute () VALUES ();
_SQL_
