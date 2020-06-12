#!/usr/bin/zsh

typeset -a tuple

print "CREATE TABLE raw_wind_data (tstamp TIMESTAMP, direction INTEGER, speed INTEGER);"

while read line
do
	tuple=( ${=line} )	# split on whitespace
	print "INSERT INTO raw_wind_data (tstamp, direction, speed) VALUES ($tuple[1], $tuple[2], $tuple[3]);"
done
