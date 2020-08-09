#!/bin/sh
#
# Every minute, compute time-based aggregates, and write them to database.
# Note we always *overwrite* any existing data. I.e. the input is source of
# truth.
#
# In practice, we update (or create) the last aggregate only; i.e. the 
# aggregate for the current time period. 
#

readonly SQLITE_FUNCS=/usr/lib/libsqlitefunctions.so
test -r $SQLITE_FUNCS || {
	echo "$SQLITE_FUNCS: must be readable"
	exit 1
}

readonly WEATHER_DB=/var/weather/weather.db
db=${1:-$WEATHER_DB}

date # log timestamp

sqlite3 "$db" <<_SQL_
-- load extra functions like MEDIAN() etc.
SELECT load_extension('$SQLITE_FUNCS');

-- compute 10-min aggregate
INSERT OR REPLACE INTO wind
	SELECT
		(10 * 60) * (tstamp / (10 * 60)), -- round to the lowest timeperiod
		10,
		ROUND(MEDIAN(direction)),
		SUM(revolutions)
	FROM
		wind
	WHERE
		period = 1
		AND tstamp >= (10 * 60) * (strftime('%s', 'now') / (10 * 60))  -- current timeperiod only
	GROUP BY 1;

-- compute 1-hour aggregate
INSERT OR REPLACE INTO wind
	SELECT
		(60 * 60) * (tstamp / (60 * 60)), -- round to the lowest time period
		60,
		ROUND(MEDIAN(direction)),
		SUM(revolutions)
	FROM
		wind
	WHERE
		period = 1		
		AND tstamp >= (60 * 60) * (strftime('%s', 'now') / (60 * 60))  -- current timeperiod only
	GROUP BY 1;
_SQL_

exit $?
