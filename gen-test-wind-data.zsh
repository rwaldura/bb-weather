#!/bin/sh

s=0 # speed
d=0 # direction

while true
do
	ts=$( date +%s )
	echo "$ts\t$d\t$s\t0"
	sleep 3
	s=$(( ($s + 10) % 200 )) 
	d=$(( ($d + 18) % 360 )) 
done

