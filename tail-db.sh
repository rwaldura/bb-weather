#!/bin/sh

WEATHER_DB=/var/weather/weather.db
db=${1:-$WEATHER_DB}

limit=${2:-10}

for period in 1m 3m 10m 1h 
do
	echo ".mode columns"
	echo "select '------ $period ------';"
	echo "select strftime('%Y-%m-%d %H:%M', tstamp, 'unixepoch', 'localtime'), direction, speed from wind_$period order by tstamp desc limit $limit;"
done | sqlite3 $db

