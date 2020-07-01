#!/bin/sh

echo "CREATE TABLE IF NOT EXISTS wind_log(tstamp TIMESTAMP NOT NULL UNIQUE, direction INTEGER, revolutions INTEGER);"

while read tstamp dir revs
do
	echo "INSERT INTO wind_log(tstamp, direction, revolutions) VALUES($tstamp, $dir, $revs);"
done
