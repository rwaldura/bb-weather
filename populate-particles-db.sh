#!/bin/sh

# Two distinct processes write to the database: this one, and
# the aggregator update-db.sh. This database may therefore get busy.
# If a lock is encountered when trying to write, keep on re-trying for ~10 sec.
# See https://www.sqlite.org/c3ref/busy_timeout.html
readonly BUSY_TIMEOUT=11111

cat <<_SQL_
-- deal with concurrency issues by re-trying
PRAGMA busy_timeout = $BUSY_TIMEOUT;

CREATE TABLE IF NOT EXISTS particles(
	tstamp TIMESTAMP NOT NULL, 
	period INTEGER NOT NULL, 
	pm05_mc INTEGER,	-- PM0.5 mass concentration (µg/m3)
	pm1_mc  INTEGER,	-- PM1.0
	pm25_mc INTEGER,	-- PM2.5
	pm4_mc  INTEGER,	-- PM4.0
	pm10_mc INTEGER,	-- PM10 
	pm05_nc INTEGER,	-- PM0.5 number concentration (#/cm3)
	pm1_nc  INTEGER,	-- PM1.0
	pm25_nc INTEGER,	-- PM2.5
	pm4_nc  INTEGER,	-- PM4.0
	pm10_nc INTEGER,	-- PM10 
	tps INTEGER			-- typical particle size (nm)
);
CREATE UNIQUE INDEX IF NOT EXISTS pm_tstamp_period ON particles(tstamp, period);
_SQL_

while read tstamp pm1_mc pm25_mc pm4_mc pm10_mc pm05_nc pm1_nc pm25_nc pm4_nc pm10_nc tps
do
	echo "INSERT INTO particles VALUES(
		$tstamp, 
		2,		-- 2-min sample 
		NULL,	-- pm05_mc is never defined
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
