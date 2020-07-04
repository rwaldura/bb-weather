#!/bin/sh
#
# Every minute, compute time-based aggregates, and write them to database.
# Note we always *overwrite* any existing data. I.e. the input is source of
# truth.
#

SQLITE_FUNCS=/usr/lib/libsqlitefunctions.so
test -r $SQLITE_FUNCS || {
	echo "$SQLITE_FUNCS: does not exist, or not readable"
	exit 1
}

WEATHER_DB=/var/weather/weather.db
db=${1:-$WEATHER_DB}
test -w "$db" || {
	echo "$db: does not exist, or is not writable"
	exit 1
}

LOG_DB=/run/weather/wind_log.db
log_db=${2:-$LOG_DB}
test -w "$log_db" || {
	echo "$log_db: does not exist, or is not writable"
	exit 1
}

sqlite3 "$db" <<_SQL_
-- load extra functions like MEDIAN() etc.
SELECT load_extension('$SQLITE_FUNCS');

CREATE TABLE IF NOT EXISTS wind(tstamp TIMESTAMP NOT NULL, period INTEGER NOT NULL, direction INTEGER, revolutions INTEGER);
CREATE UNIQUE INDEX IF NOT EXISTS wind_tstamp_period ON wind(tstamp, period);

ATTACH DATABASE "$log_db" AS t;

BEGIN TRANSACTION;

-- compute per-minute averages
INSERT OR REPLACE INTO wind
	SELECT
		(1 * 60) * (tstamp / (1 * 60)), -- round to the lowest minute
		1,
		ROUND(MEDIAN(direction)),
		SUM(revolutions)
	FROM
		t.wind_log
	GROUP BY 1;

-- only keep last 2 minutes in the log
DELETE FROM t.wind_log
	WHERE tstamp < (SELECT MAX(tstamp) FROM wind) - 1 * 2 * 60;

COMMIT;

DETACH DATABASE t;
_SQL_

exit 0
