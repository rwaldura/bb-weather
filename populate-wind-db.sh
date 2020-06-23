#!/bin/sh

echo "CREATE TABLE IF NOT EXISTS wind_log(tstamp TIMESTAMP NOT NULL UNIQUE, direction INTEGER, speed INTEGER);"

echo "BEGIN;"
n=0

while read tstamp dir speed pulses
do
	n=$(( ($n + 1) % 10 ))
	if [ $n -eq 0 ]
	then
		echo "COMMIT; BEGIN;"
	fi
	echo "INSERT INTO wind_log(tstamp, direction, speed) VALUES($tstamp, $dir, $speed);"
done

echo "COMMIT;"

