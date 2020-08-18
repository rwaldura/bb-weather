#!/bin/sh
#
# Every minute, compute time-based aggregates, and write them to database.
# Note we always *overwrite* any existing data. I.e. the input is source of
# truth.
#

readonly SQLITE_FUNCS=/usr/lib/libsqlitefunctions.so
test -r $SQLITE_FUNCS || {
	echo "$SQLITE_FUNCS: must be readable"
	exit 1
}

readonly WEATHER_DB=/var/weather/weather.db
db=${1:-$WEATHER_DB}

# Two distinct processes write to the database: this one, and
# populate-wind-db.sh. This database may therefore get busy.
# If a lock is encountered when trying to write, keep on re-trying for ~10 sec.
# See https://www.sqlite.org/c3ref/busy_timeout.html
readonly BUSY_TIMEOUT=11111

date # log timestamp

sqlite3 "$db" <<_SQL_
-- deal with concurrency issues by re-trying
PRAGMA busy_timeout = $BUSY_TIMEOUT;

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
		-- current and last timeperiod
		AND tstamp >= (10 * 60) * (strftime('%s', 'now') / (10 * 60)) - (10 * 60)
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
		-- current and last timeperiod
		AND tstamp >= (60 * 60) * (strftime('%s', 'now') / (60 * 60)) - (60 * 60)
	GROUP BY 1;
_SQL_

exit $?
