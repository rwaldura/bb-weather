#!/bin/sh

# Two distinct processes write to the database: this one, and
# the aggregator update-db.sh. This database may therefore get busy.
# If a lock is encountered when trying to write, keep on re-trying for ~10 sec.
# See https://www.sqlite.org/c3ref/busy_timeout.html
readonly BUSY_TIMEOUT=11111
echo "PRAGMA busy_timeout = $BUSY_TIMEOUT;"

while read tstamp dir revs ill hum press temp
do
	echo "INSERT INTO wind VALUES($tstamp, 1, $dir, $revs, $ill, $hum, $press, $temp);"
done
