#!/bin/sh

export NODE_PATH=/usr/local/lib/node_modules

readonly WEATHER_HOME=/home/debian/bb-weather

readonly WIND_DATA_SOURCE=${1:-$WEATHER_HOME/anemometer.js}
test -x $WIND_DATA_SOURCE || {
	echo "$WIND_DATA_SOURCE: must be executable"
	exit 1
}

readonly MANAGE_LOG=$WEATHER_HOME/manage-data-logs.sh
test -x $MANAGE_LOG || {
	echo "$MANAGE_LOG: must be executable"
	exit 1
}

# where the wind data is continuously stored
readonly WIND_LOG=/var/weather/log/wind
test -w $( dirname $WIND_LOG ) || {
    echo "$WIND_LOG: parent directory must be writable"
    exit 1
}

# database for ongoing wind data
readonly WIND_DB=/var/weather/weather.db
test -w $WIND_DB || {
	echo "$WIND_DB: must be writable"
	exit 1
}

readonly ROTATION_PERIOD=86400

exec $WIND_DATA_SOURCE |
	rotatelogs -e -D -l -f -p $MANAGE_LOG -L $WIND_LOG $WIND_LOG.%Y-%m-%d $ROTATION_PERIOD |
		$WEATHER_HOME/populate-wind-db.sh |
			sqlite3 $WIND_DB

# rotatelogs
#  -v       Verbose operation. Messages are written to stderr.
#  -l       Base rotation on local time instead of UTC.
#  -L path  Create hard link from current log to specified path.
#  -p prog  Run specified program after opening a new log file. See below.
#  -f       Force opening of log on program start.
#  -D       Create parent directories of log file.
#  -t       Truncate logfile instead of rotating, tail friendly.
#  -e       Echo log to stdout for further processing.
#  -c       Create log even if it is empty.
