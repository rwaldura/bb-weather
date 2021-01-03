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
const T = 60
var P = 0 // count of pulses

const MS = 1000 // milliseconds 
	
// pins used
const AIN1 = 'P9_40'	// analog read of wind direction
const GPIO0_7 = 'P9_42'	// pulse for wind speed

// our circuit uses a voltage divider to deliver half of 3.3V (max) to the 
// ADC (analog reader)
// the analog values, however, describe 100% as 1.8V; so we must remap them
const MAX_VOLTAGE_PERCENT = (3.3 / 2) / 1.8
	
// every T seconds, output wind parameters
setInterval(printWeatherData, T * MS)

// sample wind direction every 8 seconds, such that we take 7 samples per minute,
// and there's a clear median value
const TT = 8
setInterval(collectWindDirection, TT * MS)

// to get the wind speed, use an interrupt handler to count current drops on GPIO7
const bonescript = require('bonescript')

bonescript.pinMode(
	GPIO0_7, 
	bonescript.INPUT, 
	7, // magic mux mode
	'pullup', // spinning cups open a switch (current drops) when revolving
	'fast', 
	function (err, x) {
		if (err)
			debug("pinMode: failed " + err)
		else 
			bonescript.attachInterrupt(
				GPIO0_7, 
				true, // always call handler upon interrupt event
				bonescript.FALLING, 
				countRevolutions) } )

/**************************************************************************/
const directions = [] // list of samples

function collectWindDirection()
{
	const dir = readWindDirection()
	debug("wind dir sample #" + directions.length + " = " + dir)
	directions.push(dir)
}

/*****************************************************************************
 * Prefer median over average when "summing" (aggregating) wind directions. 
 * Median is guaranteed to be a "real" value (one that's in the dataset), 
 * rather than a synthetic one, like average().
 * Consider when the vane is oscillating near North, and returning values
 * close to 0 and 360˚. The mathematical average of those values would
 * not represent the "mean" direction.
 */
function aggregateWindDirection()
{
	return Math.round(median(directions))
}

function average(values)
{
	const sum = values.reduce((previous, current) => current += previous)
	const avg = sum / values.length
	return avg
}

function median(values)
{
	values.sort((a, b) => a - b)
	const middle = (values.length - 1) / 2
	var median;
	if (values.length % 2 != 0) { // odd number of values
		median = values[middle]
	} else { // even 
		const lowMiddle = Math.floor(middle)
		const highMiddle = Math.ceil(middle)
		median = (values[lowMiddle] + values[highMiddle]) / 2		
	}
	return median
}

/**************************************************************************/
function printWeatherData()
{
	// timestamp in seconds
	const ts = Math.floor(Date.now() / MS)
	
	// aggregate all wind direction samples
	const dir = aggregateWindDirection()
	
	// client will calculate wind speed in miles per hour according to:
	// V = 9P / 4T
	
	// output the lot
	const data = [ts, dir, P, 
		readIlluminance(), readHumidity(), readPressure(), readTemperature(),	// internal values
		readHumidity(0), readPressure(0), readTemperature(0)]	// external values
	process.stdout.write(data.join("\t") + "\n")
	
	P = 0 // reset revolution counter
	directions.length = 0 // reset wind directions
}

/**************************************************************************/
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

/**************************************************************************/
function readWindDirection()
{
	const value = bonescript.analogRead(AIN1)
	debug("readWindDirection: analog read %val = " + value.toFixed(2))
	
	// we just read a percentile value; map it to a direction in degrees
	const dir = bonescript.map(value, 0, MAX_VOLTAGE_PERCENT, 0, 359)
	debug("readWindDirection: dir = " + dir.toFixed(2))
	
	return Math.round(dir) % 360
}

/**************************************************************************/
function debug(mesg)
{
	if (DEBUG) process.stderr.write(mesg + "\n")
}

/*************************************************************************
 * Sensor input files are created by kernel modules loaded from 
 * /etc/modules. Modules themselves communicate with hardware sensors via
 * device tree overlays, e.g. BB-BONE-WTHR-01-00B0.dts.
 *
 * Our system has multiple sensors: 5 internal sensors on a cape, inside
 * the sealed enclosure. Three external sensors, mounted outside the
 * enclosure. 
 */
const I2C_DEV = '/sys/bus/i2c/devices/i2c-2/2-00'

// TSL2550 illuminance sensor on Weather cape
const  ILLUMINANCE_INPUT = I2C_DEV + '39/lux1_input'

// HTU21 humidity/temp sensor on Weather cape
const INT_HUMIDITY_INPUT = I2C_DEV + '40/iio:device1/in_humidityrelative_input'
const    INT_TEMP1_INPUT = I2C_DEV + '40/iio:device1/in_temp_input'

// BMP085 pressure/temp sensor on Weather cape
const INT_PRESSURE_INPUT = I2C_DEV + '77/iio:device2/in_pressure_input'
const    INT_TEMP2_INPUT = I2C_DEV + '77/iio:device2/in_temp_input'

// BME280 external sensors: temp/pressure/humidity
const EXT_HUMIDITY_INPUT = I2C_DEV + '76/iio:device2/in_humidityrelative_input'
const EXT_PRESSURE_INPUT = I2C_DEV + '76/iio:device2/in_pressure_input'
const     EXT_TEMP_INPUT = I2C_DEV + '76/iio:device2/in_temp_input'

/**************************************************************************/
function readIlluminance()
{
	return readSensorValue(ILLUMINANCE_INPUT)
}

function readHumidity(internal = 1)
{
	const v = readSensorValue(internal ? INT_HUMIDITY_INPUT : EXT_HUMIDITY_INPUT)
	return Math.round(v / 1000) // to percent
}

function readPressure(internal = 1)
{
	const v = readSensorValue(internal ? INT_PRESSURE_INPUT : EXT_PRESSURE_INPUT)
	return Math.round(v * 10) // to millibars
}

function readTemperature(internal = 1)
{
	var v;
	if (internal) {
		v = readSensorValue(EXT_TEMP_INPUT)
	} else {
		// not clear which sensor I should use, so average both
		const t1 = readSensorValue(INT_TEMP1_INPUT)
		const t2 = readSensorValue(INT_TEMP2_INPUT)
		v = Math.round(average([t1, t2]))		
	}
	return v
}

/*************************************************************************
 * Read a sensor value from its input file, and return a float.
 */
function readSensorValue(file)
{
	var result;

	try {
		const fs = require('fs')
		fs.accessSync(file, fs.constants.R_OK)

		const data = bonescript.readTextFile(file)
		debug("readSensorValue: read >" + data + "< from: " + file)
		result = Number.parseFloat(data) // convert to number
	} catch (e) {
		debug("readSensorValue: not readable: " + file + "; error: " + e)
		if (DEBUG) process.exit(1)
	}

	return result;
}

