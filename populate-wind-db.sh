#!/bin/sh

insert_row()
{
	echo "INSERT INTO wind_log(tstamp, direction, speed) VALUES($1, $2, $3);"
}

echo "CREATE TABLE IF NOT EXISTS wind_log(tstamp TIMESTAMP NOT NULL UNIQUE, direction INTEGER, speed INTEGER);"

#echo "BEGIN;"
n=0

while read line
do
	n=$(( ($n + 1) % 3 ))
	if [ $n -eq 0 ]
	then
#		echo "COMMIT; BEGIN;"
		:
	fi
	insert_row $line
done

#echo "COMMIT;"

