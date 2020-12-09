#!/bin/sh

readonly WEATHER_HOME=/home/debian/bb-weather
readonly PM_HOME=/home/debian/embedded-uart-sps

readonly PM_DATA_SOURCE=${1:-$PM_HOME/sps30-uart/sps30_example_usage}
test -x $PM_DATA_SOURCE || {
	echo "$PM_DATA_SOURCE: must be executable"
	exit 1
}

readonly MANAGE_LOG=$WEATHER_HOME/manage-data-logs.sh
test -x $MANAGE_LOG || {
	echo "$MANAGE_LOG: must be executable"
	exit 1
}

# where the wind data is continuously stored
readonly PM_LOG=/var/weather/log/particles
test -w $( dirname $PM_LOG ) || {
    echo "$PM_LOG: parent directory must be writable"
    exit 1
}

# database for ongoing Particle Matter data
readonly PM_DB=/var/weather/weather.db
test -w $PM_DB || {
	echo "$PM_DB: must be writable"
	exit 1
}

readonly ROTATION_PERIOD=86400

exec $PM_DATA_SOURCE |
	rotatelogs -e -D -l -f -p $MANAGE_LOG -L $PM_LOG $PM_LOG.%Y-%m-%d $ROTATION_PERIOD |
		$WEATHER_HOME/populate-particles-db.sh |
			sqlite3 $PM_DB

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
