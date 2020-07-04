#!/bin/sh

WIND_DATA_SOURCE=${1:-$HOME/bb-weather/anemometer.js}
test -x $WIND_DATA_SOURCE || {
	echo "$WIND_DATA_SOURCE: must be executable"
	exit 1
}

MANAGE_LOG=$HOME/bb-weather/manage-wind-data.sh

# where the wind data is continuously stored
WIND_LOG=/var/weather/log/wind
test -w $( dirname $WIND_LOG ) || {
        echo "$WIND_LOG: parent directory must be writable"
        exit 1
}

# temporary database for ongoing wind data
WIND_DB=/run/weather/wind_log.db
mkdir /run/weather
test -w $( dirname $WIND_DB ) || {
	echo "$WIND_DB: parent directory must be writable"
	exit 1
}

ROTATION_PERIOD=86400

exec $WIND_DATA_SOURCE |
	rotatelogs -e -D -l -f -p $MANAGE_LOG -L $WIND_LOG $WIND_LOG.%Y-%m-%d $ROTATION_PERIOD |
		$HOME/bb-weather/populate-wind-db.sh |
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
