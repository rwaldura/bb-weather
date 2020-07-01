#!/bin/sh

limit=${1:-10}

WEATHER_DB=/var/weather/weather.db
db=${2:-$WEATHER_DB}

for period in 1 3 10 60
do
	echo ".mode columns"
	echo "select '------ $period mins ------';"
	echo "select strftime('%Y-%m-%d %H:%M', tstamp, 'unixepoch', 'localtime'), direction, revolutions from wind where period=$period order by tstamp desc limit $limit;"
done | sqlite3 $db

