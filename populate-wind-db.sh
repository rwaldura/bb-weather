#!/bin/sh

# Two distinct processes write to the temporary log database: this one, and
# the aggregator update-db.sh. This database may get therefore quite busy.
# If a lock is encountered when trying to write, keep on re-trying for ~1 sec.
# See https://www.sqlite.org/c3ref/busy_timeout.html
readonly BUSY_TIMEOUT=1111

# deal with concurrency issues by re-trying
echo "PRAGMA busy_timeout = $BUSY_TIMEOUT;"

# this database is written to, and deleted, a lot
echo "PRAGMA auto_vacuum = 'full';"

echo "CREATE TABLE IF NOT EXISTS wind_log(tstamp TIMESTAMP NOT NULL UNIQUE, direction INTEGER, revolutions INTEGER);"

while read tstamp dir revs
do
	echo "INSERT INTO wind_log(tstamp, direction, revolutions) VALUES($tstamp, $dir, $revs);"
done
