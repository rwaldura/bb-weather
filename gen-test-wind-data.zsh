#!/bin/sh

s=0 # speed
d=0 # direction

while true
do
	t=$( date +%s )
	echo "$t\t$d\t$s\t0"
	s=$(( ($s + 10) % 200 )) 
	d=$(( ($d + 18) % 360 )) 
	sleep 3
done

