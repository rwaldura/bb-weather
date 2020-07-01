#!/usr/bin/node
//
// Anemometer
//	
// ren@waldura.org, June 2020
// 

const DEBUG = process.env.DEBUG ? true : false

// The wind speed formula, given by the sensor manufacturer, is:
// V = 9P / 4T
// with:
// V = speed in mph
// P = number of pulses per sample period
// T = sample period in seconds
const T = 3
var P = 0 // count of pulses

const MS = 1000 // milliseconds 
	
// pins used
const GPIO7 = 'P9_42'	// pulse for wind speed
const AIN1 = 'P9_40'	// analog read of wind direction

// our circuit uses a voltage divider to deliver half of 3.3V (max) to the 
// ADC (analog reader)
// the analog values, however, describe 100% as 1.8V; so we must remap them, see below
const MAX_VOLTAGE_PERCENT = (3.3 / 2) / 1.8
	
const b = require('bonescript')

// install a timer triggered every 3 seconds
setInterval(printWindData, T * MS)

// to get the wind speed, use an interrupt handler to count current drops on GPIO7
b.pinMode(
	GPIO7, 
	b.INPUT, 
	7, // magic mux mode
	'pullup', // spinning cups open a switch (current drops) when revolving
	'fast', 
	function (err, x) {
		if (err)
			debug("pinMode: failed " + err)
		else 
			b.attachInterrupt(
				GPIO7, 
				true, // always call handler upon interrupt event
				b.FALLING, 
				countRevolutions)
	})

// ***************************************************************************
function printWindData()
{
	// timestamp in seconds
	let ts = Math.floor(Date.now() / MS)
	
	// sample wind direction
	let dir = getWindDirection()
	
	// client will calculate wind speed according to:
	// const K = 9 / (4 * T)
	// var V = K * P
	
	// output the lot
	var data = [ts, dir, P]
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
	} else {
		debug("countRevolutions: pulse detected!")
		P += 1
	}
}

// ***************************************************************************
function getWindDirection()
{
	var value = b.analogRead(AIN1)
	debug("getWindDirection: analog read %val = " + value.toFixed(2))
	
	// we just read a percentile value; map it to a direction in degrees
	var dir = b.map(value, 0, MAX_VOLTAGE_PERCENT, 0, 359)
	debug("getWindDirection: dir = " + dir.toFixed(2))
	
	return Math.round(dir) % 360
}

// ***************************************************************************
function debug(mesg)
{
	if (DEBUG) process.stderr.write(mesg + "\n")
}
