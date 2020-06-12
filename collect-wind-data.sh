#!/bin/sh

WIND_DATA_SOURCE=$HOME/bb-weather/anemometer.js
POP_DB=$HOME/bb-weather/populate-wind-db.zsh

# weather database
WIND_DB=/var/log/weather/weather.db

# where the wind data is continuously stored
WIND_LOG=/var/log/weather/wind

# program to split wind data log by day
ROTATE_LOGS=/usr/bin/rotatelogs
LOG_ROTATION_FREQ=86400

# tag with timestamp
exec node $WIND_DATA_SOURCE |
    $ROTATE_LOGS -e -l -f -L $WIND_LOG $WIND_LOG.%Y-%m-%d $LOG_ROTATION_FREQ |
    	zsh $POP_DB |
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

