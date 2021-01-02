#!/bin/sh

# Two distinct processes write to the database: this one, and
# the aggregator update-db.sh. This database may therefore get busy.
# If a lock is encountered when trying to write, keep on re-trying for ~10 sec.
# See https://www.sqlite.org/c3ref/busy_timeout.html
readonly BUSY_TIMEOUT=11111
echo "PRAGMA busy_timeout = $BUSY_TIMEOUT;"

while read tstamp pm1_mc pm25_mc pm4_mc pm10_mc pm05_nc pm1_nc pm25_nc pm4_nc pm10_nc tps
do
	echo "INSERT INTO particles VALUES(
		$tstamp, 
		2,		-- 2-min sample 
		NULL,	-- pm05_mc is never captured
		$pm1_mc,
		$pm25_mc,
		$pm4_mc,
		$pm10_mc,	
		$pm05_nc,	
		$pm1_nc,
		$pm25_nc,	
		$pm4_nc,
		$pm10_nc,
		$tps	
		);"
done
