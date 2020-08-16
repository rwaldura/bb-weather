/*
 * Unit tests.
 */
 
const assert = require('assert').strict;
assert.startsWith = function(result, prefix) {
	assert.ok(result && result.startsWith(prefix), '"' + result + '" does not start with "' + prefix + '"');
}

// roughest way to do a #include
const fs = require('fs');
eval(fs.readFileSync('www/uom.js').toString());
eval(fs.readFileSync('www/data.js').toString());
eval(fs.readFileSync('www/styling.js').toString());

// format_direction
assert.startsWith(formatDirection(  0), "North ");
assert.startsWith(formatDirection( 90), "East ");
assert.startsWith(formatDirection(180), "South ");
assert.startsWith(formatDirection(270), "West ");

assert.startsWith(formatDirection( 10), "North ");
assert.startsWith(formatDirection( 12), "NNE ");
assert.startsWith(formatDirection( 46), "Northeast ");
assert.startsWith(formatDirection(170), "South ");
assert.startsWith(formatDirection(192), "SSW ");
assert.startsWith(formatDirection(224), "Southwest ");

// wind_speed
assert.equal(    0, wind_speed(0, 1));
assert.equal(  9/4, wind_speed(1, 1));
assert.equal(90/40, wind_speed(10, 10));

// colors
assert.equal("#ff0000", dir2color(  0)); // red
assert.equal("#ffff00", dir2color( 90)); // yellow
assert.equal("#00ff00", dir2color(180)); // green
assert.equal("#0000ff", dir2color(270)); // blue

// format_speed
const G = { 'speed': UNITS_OF_MEASUREMENT.mph };
assert.equal("0 MPH", formatSpeed(0, 1));
assert.equal("2 MPH", formatSpeed(60, 1));

