//
// Anemometer
//	
// ren@waldura.org, June 2020
// 

const DEBUG = process.env.DEBUG ? true : false

// The formula, given by the wind sensor manufacturer, is:
// V = 9P / 4T (V = speed in mph, P = no. of pulses per sample period
// T = sample period in seconds)
// Here we pick T = 3 hence V = KP with K = 9/12
const T = 3 * 1000 // sample period in ms
const K = 9 / 12
var P = 0 // count of pulses

// pins used
const GPIO7 = 'P9_42'
const AIN0 = 'P9_39'

// our circuit uses a voltage divider to deliver max 1.65V to the ADC (analog reader)
// the analog values, however, describe 100% as 1.8V; so we must remap them, see below
const MAX_VOLTAGE_PERCENT = 1.65 / 1.8
	
const b = require('bonescript')

// install a timer triggered every 3 seconds
setInterval(printWindData, T)

// setup an interrupt handler that counts revolutions of the cups: this gives us the wind speed
b.pinMode(
	GPIO7, 
	b.INPUT, 
	7, // magic mux mode
	'pulldown', // reed switch is open by default: use magnet to close it
	'fast', 
	function (err, x) {
		if (err)
			debug("pinMode: failed " + err)
		else 
			b.attachInterrupt(
				GPIO7, 
				true, // always call handler upon interrupt event
				b.CHANGE, 
				countRevolutions)
	})

// ***************************************************************************
function printWindData()
{
	// timestamp in seconds
	var ts = Math.floor(Date.now() / 1000)
	
	// sample wind direction
	var dir = getWindDirection()
	
	// calculate wind speed
	var V = Math.round(K * P)
	
	// output the lot
	var data = [ts, dir, V, P]
	process.stdout.write(data.join("\t") + "\n")
	
	P = 0 // reset revolution counter
}

// ***************************************************************************
function countRevolutions(err, x)
{
	if (err) {
		debug("countRevolutions: failed " + err)
	} else if (x.attached) {
		debug("countRevolutions: interrupt handler attached")
	} else if (x.value == 1) {
		debug("countRevolutions: switch is now closed, incrementing revs")
		P += 1
	} else {
		debug("countRevolutions: switch is now open")
	}
}

// ***************************************************************************
function getWindDirection()
{
	var value = b.analogRead(AIN0)
	debug("getWindDirection: analog read = " + value.toFixed(2))
	
	// we just read a percentile value; map it to a direction in degrees
	var dir = b.map(value, 0, MAX_VOLTAGE_PERCENT, 0, 359)
	debug("getWindDirection: dir = " + dir.toFixed(2))
	
	return Math.round(dir)
}

// ***************************************************************************
function debug(mesg)
{
	if (DEBUG) process.stderr.write(mesg + "\n")
}
