/*
 * Unit tests.
 */
 
const assert = require('assert').strict;

const fs = require('fs');
eval(fs.readFileSync('weather.js').toString());	// sue me

// format_direction
assert.match(format_direction(  0), /^N /);
assert.match(format_direction( 90), /^E /);
assert.match(format_direction(180), /^S /);
assert.match(format_direction(270), /^W /);

assert.match(format_direction( 20), /^N /);
assert.match(format_direction( 25), /^NE /);
assert.match(format_direction(170), /^S /);
assert.match(format_direction(205), /^SW /);

// wind_speed
assert.equal(.   0, wind_speed(0, 1).mph);
assert.equal(. 9/4, wind_speed(1, 1).mph);
assert.equal(90/40, wind_speed(10, 10).mph);

// format_speed
assert.equal(Math.round(9/4), format_speed(1, 1).mph);
assert.equal(Math.round(9/4), format_speed(1, 1).mph);

// colors
assert.equal("#ff0000", dir2color(  0)); // red
assert.equal("#ffff00", dir2color( 90)); // yellow
assert.equal("#00ff00", dir2color(180)); // green
assert.equal("#0000ff", dir2color(270)); // blue