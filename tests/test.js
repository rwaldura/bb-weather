/*
 * Unit tests.
 */
 
const assert = require('assert').strict;
assert.startsWith = function(result, prefix) {
	assert.ok(result && result.startsWith(prefix), '"' + result + '" does not start with "' + prefix + '"');
}

const fs = require('fs');
eval(fs.readFileSync('www/weather.js').toString());	// bite me

// format_direction
assert.startsWith(format_direction(  0), "North ");
assert.startsWith(format_direction( 90), "East ");
assert.startsWith(format_direction(180), "South ");
assert.startsWith(format_direction(270), "West ");

assert.startsWith(format_direction( 10), "North ");
assert.startsWith(format_direction( 12), "NNE ");
assert.startsWith(format_direction( 46), "Northeast ");
assert.startsWith(format_direction(170), "South ");
assert.startsWith(format_direction(192), "SSW ");
assert.startsWith(format_direction(224), "Southwest ");

// wind_speed
assert.equal(    0, wind_speed(0, 1).mph);
assert.equal(  9/4, wind_speed(1, 1).mph);
assert.equal(90/40, wind_speed(10, 10).mph);

// format_speed
assert.equal(0, format_speed(0, 1).mph);
assert.equal(Math.round(9/4), format_speed(60, 1).mph);

// colors
assert.equal("#ff0000", dir2color(  0)); // red
assert.equal("#ffff00", dir2color( 90)); // yellow
assert.equal("#00ff00", dir2color(180)); // green
assert.equal("#0000ff", dir2color(270)); // blue
