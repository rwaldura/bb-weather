#!/bin/sh

WIND_DATA_SOURCE=$HOME/bb-weather/anemometer.js
MANAGE_LOG=$HOME/bb-weather/manage-wind-data.sh

# where the wind data is continuously stored
WIND_LOG=/var/weather/log/wind

ROTATION_PERIOD=86400

# tag with timestamp
exec node $WIND_DATA_SOURCE |
    rotatelogs -l -f -p $MANAGE_LOG -L $WIND_LOG $WIND_LOG.%Y-%m-%d $ROTATION_PERIOD
	
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
