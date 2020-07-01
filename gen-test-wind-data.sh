#!/bin/zsh

limit=${1:-10}
start=${2:-1592881380}

t=$start
repeat $limit
do
	read hour min sec <<< $( date -r $t +"%H %M %S" )
	echo "$t\t$min\t$min"
	(( t += 3 ))
done
