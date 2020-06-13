#!/bin/sh
#
#
# rotatelogs will execute the specified program every time a new log file is
# opened. The filename of the newly opened file is passed as the first
# argument to the program. If executing after a rotation, the old log file
# is passed as the second argument. rotatelogs does not wait for the specified
# program to terminate before continuing to operate, and will not log any
# error code returned on termination. The spawned program uses the same
# stdin, stdout, and stderr as rotatelogs itself, and also inherits the
# environment.
#

$NEW_LOG="$1"
$OLD_LOG="$2"

if test -f "$OLD_LOG"
then
	# compress the log
	gzip "$OLD_LOG"
	# and upload it to the Cloud
	# @todo
fi
