led=/sys/devices/platform/leds/leds/beaglebone:green:usr

turn_on()
{
	echo 1 > $led$1/brightness
}

turn_off()
{
	echo 0 > $led$1/brightness
}

all_off()
{
	for n in 0 1 2 3
	do
		turn_off $n 
	done
}

blink()
{
	turn_off $1 
	sleep 0.5
	turn_on $1 
	turn_off $1
}

for i in 1 2 3 4 5
do
	for j in 0 1 2 3
	do	
		blink $j
	done
	for j in 3 2 1 0
	do	
		blink $j
	done
done

