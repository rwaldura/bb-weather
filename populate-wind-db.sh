#!/bin/sh

# Two distinct processes write to the database: this one, and
# the aggregator update-db.sh. This database may therefore get busy.
# If a lock is encountered when trying to write, keep on re-trying for ~10 sec.
# See https://www.sqlite.org/c3ref/busy_timeout.html
readonly BUSY_TIMEOUT=11111

cat <<_SQL_
-- deal with concurrency issues by re-trying
PRAGMA busy_timeout = $BUSY_TIMEOUT;

CREATE TABLE IF NOT EXISTS wind(
	tstamp TIMESTAMP NOT NULL, 	-- seconds since epoch
	period INTEGER NOT NULL, 	-- minutes
	direction INTEGER,		-- degrees
	revolutions INTEGER,		-- number per timeperiod
	illuminance INTEGER,		-- lux
	humidity INTEGER,		-- %RH, relative humidity
	pressure INTEGER,		-- millibars
	temperature INTEGER		-- millidegrees Celsius
);
CREATE UNIQUE INDEX IF NOT EXISTS wind_tstamp_period ON wind(tstamp, period);
_SQL_

while read tstamp dir revs ill hum press temp
do
	echo "INSERT INTO wind VALUES($tstamp, 1, $dir, $revs, $ill, $hum, $press, $temp);"
done
