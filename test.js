/*
 * Unit tests.
 */
 
// #include "weather.js"

const assert = require('assert').strict;

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
assert.equal(0, wind_speed(0, 1).mph);
assert.equal(9/4, wind_speed(1, 1).mph);
assert.equal(Math.round(9/4), format_speed(1, 1).mph);
